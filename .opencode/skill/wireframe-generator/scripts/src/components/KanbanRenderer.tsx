import {
	Avatar,
	Badge,
	Box,
	Card,
	CardBody,
	Heading,
	HStack,
	Icon,
	Text,
	VStack,
} from "@chakra-ui/react";
import { FiMessageSquare, FiPaperclip } from "react-icons/fi";
import type { KanbanCard, KanbanColumn, KanbanWireframe } from "../../types";

interface Props {
	config: KanbanWireframe;
}

function KanbanCardItem({ card }: { card: KanbanCard }) {
	return (
		<Card size="sm" cursor="grab" _hover={{ boxShadow: "md" }}>
			<CardBody>
				<VStack align="start" spacing={2}>
					{card.labels && card.labels.length > 0 && (
						<HStack spacing={1} flexWrap="wrap">
							{card.labels.map((label) => (
								<Badge
									key={label.label}
									bg={label.color}
									color="white"
									fontSize="xs"
									px={2}
									borderRadius="sm"
								>
									{label.label}
								</Badge>
							))}
						</HStack>
					)}
					<Text fontWeight="medium" fontSize="sm">
						{card.title}
					</Text>
					{card.description && (
						<Text fontSize="xs" color="gray.500" noOfLines={2}>
							{card.description}
						</Text>
					)}
					<HStack justify="space-between" w="full" pt={1}>
						<HStack spacing={2}>
							{card.comments !== undefined && card.comments > 0 && (
								<HStack spacing={1} color="gray.500">
									<Icon as={FiMessageSquare} boxSize={3} />
									<Text fontSize="xs">{card.comments}</Text>
								</HStack>
							)}
							{card.attachments !== undefined && card.attachments > 0 && (
								<HStack spacing={1} color="gray.500">
									<Icon as={FiPaperclip} boxSize={3} />
									<Text fontSize="xs">{card.attachments}</Text>
								</HStack>
							)}
							{card.dueDate && (
								<Text fontSize="xs" color="gray.500">
									{card.dueDate}
								</Text>
							)}
						</HStack>
						{card.assignee && (
							<Avatar
								size="xs"
								name={card.assignee.name}
								src={card.assignee.avatar}
							/>
						)}
					</HStack>
				</VStack>
			</CardBody>
		</Card>
	);
}

function KanbanColumnRenderer({ column }: { column: KanbanColumn }) {
	return (
		<Box bg="gray.50" borderRadius="lg" p={3} minW="280px" maxW="280px">
			<HStack justify="space-between" mb={3}>
				<HStack spacing={2}>
					{column.color && (
						<Box w={3} h={3} borderRadius="sm" bg={column.color} />
					)}
					<Text fontWeight="semibold" fontSize="sm">
						{column.title}
					</Text>
					<Badge variant="subtle" colorScheme="gray" borderRadius="full">
						{column.cards.length}
						{column.limit && `/${column.limit}`}
					</Badge>
				</HStack>
			</HStack>
			<VStack spacing={2} align="stretch">
				{column.cards.map((card) => (
					<KanbanCardItem key={card.id} card={card} />
				))}
			</VStack>
		</Box>
	);
}

export function KanbanRenderer({ config }: Props) {
	const { title, columns } = config;

	return (
		<VStack spacing={4} align="stretch">
			{title && <Heading size="md">{title}</Heading>}
			<HStack spacing={4} overflowX="auto" pb={4} align="start">
				{columns.map((column) => (
					<KanbanColumnRenderer key={column.id} column={column} />
				))}
			</HStack>
		</VStack>
	);
}
