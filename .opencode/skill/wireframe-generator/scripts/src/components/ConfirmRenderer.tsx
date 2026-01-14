import {
	AlertDialog,
	AlertDialogBody,
	AlertDialogContent,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogOverlay,
	Box,
	Button,
	HStack,
} from "@chakra-ui/react";
import { useRef } from "react";
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
	const cancelRef = useRef<HTMLButtonElement>(null);

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
			<AlertDialog
				isOpen={true}
				onClose={() => {}}
				leastDestructiveRef={cancelRef}
				isCentered
			>
				<AlertDialogOverlay bg="transparent" />
				<AlertDialogContent position="relative" m={4}>
					<AlertDialogHeader>
						<HStack spacing={2}>
							<IconRenderer
								icon={icon ?? defaultIcon}
								color={`${variantColorMap[variant]}.500`}
							/>
							<span>{title}</span>
						</HStack>
					</AlertDialogHeader>
					<AlertDialogBody>{message}</AlertDialogBody>
					<AlertDialogFooter>
						<Button ref={cancelRef} variant="outline">
							{cancelLabel}
						</Button>
						<Button colorScheme={getButtonColorScheme(confirmVariant)} ml={3}>
							{confirmLabel}
						</Button>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</Box>
	);
}
