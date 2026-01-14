import {
	Box,
	HStack,
	Modal,
	ModalBody,
	ModalCloseButton,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalOverlay,
} from "@chakra-ui/react";
import type { ModalWireframe } from "../../types";
import { ButtonRenderer } from "./ButtonRenderer";
import { ContentRenderer } from "./ContentRenderer";

interface Props {
	config: ModalWireframe;
}

const sizeMap = {
	xs: "xs",
	sm: "sm",
	md: "md",
	lg: "lg",
	xl: "xl",
	full: "full",
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
			<Modal isOpen={true} onClose={() => {}} size={sizeMap[size]} isCentered>
				<ModalOverlay bg="transparent" />
				<ModalContent position="relative" m={4}>
					<ModalHeader>{title}</ModalHeader>
					{closable && <ModalCloseButton />}
					<ModalBody>
						<ContentRenderer content={content} />
					</ModalBody>
					{footer && (
						<ModalFooter justifyContent={footer.align ?? "right"}>
							<HStack spacing={2}>
								{footer.actions?.map((btn) => (
									<ButtonRenderer key={btn.label} button={btn} />
								))}
							</HStack>
						</ModalFooter>
					)}
				</ModalContent>
			</Modal>
		</Box>
	);
}
