import { Box, Button, HStack, Text, VStack } from "@chakra-ui/react";
import type { ConfirmWireframe } from "../../types";
import { getButtonColorScheme } from "../utils";
import { IconRenderer } from "./IconRenderer";

interface Props {
	config: ConfirmWireframe;
}

const variantColorMap = {
	info: "blue",
	warning: "yellow",
	danger: "red",
	success: "green",
} as const;

export function ConfirmRenderer({ config }: Props) {
	const {
		title,
		message,
		variant = "info",
		icon,
		confirmLabel = "確認",
		cancelLabel = "キャンセル",
		confirmVariant = variant === "danger" ? "danger" : "primary",
	} = config;

	const defaultIcon =
		variant === "danger" ? "warning" : variant === "warning" ? "alert" : "info";

	return (
		<Box position="relative" minH="200px" bg="gray.100" borderRadius="md" p={4}>
			<Box
				position="absolute"
				inset={0}
				bg="blackAlpha.300"
				borderRadius="md"
			/>
			<Box
				position="absolute"
				top="50%"
				left="50%"
				transform="translate(-50%, -50%)"
				bg="white"
				borderRadius="md"
				boxShadow="xl"
				maxW="400px"
				w="90%"
				overflow="hidden"
			>
				<Box p={4} borderBottom="1px" borderColor="gray.200">
					<HStack spacing={2}>
						<IconRenderer
							icon={icon ?? defaultIcon}
							color={`${variantColorMap[variant]}.500`}
						/>
						<Text fontWeight="bold" fontSize="lg">
							{title}
						</Text>
					</HStack>
				</Box>
				<Box p={4}>
					<Text>{message}</Text>
				</Box>
				<HStack
					p={4}
					justify="flex-end"
					spacing={3}
					borderTop="1px"
					borderColor="gray.200"
				>
					<Button variant="outline">{cancelLabel}</Button>
					<Button colorScheme={getButtonColorScheme(confirmVariant)}>
						{confirmLabel}
					</Button>
				</HStack>
			</Box>
		</Box>
	);
}
