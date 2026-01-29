#!/bin/bash
# =============================================================================
# release.sh - Multi-ecosystem Release Automation Script
# =============================================================================
#
# Usage:
#   ./release.sh [OPTIONS]
#
# Options:
#   --detect              Detect ecosystem and show current version
#   --version <ver>       Specify version to release
#   --dry-run             Show what would be done without executing
#   --version-check <v>   Run hardcoded version check (Phase 0.5)
#   --skip-version-check  Skip Phase 0.5 in full release
#   --update-version <v>  Update version file only
#   --commit <ver>        Commit, tag, and push only
#   --create-release <v>  Create GitHub release only
#   --watch               Watch release workflow
#   --help                Show this help message
#
# Supported Ecosystems:
#   - Rust (Cargo.toml)
#   - Node.js (package.json)
#   - Python (pyproject.toml, setup.py)
#   - Go (go.mod - tag only)
#   - Generic (VERSION file)
#   - Tag-only (no version file)
#
# =============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# =============================================================================
# Helper Functions
# =============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

show_help() {
    sed -n '2,29p' "$0" | sed 's/^# //' | sed 's/^#//'
    exit 0
}

# =============================================================================
# Ecosystem Detection
# =============================================================================

detect_ecosystem() {
    if [[ -f "Cargo.toml" ]]; then
        echo "rust"
    elif [[ -f "package.json" ]]; then
        echo "nodejs"
    elif [[ -f "pyproject.toml" ]]; then
        echo "python-pyproject"
    elif [[ -f "setup.py" ]]; then
        echo "python-setup"
    elif [[ -f "go.mod" ]]; then
        echo "go"
    elif [[ -f "VERSION" ]]; then
        echo "generic"
    else
        echo "tag-only"
    fi
}

check_multiple_ecosystems() {
    local found=()
    [[ -f "Cargo.toml" ]] && found+=("rust:Cargo.toml")
    [[ -f "package.json" ]] && found+=("nodejs:package.json")
    [[ -f "pyproject.toml" ]] && found+=("python:pyproject.toml")
    [[ -f "setup.py" ]] && found+=("python:setup.py")
    [[ -f "go.mod" ]] && found+=("go:go.mod")
    [[ -f "VERSION" ]] && found+=("generic:VERSION")
    
    if [[ ${#found[@]} -gt 1 ]]; then
        log_warning "Multiple ecosystems detected:"
        for item in "${found[@]}"; do
            echo "    - $item"
        done
        log_warning "Using first match: $(detect_ecosystem)"
        echo ""
    fi
}

get_version_file() {
    local ecosystem="$1"
    case "$ecosystem" in
        rust) echo "Cargo.toml" ;;
        nodejs) echo "package.json" ;;
        python-pyproject) echo "pyproject.toml" ;;
        python-setup) echo "setup.py" ;;
        go) echo "go.mod" ;;
        generic) echo "VERSION" ;;
        tag-only) echo "" ;;
    esac
}

get_current_version() {
    local ecosystem="$1"
    
    case "$ecosystem" in
        rust)
            grep '^version = ' Cargo.toml | head -1 | sed 's/version = "\(.*\)"/\1/'
            ;;
        nodejs)
            if command -v jq &> /dev/null; then
                jq -r '.version' package.json
            else
                grep '"version"' package.json | head -1 | sed 's/.*"version": *"\([^"]*\)".*/\1/'
            fi
            ;;
        python-pyproject)
            grep '^version = ' pyproject.toml | head -1 | sed 's/version = "\(.*\)"/\1/'
            ;;
        python-setup)
            grep -o "version=['\"][^'\"]*['\"]" setup.py | head -1 | sed "s/version=['\"]\\([^'\"]*\\)['\"].*/\\1/"
            ;;
        go|tag-only)
            # Get version from latest tag
            git tag --sort=-version:refname 2>/dev/null | head -1 | sed 's/^v//' || echo "0.0.0"
            ;;
        generic)
            cat VERSION 2>/dev/null || echo "0.0.0"
            ;;
    esac
}

# =============================================================================
# Phase 0.5: Version Integrity Check
# =============================================================================

