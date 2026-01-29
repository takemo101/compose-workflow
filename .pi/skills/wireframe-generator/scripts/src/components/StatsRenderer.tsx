import {
	Box,
	Card,
	CardBody,
	Heading,
	HStack,
	SimpleGrid,
	Stat,
	StatArrow,
	StatHelpText,
	StatLabel,
	StatNumber,
	Text,
	VStack,
} from "@chakra-ui/react";
import type { DashboardStat, StatsWireframe } from "../../types";
import { IconRenderer } from "./IconRenderer";

interface Props {
	config: StatsWireframe;
}

function StatCard({ stat, variant }: { stat: DashboardStat; variant: string }) {
	const colorMap = {
		blue: "blue.500",
		green: "green.500",
		red: "red.500",
		yellow: "yellow.500",
		purple: "purple.500",
		gray: "gray.500",
	};
	const bgColorMap = {
		blue: "blue.50",
		green: "green.50",
		red: "red.50",
		yellow: "yellow.50",
		purple: "purple.50",
		gray: "gray.50",
	};

	const iconColor = stat.color ? colorMap[stat.color] : "blue.500";
	const iconBg = stat.color ? bgColorMap[stat.color] : "blue.50";

	if (variant === "simple") {
		return (
			<Stat>
				<StatLabel>{stat.label}</StatLabel>
				<StatNumber>{stat.value}</StatNumber>
				{stat.trend && (
					<StatHelpText>
						<StatArrow
							type={stat.trendDirection === "down" ? "decrease" : "increase"}
						/>
						{stat.trend}
					</StatHelpText>
				)}
			</Stat>
		);
	}

	if (variant === "icon") {
		return (
			<HStack spacing={4}>
				{stat.icon && (
					<Box p={3} bg={iconBg} borderRadius="lg">
						<IconRenderer icon={stat.icon} color={iconColor} boxSize={6} />
					</Box>
				)}
				<Stat>
					<StatLabel>{stat.label}</StatLabel>
					<StatNumber>{stat.value}</StatNumber>
					{stat.trend && (
						<StatHelpText>
							<StatArrow
								type={stat.trendDirection === "down" ? "decrease" : "increase"}
							/>
							{stat.trend}
						</StatHelpText>
					)}
				</Stat>
			</HStack>
		);
	}

	return (
		<Card>
			<CardBody>
				<HStack justify="space-between">
					<Stat>
						<StatLabel>{stat.label}</StatLabel>
						<StatNumber>{stat.value}</StatNumber>
						{stat.trend && (
							<StatHelpText>
								<StatArrow
									type={
										stat.trendDirection === "down" ? "decrease" : "increase"
									}
								/>
								{stat.trend}
							</StatHelpText>
						)}
					</Stat>
					{stat.icon && (
						<Box p={3} bg={iconBg} borderRadius="lg">
							<IconRenderer icon={stat.icon} color={iconColor} boxSize={6} />
						</Box>
					)}
				</HStack>
			</CardBody>
		</Card>
	);
}

export function StatsRenderer({ config }: Props) {
	const { title, description, stats, columns = 4, variant = "card" } = config;

	return (
		<VStack spacing={4} align="stretch">
			{(title || description) && (
				<Box>
					{title && <Heading size="md">{title}</Heading>}
					{description && (
						<Text color="gray.600" mt={1}>
							{description}
						</Text>
					)}
				</Box>
			)}
			<SimpleGrid columns={columns} spacing={4}>
				{stats.map((stat) => (
					<StatCard key={stat.label} stat={stat} variant={variant} />
				))}
			</SimpleGrid>
		</VStack>
	);
}
