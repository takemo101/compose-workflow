import { Box, Text } from "@chakra-ui/react";
import type { WireframeContent } from "../../types";
import { CardGridRenderer } from "./CardGridRenderer";
import { DashboardRenderer } from "./DashboardRenderer";
import { DetailRenderer } from "./DetailRenderer";
import { EmptyStateRenderer } from "./EmptyStateRenderer";
import { FormRenderer } from "./FormRenderer";
import { TableRenderer } from "./TableRenderer";
import { TimelineRenderer } from "./TimelineRenderer";

interface Props {
	content: WireframeContent;
}

export function ContentRenderer({ content }: Props) {
	switch (content.type) {
		case "form":
			return (
				<FormRenderer
					config={{ screen: "", type: "form", ...content.config }}
				/>
			);
		case "table":
			return (
				<TableRenderer
					config={{ screen: "", type: "table", ...content.config }}
				/>
			);
		case "detail":
			return (
				<DetailRenderer
					config={{ screen: "", type: "detail", ...content.config }}
				/>
			);
		case "dashboard":
			return (
				<DashboardRenderer
					config={{ screen: "", type: "dashboard", ...content.config }}
				/>
			);
		case "card-grid":
			return (
				<CardGridRenderer
					config={{ screen: "", type: "card-grid", ...content.config }}
				/>
			);
		case "timeline":
			return (
				<TimelineRenderer
					config={{ screen: "", type: "timeline", ...content.config }}
				/>
			);
		case "empty-state":
			return (
				<EmptyStateRenderer
					config={{ screen: "", type: "empty-state", ...content.config }}
				/>
			);
		case "custom":
			return <Box dangerouslySetInnerHTML={{ __html: content.html }} />;
		default:
			return <Text color="gray.500">Unknown content type</Text>;
	}
}
