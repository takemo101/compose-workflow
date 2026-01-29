import {
	Accordion,
	AccordionButton,
	AccordionIcon,
	AccordionItem,
	AccordionPanel,
	Box,
	Heading,
	Input,
	InputGroup,
	InputLeftElement,
	Tab,
	TabList,
	TabPanel,
	TabPanels,
	Tabs,
	Text,
	VStack,
} from "@chakra-ui/react";
import { FiSearch } from "react-icons/fi";
import type { FaqWireframe } from "../../types";

interface Props {
	config: FaqWireframe;
}

export function FaqRenderer({ config }: Props) {
	const { title, description, items, searchable, categorized } = config;

	const categories = categorized
		? [...new Set(items.map((item) => item.category ?? "その他"))]
		: [];

	const renderFaqList = (faqItems: typeof items) => (
		<Accordion allowMultiple>
			{faqItems.map((item, index) => (
				<AccordionItem key={`faq-${index}`}>
					<h2>
						<AccordionButton py={4}>
							<Box flex="1" textAlign="left" fontWeight="medium">
								{item.question}
							</Box>
							<AccordionIcon />
						</AccordionButton>
					</h2>
					<AccordionPanel pb={4} color="gray.600">
						{item.answer}
					</AccordionPanel>
				</AccordionItem>
			))}
		</Accordion>
	);

	return (
		<VStack spacing={6} align="stretch">
			{(title || description) && (
				<VStack spacing={2} textAlign="center">
					{title && <Heading size="lg">{title}</Heading>}
					{description && <Text color="gray.600">{description}</Text>}
				</VStack>
			)}
			{searchable && (
				<InputGroup maxW="md" mx="auto">
					<InputLeftElement>
						<FiSearch />
					</InputLeftElement>
					<Input placeholder="質問を検索..." />
				</InputGroup>
			)}
			{categorized && categories.length > 1 ? (
				<Tabs variant="soft-rounded" colorScheme="blue">
					<TabList flexWrap="wrap" justifyContent="center">
						{categories.map((category) => (
							<Tab key={category}>{category}</Tab>
						))}
					</TabList>
					<TabPanels>
						{categories.map((category) => (
							<TabPanel key={category} px={0}>
								{renderFaqList(
									items.filter(
										(item) => (item.category ?? "その他") === category,
									),
								)}
							</TabPanel>
						))}
					</TabPanels>
				</Tabs>
			) : (
				renderFaqList(items)
			)}
		</VStack>
	);
}
