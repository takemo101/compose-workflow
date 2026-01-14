import {
	Badge,
	Box,
	Heading,
	HStack,
	Tab,
	TabList,
	TabPanel,
	TabPanels,
	Tabs,
	Text,
	VStack,
} from "@chakra-ui/react";
import type { TabsWireframe } from "../../types";
import { ButtonRenderer } from "./ButtonRenderer";
import { ContentRenderer } from "./ContentRenderer";
import { IconRenderer } from "./IconRenderer";

interface Props {
	config: TabsWireframe;
}

export function TabsRenderer({ config }: Props) {
	const {
		title,
		description,
		tabs,
		variant = "line",
		orientation = "horizontal",
		actions,
	} = config;

	return (
		<VStack spacing={4} align="stretch">
			{(title || description || actions) && (
				<HStack justify="space-between" align="start">
					<Box>
						{title && <Heading size="md">{title}</Heading>}
						{description && (
							<Text color="gray.600" mt={1}>
								{description}
							</Text>
						)}
					</Box>
					{actions && (
						<HStack>
							{actions.map((btn) => (
								<ButtonRenderer key={btn.label} button={btn} />
							))}
						</HStack>
					)}
				</HStack>
			)}
			<Tabs variant={variant} orientation={orientation}>
				<TabList>
					{tabs.map((tab) => (
						<Tab key={tab.label} isDisabled={tab.disabled}>
							<HStack spacing={2}>
								{tab.icon && <IconRenderer icon={tab.icon} />}
								<Text>{tab.label}</Text>
								{tab.badge !== undefined && (
									<Badge colorScheme="blue" borderRadius="full">
										{tab.badge}
									</Badge>
								)}
							</HStack>
						</Tab>
					))}
				</TabList>
				<TabPanels>
					{tabs.map((tab) => (
						<TabPanel key={tab.label} px={0} py={4}>
							<ContentRenderer content={tab.content} />
						</TabPanel>
					))}
				</TabPanels>
			</Tabs>
		</VStack>
	);
}
