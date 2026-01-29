import { Box, CloseButton, HStack, Text } from "@chakra-ui/react";
import type { DrawerWireframe } from "../../types";
import { ButtonRenderer } from "./ButtonRenderer";
import { ContentRenderer } from "./ContentRenderer";

interface Props {
	config: DrawerWireframe;
}

const sizeWidthMap = {
	xs: "200px",
	sm: "300px",
	md: "400px",
	lg: "500px",
	xl: "600px",
	full: "100%",
} as const;

export function DrawerRenderer({ config }: Props) {
	const {
		title,
		placement = "right",
		size = "md",
		closable = true,
		content,
		footer,
	} = config;

	const isHorizontal = placement === "left" || placement === "right";
	const drawerStyle = isHorizontal
		? {
				top: 0,
				bottom: 0,
				[placement]: 0,
				width: sizeWidthMap[size],
				height: "100%",
			}
		: {
				left: 0,
				right: 0,
				[placement]: 0,
				height: sizeWidthMap[size],
				width: "100%",
			};

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
				bg="white"
				boxShadow="xl"
				display="flex"
				flexDirection="column"
				{...drawerStyle}
			>
				{(title || closable) && (
					<Box
						p={4}
						borderBottom="1px"
						borderColor="gray.200"
						display="flex"
						alignItems="center"
						justifyContent="space-between"
					>
						{title && (
							<Text fontWeight="bold" fontSize="lg">
								{title}
							</Text>
						)}
						{closable && <CloseButton />}
					</Box>
				)}
				<Box p={4} flex="1" overflow="auto">
					<ContentRenderer content={content} />
				</Box>
				{footer && (
					<HStack p={4} borderTop="1px" borderColor="gray.200" spacing={2}>
						{footer.actions?.map((btn) => (
							<ButtonRenderer key={btn.label} button={btn} />
						))}
					</HStack>
				)}
			</Box>
		</Box>
	);
}