version_check() {
    local ecosystem="$1"
    local new_version="$2"
    local dry_run="${3:-false}"
    local found_issues=0
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  Phase 0.5: Version Integrity Check"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "  Ecosystem:   $ecosystem"
    echo "  New Version: $new_version"
    echo ""
    
    local use_rg=false
    if command -v rg &> /dev/null; then
        use_rg=true
    fi
    
    echo "### Ecosystem-specific patterns"
    echo ""
    
    case "$ecosystem" in
        rust)
            echo "Rust patterns:"
            if [[ "$use_rg" == "true" ]]; then
                rg '#\[command\(version\s*=' --type rust -l 2>/dev/null && found_issues=1 || echo "  - clap hardcoded version: (none)"
                rg 'const\s+VERSION.*=.*"\d+\.\d+' --type rust -l 2>/dev/null && found_issues=1 || echo "  - VERSION constant: (none)"
                rg 'static\s+VERSION.*=.*"\d+\.\d+' --type rust -l 2>/dev/null && found_issues=1 || echo "  - VERSION static: (none)"
            else
                grep -rl '#\[command(version\s*=' --include="*.rs" . 2>/dev/null && found_issues=1 || echo "  - clap hardcoded version: (none)"
                grep -rlE 'const\s+VERSION.*=.*"[0-9]+\.[0-9]+' --include="*.rs" . 2>/dev/null && found_issues=1 || echo "  - VERSION constant: (none)"
            fi
            ;;
        nodejs)
            echo "Node.js patterns:"
            if [[ "$use_rg" == "true" ]]; then
                rg 'const\s+version\s*=\s*["\x27][0-9]+\.[0-9]+' --type js --type ts -l 2>/dev/null && found_issues=1 || echo "  - version constant: (none)"
                rg 'VERSION\s*=\s*["\x27][0-9]+\.[0-9]+' --type js --type ts -l 2>/dev/null && found_issues=1 || echo "  - VERSION constant: (none)"
                rg '\.version\(["\x27][0-9]+\.[0-9]+' --type js --type ts -l 2>/dev/null && found_issues=1 || echo "  - .version() call: (none)"
            else
                grep -rlE 'const\s+version\s*=\s*["\x27][0-9]+\.[0-9]+' --include="*.js" --include="*.ts" . 2>/dev/null && found_issues=1 || echo "  - version constant: (none)"
            fi
            ;;
        python-pyproject|python-setup)
            echo "Python patterns:"
            if [[ "$use_rg" == "true" ]]; then
                rg '__version__\s*=\s*["\x27][0-9]+\.[0-9]+' --type py -l 2>/dev/null && found_issues=1 || echo "  - __version__: (none)"
                rg 'VERSION\s*=\s*["\x27][0-9]+\.[0-9]+' --type py -l 2>/dev/null && found_issues=1 || echo "  - VERSION constant: (none)"
            else
                grep -rlE '__version__\s*=\s*["\x27][0-9]+\.[0-9]+' --include="*.py" . 2>/dev/null && found_issues=1 || echo "  - __version__: (none)"
            fi
            ;;
        go)
            echo "Go patterns:"
            if [[ "$use_rg" == "true" ]]; then
                rg 'var\s+[Vv]ersion\s*=\s*"[0-9]+\.[0-9]+' --type go -l 2>/dev/null && found_issues=1 || echo "  - Version variable: (none)"
                rg 'const\s+[Vv]ersion\s*=\s*"[0-9]+\.[0-9]+' --type go -l 2>/dev/null && found_issues=1 || echo "  - Version constant: (none)"
            else
                grep -rlE 'var\s+[Vv]ersion\s*=\s*"[0-9]+\.[0-9]+' --include="*.go" . 2>/dev/null && found_issues=1 || echo "  - Version variable: (none)"
            fi
            ;;
    esac
    
    echo ""
    echo "### Common patterns (all ecosystems)"
    echo ""
    
    if [[ -f "README.md" ]]; then
        if [[ "$use_rg" == "true" ]]; then
            local badge_match=$(rg 'badge/v?[0-9]+\.[0-9]+\.[0-9]+' README.md 2>/dev/null || true)
            local shield_match=$(rg 'shields\.io.*[0-9]+\.[0-9]+\.[0-9]+' README.md 2>/dev/null || true)
            local install_match=$(rg '@[0-9]+\.[0-9]+\.[0-9]+' README.md 2>/dev/null || true)
        else
            local badge_match=$(grep -E 'badge/v?[0-9]+\.[0-9]+\.[0-9]+' README.md 2>/dev/null || true)
            local shield_match=$(grep -E 'shields\.io.*[0-9]+\.[0-9]+\.[0-9]+' README.md 2>/dev/null || true)
            local install_match=$(grep -E '@[0-9]+\.[0-9]+\.[0-9]+' README.md 2>/dev/null || true)
        fi
        
        if [[ -n "$badge_match" ]]; then
            echo "  - README badge versions found (may need update):"
            echo "$badge_match" | head -3 | sed 's/^/      /'
            found_issues=1
        else
            echo "  - README badges: (none)"
        fi
        
        if [[ -n "$shield_match" ]]; then
            echo "  - Shields.io badges found:"
            echo "$shield_match" | head -3 | sed 's/^/      /'
            found_issues=1
        else
            echo "  - Shields.io badges: (none)"
        fi
        
        if [[ -n "$install_match" ]]; then
            echo "  - Install examples with versions found:"
            echo "$install_match" | head -3 | sed 's/^/      /'
            found_issues=1
        else
            echo "  - Install examples: (none)"
        fi
    else
        echo "  - README.md: (not found)"
    fi
    
    if [[ -d "docs" ]]; then
        local docs_versions=""
        if [[ "$use_rg" == "true" ]]; then
            docs_versions=$(rg 'v[0-9]+\.[0-9]+\.[0-9]+' docs/ -l 2>/dev/null | head -5 || true)
        else
            docs_versions=$(grep -rlE 'v[0-9]+\.[0-9]+\.[0-9]+' docs/ 2>/dev/null | head -5 || true)
        fi
        
        if [[ -n "$docs_versions" ]]; then
            echo "  - Documentation files with version references:"
            echo "$docs_versions" | sed 's/^/      /'
            log_warning "Review these docs manually before release"
        else
            echo "  - Documentation versions: (none)"
        fi
    fi
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    if [[ $found_issues -eq 1 ]]; then
        echo ""
        log_warning "Hardcoded versions detected above"
        echo ""
        echo "Options:"
        echo "  1. Continue anyway"
        echo "  2. Abort and fix manually"
        echo ""
        
        if [[ "$dry_run" != "true" ]]; then
            read -p "Select (1-2): " -n 1 -r
            echo
            if [[ "$REPLY" == "2" ]]; then
                log_info "Aborted. Fix hardcoded versions and retry."
                exit 0
            fi
        else
            log_info "[DRY-RUN] Would prompt for action"
        fi
    else
        log_success "No hardcoded versions found"
    fi
    
    echo ""
}

