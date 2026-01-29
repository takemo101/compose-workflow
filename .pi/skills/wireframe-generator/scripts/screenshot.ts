import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

interface ScreenshotOptions {
	url?: string;
	outputDir?: string;
	width?: number;
	height?: number;
}

interface ScreenshotResult {
	name: string;
	file: string;
	path: string;
}

export async function captureWireframeScreenshots(
	options: ScreenshotOptions = {},
): Promise<ScreenshotResult[]> {
	const {
		url = "http://localhost:5173",
		outputDir = "./screenshots",
		width = 800,
		height = 600,
	} = options;

	fs.mkdirSync(outputDir, { recursive: true });

	const browser = await chromium.launch({ headless: true });
	const page = await browser.newPage({
		viewport: { width, height },
	});

	try {
		console.log(`Navigating to ${url}...`);
		await page.goto(url, { waitUntil: "networkidle" });

		await page.waitForSelector("#wireframe-container", { timeout: 10000 });
		await page.waitForTimeout(500);

		interface ManifestItem {
			name: string;
			type: string;
			file: string;
		}

		let wireframeNames: string[] = [];
		try {
			const manifestRes = await page.evaluate(
				async (): Promise<ManifestItem[]> => {
					const res = await fetch("/wireframes/manifest.json");
					return res.json();
				},
			);
			wireframeNames = manifestRes.map((item) => item.name);
		} catch {
			wireframeNames = await page.evaluate(() => {
				const elements = document.querySelectorAll('[id^="wireframe-"]');
				return Array.from(elements).map((el) =>
					el.id.replace("wireframe-", ""),
				);
			});
		}

		const screenshots: ScreenshotResult[] = [];

		for (const name of wireframeNames) {
			const safeName = name.replace(
				/[^a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF-]/g,
				"_",
			);
			const selector = `#wireframe-${safeName}`;
			const element = page.locator(selector);

			if ((await element.count()) > 0) {
				const filename = `${safeName}.png`;
				const filepath = path.join(outputDir, filename);

				await element.screenshot({ path: filepath });
				console.log(`Screenshot saved: ${filepath}`);

				screenshots.push({
					name,
					file: filename,
					path: filepath,
				});
			}
		}

		return screenshots;
	} finally {
		await browser.close();
	}
}

if (import.meta.url === `file://${process.argv[1]}`) {
	const args = process.argv.slice(2);
	const outputDir = args[0] || "./screenshots";
	const url = args[1] || "http://localhost:5173";

	captureWireframeScreenshots({ url, outputDir })
		.then((screenshots) => {
			console.log(`\nGenerated ${screenshots.length} screenshot(s)`);
			process.exit(0);
		})
		.catch((err: Error) => {
			console.error("Error:", err.message);
			process.exit(1);
		});
}
