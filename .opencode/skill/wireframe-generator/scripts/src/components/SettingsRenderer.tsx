import {
	Box,
	Button,
	Divider,
	Heading,
	HStack,
	Text,
	VStack,
} from "@chakra-ui/react";
import type { SettingsWireframe } from "../../types";
import { FormRenderer } from "./FormRenderer";

interface Props {
	config: SettingsWireframe;
}

export function SettingsRenderer({ config }: Props) {
	const { title, description, sections, sidebar } = config;

	const content = (
		<VStack spacing={8} align="stretch">
			{(title || description) && (
				<Box>
					{title && <Heading size="lg">{title}</Heading>}
					{description && (
						<Text color="gray.600" mt={1}>
							{description}
						</Text>
					)}
				</Box>
			)}
			{sections.map((section, index) => (
				<Box key={section.title}>
					{index > 0 && <Divider mb={6} />}
					<VStack align="stretch" spacing={4}>
						<Box>
							<Heading size="md">{section.title}</Heading>
							{section.description && (
								<Text color="gray.600" fontSize="sm" mt={1}>
									{section.description}
								</Text>
							)}
						</Box>
						<FormRenderer
							config={{
								screen: "",
								type: "form",
								fields: section.fields,
							}}
						/>
					</VStack>
				</Box>
			))}
			<HStack justify="flex-end" pt={4}>
				<Button variant="outline">キャンセル</Button>
				<Button colorScheme="blue">保存</Button>
			</HStack>
		</VStack>
	);

	if (sidebar && sidebar.length > 0) {
		return (
			<HStack align="start" spacing={8}>
				<VStack as="nav" align="stretch" spacing={1} minW="200px" py={2}>
					{sidebar.map((item, index) => (
						<Button
							key={item.label}
							variant={index === 0 ? "solid" : "ghost"}
							colorScheme={index === 0 ? "blue" : "gray"}
							justifyContent="flex-start"
							size="sm"
						>
							{item.label}
						</Button>
					))}
				</VStack>
				<Box flex={1}>{content}</Box>
			</HStack>
		);
	}

	return content;
}