# =============================================================================
# Version Update Functions
# =============================================================================

update_version() {
    local ecosystem="$1"
    local new_version="$2"
    local dry_run="${3:-false}"
    
    if [[ "$dry_run" == "true" ]]; then
        log_info "[DRY-RUN] Would update version to $new_version in $(get_version_file "$ecosystem")"
        return 0
    fi
    
    case "$ecosystem" in
        rust)
            if [[ "$(uname)" == "Darwin" ]]; then
                sed -i '' "s/^version = \".*\"/version = \"$new_version\"/" Cargo.toml
            else
                sed -i "s/^version = \".*\"/version = \"$new_version\"/" Cargo.toml
            fi
            # Also update Cargo.lock if it exists
            if [[ -f "Cargo.lock" ]]; then
                cargo update --workspace 2>/dev/null || true
            fi
            ;;
        nodejs)
            if command -v npm &> /dev/null; then
                npm version "$new_version" --no-git-tag-version
            elif command -v jq &> /dev/null; then
                jq ".version = \"$new_version\"" package.json > tmp.json && mv tmp.json package.json
            else
                log_error "Neither npm nor jq found. Cannot update package.json"
                exit 1
            fi
            ;;
        python-pyproject)
            if [[ "$(uname)" == "Darwin" ]]; then
                sed -i '' "s/^version = \".*\"/version = \"$new_version\"/" pyproject.toml
            else
                sed -i "s/^version = \".*\"/version = \"$new_version\"/" pyproject.toml
            fi
            ;;
        python-setup)
            if [[ "$(uname)" == "Darwin" ]]; then
                sed -i '' "s/version=['\"][^'\"]*['\"]/version='$new_version'/" setup.py
            else
                sed -i "s/version=['\"][^'\"]*['\"]/version='$new_version'/" setup.py
            fi
            ;;
        generic)
            echo "$new_version" > VERSION
            ;;
        go|tag-only)
            log_info "No version file to update (tag-only ecosystem)"
            ;;
    esac
    
    log_success "Version updated to $new_version"
}

