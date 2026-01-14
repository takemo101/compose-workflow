import { Box, Heading, HStack, Text, VStack } from "@chakra-ui/react";
import type { EmptyStateWireframe } from "../../types";
import { ButtonRenderer } from "./ButtonRenderer";
import { IconRenderer } from "./IconRenderer";

interface Props {
	config: EmptyStateWireframe;
}

const variantConfig = {
	default: { icon: "inbox" as const, color: "gray.400" },
	error: { icon: "error" as const, color: "red.400" },
	"no-results": { icon: "search" as const, color: "gray.400" },
	"no-permission": { icon: "lock" as const, color: "yellow.500" },
	maintenance: { icon: "settings" as const, color: "blue.400" },
};

export function EmptyStateRenderer({ config }: Props) {
	const { title, description, icon, actions, variant = "default" } = config;
	const defaultIcon = variantConfig[variant]?.icon ?? "inbox";
	const iconColor = variantConfig[variant]?.color ?? "gray.400";

	return (
		<VStack spacing={4} py={12} textAlign="center">
			<Box>
				<IconRenderer
					icon={icon ?? defaultIcon}
					boxSize={16}
					color={iconColor}
				/>
			</Box>
			<Heading size="md" color="gray.700">
				{title}
			</Heading>
			{description && (
				<Text color="gray.500" maxW="md">
					{description}
				</Text>
			)}
			{actions && actions.length > 0 && (
				<HStack spacing={2} pt={2}>
					{actions.map((btn) => (
						<ButtonRenderer key={btn.label} button={btn} />
					))}
				</HStack>
			)}
		</VStack>
	);
}
