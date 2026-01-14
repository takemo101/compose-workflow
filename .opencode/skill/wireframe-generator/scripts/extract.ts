import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import type { WireframeConfig, WireframeManifestItem } from "./types.ts";

interface ExtractedWireframe {
	name: string;
	type: WireframeConfig["type"];
	config: WireframeConfig;
}

export function extractWireframesFromMarkdown(
	mdPath: string,
): ExtractedWireframe[] {
	const content = fs.readFileSync(mdPath, "utf-8");
	const wireframes: ExtractedWireframe[] = [];

	const wireframeBlockRegex = /```yaml\s+wireframe\n([\s\S]*?)```/g;

	for (const match of content.matchAll(wireframeBlockRegex)) {
		const yamlContent = match[1];

		try {
			const data = yaml.load(yamlContent) as WireframeConfig;

			if (data?.screen && data.type) {
				wireframes.push({
					name: data.screen,
					type: data.type,
					config: data,
				});
			}
		} catch (e) {
			const error = e as Error;
			console.warn(`Warning: Failed to parse YAML block: ${error.message}`);
		}
	}

	return wireframes;
}

export function saveWireframesAsJson(
	wireframes: ExtractedWireframe[],
	outputDir: string,
): WireframeManifestItem[] {
	fs.mkdirSync(outputDir, { recursive: true });

	const manifest: WireframeManifestItem[] = [];

	wireframes.forEach((item) => {
		const safeName = item.name.replace(
			/[^a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF-]/g,
			"_",
		);
		const filename = `${safeName}.json`;
		const filepath = path.join(outputDir, filename);

		fs.writeFileSync(filepath, JSON.stringify(item.config, null, 2));

		manifest.push({
			name: item.name,
			type: item.type,
			file: filename,
		});

		console.log(`Generated: ${filepath}`);
	});

	fs.writeFileSync(
		path.join(outputDir, "manifest.json"),
		JSON.stringify(manifest, null, 2),
	);

	return manifest;
}

if (import.meta.url === `file://${process.argv[1]}`) {
	const args = process.argv.slice(2);

	if (args.length < 1) {
		console.error("Usage: npx tsx extract.ts <markdown-file> [output-dir]");
		process.exit(1);
	}

	const mdPath = args[0];
	const outputDir = args[1] || "./public/wireframes";

	if (!fs.existsSync(mdPath)) {
		console.error(`File not found: ${mdPath}`);
		process.exit(1);
	}

	const wireframes = extractWireframesFromMarkdown(mdPath);

	if (wireframes.length === 0) {
		console.error("No wireframe blocks found. Expected: ```yaml wireframe");
		process.exit(1);
	}

	console.log(`Found ${wireframes.length} wireframe(s)`);
	saveWireframesAsJson(wireframes, outputDir);
	console.log("Done!");
}
