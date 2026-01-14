#!/usr/bin/env npx tsx

import { type ChildProcess, spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
	extractWireframesFromMarkdown,
	saveWireframesAsJson,
} from "./extract.ts";
import { captureWireframeScreenshots } from "./screenshot.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function usage(): void {
	console.log(`
Usage: npx tsx generate.ts <markdown-file> [output-dir]

Arguments:
  markdown-file  Path to the Markdown file containing wireframe YAML blocks
  output-dir     Directory to save screenshots (default: ./assets relative to markdown file)

Example:
  npx tsx generate.ts ../docs/designs/detailed/auth/画面設計書.md
  npx tsx generate.ts ../docs/designs/detailed/auth/画面設計書.md ./screenshots
`);
}

async function waitForServer(url: string, maxRetries = 30): Promise<boolean> {
	for (let i = 0; i < maxRetries; i++) {
		try {
			const res = await fetch(url);
			if (res.ok) return true;
		} catch {}
		await new Promise((r) => setTimeout(r, 500));
	}
	return false;
}

async function main(): Promise<void> {
	const args = process.argv.slice(2);

	if (args.length < 1 || args.includes("--help") || args.includes("-h")) {
		usage();
		process.exit(args.includes("--help") || args.includes("-h") ? 0 : 1);
	}

	const mdPath = path.resolve(args[0]);
	const outputDir = args[1]
		? path.resolve(args[1])
		: path.join(path.dirname(mdPath), "assets");

	if (!fs.existsSync(mdPath)) {
		console.error(`Error: File not found: ${mdPath}`);
		process.exit(1);
	}

	console.log("=== Wireframe Generator ===\n");
	console.log(`Input:  ${mdPath}`);
	console.log(`Output: ${outputDir}\n`);

	console.log("Step 1: Extracting wireframes from Markdown...");
	const wireframes = extractWireframesFromMarkdown(mdPath);

	if (wireframes.length === 0) {
		console.error("Error: No wireframe blocks found in the file.");
		console.log("\nExpected format in Markdown:");
		console.log("```yaml wireframe");
		console.log("screen: Screen Name");
		console.log("type: form");
		console.log("fields:");
		console.log("  - name: email");
		console.log("    label: Email");
		console.log("    type: email");
		console.log("```");
		process.exit(1);
	}

	console.log(`Found ${wireframes.length} wireframe(s)\n`);

	console.log("Step 2: Saving wireframes as JSON...");
	const wireframesDir = path.join(__dirname, "public", "wireframes");
	saveWireframesAsJson(wireframes, wireframesDir);
	console.log();

	console.log("Step 3: Starting preview server...");
	const npxPath = process.platform === "win32" ? "npx.cmd" : "npx";
	const viteProcess: ChildProcess = spawn(npxPath, ["vite", "--port", "5173"], {
		cwd: __dirname,
		stdio: ["ignore", "pipe", "pipe"],
		env: { ...process.env },
	});

	let serverOutput = "";
	viteProcess.stdout?.on("data", (data: Buffer) => {
		serverOutput += data.toString();
	});
	viteProcess.stderr?.on("data", (data: Buffer) => {
		serverOutput += data.toString();
	});

	const serverReady = await waitForServer("http://localhost:5173");

	if (!serverReady) {
		console.error("Error: Failed to start preview server");
		console.error(serverOutput);
		viteProcess.kill();
		process.exit(1);
	}

	console.log("Server started at http://localhost:5173\n");

	console.log("Step 4: Capturing screenshots...");
	try {
		const screenshots = await captureWireframeScreenshots({
			url: "http://localhost:5173",
			outputDir,
		});

		console.log(`\n=== Done! ===`);
		console.log(
			`Generated ${screenshots.length} screenshot(s) in ${outputDir}`,
		);

		screenshots.forEach((s) => {
			console.log(`  - ${s.file}`);
		});
	} catch (err) {
		const error = err as Error;
		console.error("Error capturing screenshots:", error.message);
		viteProcess.kill();
		process.exit(1);
	}

	viteProcess.kill();
	process.exit(0);
}

main().catch((err: Error) => {
	console.error("Fatal error:", err);
	process.exit(1);
});
