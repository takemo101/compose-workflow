import {
	Avatar,
	Badge,
	Box,
	Card,
	CardBody,
	CardFooter,
	Heading,
	HStack,
	Image,
	SimpleGrid,
	Stat,
	StatLabel,
	StatNumber,
	Text,
	VStack,
} from "@chakra-ui/react";
import type { CardGridWireframe, CardItem } from "../../types";
import { ButtonRenderer } from "./ButtonRenderer";
import { EmptyStateRenderer } from "./EmptyStateRenderer";

interface Props {
	config: CardGridWireframe;
}

function CardItemRenderer({ card }: { card: CardItem }) {
	return (
		<Card>
			{card.image && (
				<Image
					src={card.image}
					alt={card.title}
					fallback={<Box h="150px" bg="gray.200" />}
					objectFit="cover"
					h="150px"
				/>
			)}
			<CardBody>
				<VStack align="start" spacing={2}>
					<HStack justify="space-between" w="full">
						<HStack spacing={2}>
							{card.avatar && (
								<Avatar
									size="sm"
									name={card.avatar.name}
									src={card.avatar.src}
								/>
							)}
							<Box>
								<Heading size="sm">{card.title}</Heading>
								{card.subtitle && (
									<Text fontSize="sm" color="gray.500">
										{card.subtitle}
									</Text>
								)}
							</Box>
						</HStack>
						{card.badge && (
							<Badge colorScheme={card.badge.color ?? "gray"}>
								{card.badge.label}
							</Badge>
						)}
					</HStack>
					{card.description && (
						<Text fontSize="sm" color="gray.600">
							{card.description}
						</Text>
					)}
					{card.stats && card.stats.length > 0 && (
						<HStack spacing={4} pt={2}>
							{card.stats.map((stat) => (
								<Stat key={stat.label} size="sm">
									<StatLabel fontSize="xs">{stat.label}</StatLabel>
									<StatNumber fontSize="md">{stat.value}</StatNumber>
								</Stat>
							))}
						</HStack>
					)}
				</VStack>
			</CardBody>
			{card.actions && card.actions.length > 0 && (
				<CardFooter pt={0}>
					<HStack spacing={2}>
						{card.actions.map((btn) => (
							<ButtonRenderer key={btn.label} button={btn} size="sm" />
						))}
					</HStack>
				</CardFooter>
			)}
		</Card>
	);
}

export function CardGridRenderer({ config }: Props) {
	const {
		title,
		description,
		cards,
		columns = 3,
		actions,
		emptyState,
	} = config;

	if (cards.length === 0 && emptyState) {
		return (
			<EmptyStateRenderer
				config={{ screen: "", type: "empty-state", ...emptyState }}
			/>
		);
	}

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
			<SimpleGrid columns={columns} spacing={4}>
				{cards.map((card) => (
					<CardItemRenderer key={card.title} card={card} />
				))}
			</SimpleGrid>
		</VStack>
	);
}