# =============================================================================
# Git Operations
# =============================================================================

get_default_branch() {
    git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@' || echo "main"
}

commit_and_tag() {
    local version="$1"
    local dry_run="${2:-false}"
    local default_branch
    default_branch=$(get_default_branch)
    
    if [[ "$dry_run" == "true" ]]; then
        log_info "[DRY-RUN] Would commit and tag v$version"
        log_info "[DRY-RUN] Would push to origin/$default_branch with tags"
        return 0
    fi
    
    # Check for uncommitted changes
    if [[ -z "$(git status --porcelain)" ]]; then
        log_warning "No changes to commit"
    else
        git add -A
        git commit -m "chore: release v$version"
        log_success "Changes committed"
    fi
    
    # Create tag
    if git tag -l "v$version" | grep -q "v$version"; then
        log_error "Tag v$version already exists"
        log_info "To delete: git tag -d v$version && git push origin :refs/tags/v$version"
        exit 1
    fi
    
    git tag -a "v$version" -m "Release v$version"
    log_success "Tag v$version created"
    
    # Push
    git push origin "$default_branch" --tags
    log_success "Pushed to origin/$default_branch with tags"
}

# =============================================================================
# GitHub Release
# =============================================================================

create_github_release() {
    local version="$1"
    local notes="${2:-}"
    local dry_run="${3:-false}"
    
    if ! command -v gh &> /dev/null; then
        log_error "GitHub CLI (gh) not found. Please install it."
        exit 1
    fi
    
    if [[ "$dry_run" == "true" ]]; then
        log_info "[DRY-RUN] Would create GitHub release v$version"
        return 0
    fi
    
    if [[ -z "$notes" ]]; then
        # Generate notes from commits since last tag
        local last_tag
        last_tag=$(git tag --sort=-version:refname | grep -v "v$version" | head -1 || echo "")
        
        if [[ -n "$last_tag" ]]; then
            notes=$(git log "$last_tag..HEAD" --oneline --no-decorate)
        else
            notes="Initial release"
        fi
    fi
    
    gh release create "v$version" \
        --title "v$version" \
        --notes "$notes"
    
    log_success "GitHub release v$version created"
}

# =============================================================================
# Workflow Monitoring
# =============================================================================

watch_release_workflow() {
    if ! command -v gh &> /dev/null; then
        log_error "GitHub CLI (gh) not found. Please install it."
        exit 1
    fi
    
    log_info "Looking for Release workflow..."
    
    # Try to find a release workflow
    local run_id
    run_id=$(gh run list --workflow=Release --limit 1 --json databaseId -q '.[0].databaseId' 2>/dev/null || \
             gh run list --workflow=release --limit 1 --json databaseId -q '.[0].databaseId' 2>/dev/null || \
             gh run list --workflow=release.yml --limit 1 --json databaseId -q '.[0].databaseId' 2>/dev/null || \
             gh run list --limit 1 --json databaseId -q '.[0].databaseId' 2>/dev/null)
    
    if [[ -z "$run_id" ]]; then
        log_warning "No workflow runs found"
        return 0
    fi
    
    log_info "Watching workflow run $run_id..."
    gh run watch "$run_id"
    
    log_success "Workflow completed"
}

# =============================================================================
# Main Functions
# =============================================================================

