import {
	Box,
	Drawer,
	DrawerBody,
	DrawerCloseButton,
	DrawerContent,
	DrawerFooter,
	DrawerHeader,
	DrawerOverlay,
	HStack,
} from "@chakra-ui/react";
import type { DrawerWireframe } from "../../types";
import { ButtonRenderer } from "./ButtonRenderer";
import { ContentRenderer } from "./ContentRenderer";

interface Props {
	config: DrawerWireframe;
}

const sizeMap = {
	xs: "xs",
	sm: "sm",
	md: "md",
	lg: "lg",
	xl: "xl",
	full: "full",
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

	return (
		<Box position="relative" minH="400px" bg="gray.100" borderRadius="md" p={4}>
			<Box
				position="absolute"
				inset={0}
				bg="blackAlpha.300"
				borderRadius="md"
			/>
			<Drawer
				isOpen={true}
				onClose={() => {}}
				placement={placement}
				size={sizeMap[size]}
			>
				<DrawerOverlay bg="transparent" />
				<DrawerContent>
					{title && <DrawerHeader>{title}</DrawerHeader>}
					{closable && <DrawerCloseButton />}
					<DrawerBody>
						<ContentRenderer content={content} />
					</DrawerBody>
					{footer && (
						<DrawerFooter>
							<HStack spacing={2}>
								{footer.actions?.map((btn) => (
									<ButtonRenderer key={btn.label} button={btn} />
								))}
							</HStack>
						</DrawerFooter>
					)}
				</DrawerContent>
			</Drawer>
		</Box>
	);
}
