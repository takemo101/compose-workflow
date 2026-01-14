import {
	Alert,
	AlertDescription,
	AlertIcon,
	AlertTitle,
	Box,
	CloseButton,
	HStack,
	VStack,
} from "@chakra-ui/react";
import type { AlertWireframe } from "../../types";
import { ButtonRenderer } from "./ButtonRenderer";

interface Props {
	config: AlertWireframe;
}

const statusMap = {
	info: "info",
	warning: "warning",
	error: "error",
	success: "success",
} as const;

export function AlertRenderer({ config }: Props) {
	const { alerts } = config;

	return (
		<VStack spacing={3} align="stretch">
			{alerts.map((alert, index) => (
				<Alert
					key={`alert-${index}`}
					status={statusMap[alert.variant]}
					borderRadius="md"
				>
					<AlertIcon />
					<Box flex="1">
						{alert.title && <AlertTitle>{alert.title}</AlertTitle>}
						<AlertDescription>{alert.message}</AlertDescription>
					</Box>
					<HStack spacing={2}>
						{alert.action && <ButtonRenderer button={alert.action} size="sm" />}
						{alert.closable && (
							<CloseButton position="relative" right={-1} top={-1} />
						)}
					</HStack>
				</Alert>
			))}
		</VStack>
	);
}
