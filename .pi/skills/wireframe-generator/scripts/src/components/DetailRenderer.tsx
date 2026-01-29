import {
	Badge,
	Box,
	Button,
	Divider,
	Heading,
	HStack,
	SimpleGrid,
	Text,
	VStack,
} from "@chakra-ui/react";
import type { DetailWireframe } from "../../types";

interface Props {
	config: DetailWireframe;
}

export function DetailRenderer({ config }: Props) {
	const { sections, actions } = config;

	const getButtonColorScheme = (variant: string) => {
		switch (variant) {
			case "primary":
				return "blue";
			case "danger":
				return "red";
			case "secondary":
				return "gray";
			default:
				return "gray";
		}
	};

	const renderValue = (field: { value: string; type?: string }) => {
		switch (field.type) {
			case "badge":
				return <Badge colorScheme="green">{field.value}</Badge>;
			case "link":
				return (
					<Text color="blue.500" textDecoration="underline">
						{field.value}
					</Text>
				);
			default:
				return <Text>{field.value}</Text>;
		}
	};

	return (
		<VStack spacing={6} align="stretch">
			{sections.map((section, sectionIndex) => (
				<Box key={section.title}>
					<Heading size="sm" mb={3}>
						{section.title}
					</Heading>
					<SimpleGrid columns={2} spacing={4}>
						{section.fields.map((field) => (
							<Box key={field.label}>
								<Text fontSize="sm" color="gray.500" mb={1}>
									{field.label}
								</Text>
								{renderValue(field)}
							</Box>
						))}
					</SimpleGrid>
					{sectionIndex < sections.length - 1 && <Divider mt={4} />}
				</Box>
			))}

			{actions && actions.length > 0 && (
				<>
					<Divider />
					<HStack spacing={4}>
						{actions.map((btn) => (
							<Button
								key={btn.label}
								colorScheme={getButtonColorScheme(btn.variant)}
								variant={btn.variant === "ghost" ? "ghost" : "solid"}
							>
								{btn.label}
							</Button>
						))}
					</HStack>
				</>
			)}
		</VStack>
	);
}
