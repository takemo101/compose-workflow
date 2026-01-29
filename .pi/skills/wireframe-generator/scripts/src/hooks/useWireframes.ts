import { useEffect, useState } from "react";
import type { WireframeConfig, WireframeManifestItem } from "../../types";

export interface LoadedWireframe {
	name: string;
	type: WireframeConfig["type"];
	config: WireframeConfig;
}

interface UseWireframesResult {
	wireframes: LoadedWireframe[];
	loading: boolean;
	error: string | null;
}

export function useWireframes(): UseWireframesResult {
	const [wireframes, setWireframes] = useState<LoadedWireframe[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function loadWireframes() {
			try {
				const manifestRes = await fetch("/wireframes/manifest.json");
				if (!manifestRes.ok) {
					throw new Error("manifest.json not found");
				}
				const manifest: WireframeManifestItem[] = await manifestRes.json();

				const loaded = await Promise.all(
					manifest.map(async (item) => {
						const res = await fetch(`/wireframes/${item.file}`);
						const config: WireframeConfig = await res.json();
						return { name: item.name, type: item.type, config };
					}),
				);

				setWireframes(loaded);
			} catch (e) {
				setError((e as Error).message);
			} finally {
				setLoading(false);
			}
		}

		loadWireframes();
	}, []);

	return { wireframes, loading, error };
}
