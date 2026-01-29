import { Box, CloseButton, HStack, Text } from "@chakra-ui/react";
import type { ModalWireframe } from "../../types";
import { ButtonRenderer } from "./ButtonRenderer";
import { ContentRenderer } from "./ContentRenderer";

interface Props {
	config: ModalWireframe;
}

const sizeWidthMap = {
	xs: "300px",
	sm: "400px",
	md: "500px",
	lg: "700px",
	xl: "900px",
	full: "95%",
} as const;

export function ModalRenderer({ config }: Props) {
	const { title, size = "md", closable = true, content, footer } = config;

	return (
		<Box position="relative" minH="400px" bg="gray.100" borderRadius="md" p={4}>
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
				w={sizeWidthMap[size]}
				maxW="95%"
				maxH="90%"
				overflow="hidden"
				display="flex"
				flexDirection="column"
			>
				<Box
					p={4}
					borderBottom="1px"
					borderColor="gray.200"
					display="flex"
					alignItems="center"
					justifyContent="space-between"
				>
					<Text fontWeight="bold" fontSize="lg">
						{title}
					</Text>
					{closable && <CloseButton />}
				</Box>
				<Box p={4} flex="1" overflow="auto">
					<ContentRenderer content={content} />
				</Box>
				{footer && (
					<HStack
						p={4}
						borderTop="1px"
						borderColor="gray.200"
						justify={
							footer.align === "left"
								? "flex-start"
								: footer.align === "center"
									? "center"
									: "flex-end"
						}
						spacing={2}
					>
						{footer.actions?.map((btn) => (
							<ButtonRenderer key={btn.label} button={btn} />
						))}
					</HStack>
				)}
			</Box>
		</Box>
	);
}