show_detection() {
    local ecosystem
    ecosystem=$(detect_ecosystem)
    local version
    version=$(get_current_version "$ecosystem")
    local version_file
    version_file=$(get_version_file "$ecosystem")
    
    check_multiple_ecosystems
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  Ecosystem Detection Results"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "  Ecosystem:       $ecosystem"
    echo "  Version File:    ${version_file:-"(none - tag only)"}"
    echo "  Current Version: $version"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
}

full_release() {
    local version="$1"
    local dry_run="${2:-false}"
    local skip_version_check="${3:-false}"
    
    local ecosystem
    ecosystem=$(detect_ecosystem)
    
    check_multiple_ecosystems
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  Release v$version"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "  Ecosystem:           $ecosystem"
    echo "  Dry Run:             $dry_run"
    echo "  Skip Version Check:  $skip_version_check"
    echo ""
    
    if [[ "$dry_run" != "true" ]]; then
        read -p "Continue with release? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Release cancelled"
            exit 0
        fi
    fi
    
    if [[ "$skip_version_check" != "true" ]]; then
        log_info "Phase 0.5: Version integrity check..."
        version_check "$ecosystem" "$version" "$dry_run"
    else
        log_info "Phase 0.5: Skipped (--skip-version-check)"
    fi
    
    log_info "Phase 1: Updating version..."
    update_version "$ecosystem" "$version" "$dry_run"
    
    log_info "Phase 2: Committing and tagging..."
    commit_and_tag "$version" "$dry_run"
    
    log_info "Phase 3: Creating GitHub release..."
    create_github_release "$version" "" "$dry_run"
    
    if [[ "$dry_run" != "true" ]]; then
        log_info "Phase 3.5: Watching release workflow..."
        watch_release_workflow
    else
        log_info "[DRY-RUN] Phase 3.5: Would watch release workflow"
    fi
    
    echo ""
    log_success "Release v$version completed!"
    echo ""
}

# =============================================================================
# CLI Argument Parsing
# =============================================================================

main() {
    local action=""
    local version=""
    local notes=""
    local dry_run="false"
    local skip_version_check="false"
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --help|-h)
                show_help
                ;;
            --detect)
                action="detect"
                shift
                ;;
            --version|-v)
                version="$2"
                shift 2
                ;;
            --dry-run)
                dry_run="true"
                shift
                ;;
            --version-check)
                action="version-check"
                version="$2"
                shift 2
                ;;
            --skip-version-check)
                skip_version_check="true"
                shift
                ;;
            --update-version)
                action="update-version"
                version="$2"
                shift 2
                ;;
            --commit)
                action="commit"
                version="$2"
                shift 2
                ;;
            --create-release)
                action="create-release"
                version="$2"
                if [[ $# -gt 2 && ! "$3" =~ ^-- ]]; then
                    notes="$3"
                    shift
                fi
                shift 2
                ;;
            --watch)
                action="watch"
                shift
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                ;;
        esac
    done
    
    case "$action" in
        detect)
            show_detection
            ;;
        version-check)
            if [[ -z "$version" ]]; then
                log_error "Version required for --version-check"
                exit 1
            fi
            local ecosystem
            ecosystem=$(detect_ecosystem)
            version_check "$ecosystem" "$version" "$dry_run"
            ;;
        update-version)
            if [[ -z "$version" ]]; then
                log_error "Version required for --update-version"
                exit 1
            fi
            local ecosystem
            ecosystem=$(detect_ecosystem)
            update_version "$ecosystem" "$version" "$dry_run"
            ;;
        commit)
            if [[ -z "$version" ]]; then
                log_error "Version required for --commit"
                exit 1
            fi
            commit_and_tag "$version" "$dry_run"
            ;;
        create-release)
            if [[ -z "$version" ]]; then
                log_error "Version required for --create-release"
                exit 1
            fi
            create_github_release "$version" "$notes" "$dry_run"
            ;;
        watch)
            watch_release_workflow
            ;;
        "")
            if [[ -z "$version" ]]; then
                show_detection
                echo ""
                read -p "Enter version to release: " version
                if [[ -z "$version" ]]; then
                    log_error "Version is required"
                    exit 1
                fi
            fi
            full_release "$version" "$dry_run" "$skip_version_check"
            ;;
    esac
}

main "$@"
