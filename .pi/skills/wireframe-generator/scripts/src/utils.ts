export function toSafeName(name: string): string {
	return name.replace(
		/[^a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF-]/g,
		"_",
	);
}

export function getButtonColorScheme(variant: string): "blue" | "red" | "gray" {
	switch (variant) {
		case "primary":
			return "blue";
		case "danger":
			return "red";
		default:
			return "gray";
	}
}
