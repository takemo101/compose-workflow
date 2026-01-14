import { Badge } from "@chakra-ui/react";
import type { ReactNode } from "react";

interface Props {
	value: unknown;
	type?: string;
}

export function CellValue({ value, type }: Props): ReactNode {
	if (value === undefined || value === null) return "-";

	switch (type) {
		case "badge":
			return (
				<Badge colorScheme={value === "active" ? "green" : "gray"}>
					{String(value)}
				</Badge>
			);
		case "currency":
			return `¥${Number(value).toLocaleString()}`;
		default:
			return String(value);
	}
}
