import {
	Box,
	Button,
	Grid,
	GridItem,
	Heading,
	HStack,
	IconButton,
	Text,
	VStack,
} from "@chakra-ui/react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import type { CalendarWireframe } from "../../types";
import { ButtonRenderer } from "./ButtonRenderer";

interface Props {
	config: CalendarWireframe;
}

const weekDays = ["日", "月", "火", "水", "木", "金", "土"];
const monthName = "2026年1月";

export function CalendarRenderer({ config }: Props) {
	const { title, events = [], actions } = config;

	const daysInMonth = 31;
	const startDay = 3;
	const today = 13;

	const days: (number | null)[] = [];
	for (let i = 0; i < startDay; i++) days.push(null);
	for (let i = 1; i <= daysInMonth; i++) days.push(i);
	while (days.length % 7 !== 0) days.push(null);

	const getEventsForDay = (day: number | null) => {
		if (!day) return [];
		return events.filter((e) => {
			const eventDay = Number.parseInt(e.start.split("-")[2] ?? "0", 10);
			return eventDay === day;
		});
	};

	return (
		<VStack spacing={4} align="stretch">
			<HStack justify="space-between">
				<HStack spacing={2}>
					{title && <Heading size="md">{title}</Heading>}
				</HStack>
				<HStack spacing={2}>
					<HStack>
						<IconButton
							aria-label="Previous"
							icon={<FiChevronLeft />}
							size="sm"
							variant="ghost"
						/>
						<Text fontWeight="medium" minW="120px" textAlign="center">
							{monthName}
						</Text>
						<IconButton
							aria-label="Next"
							icon={<FiChevronRight />}
							size="sm"
							variant="ghost"
						/>
					</HStack>
					<Button size="sm" variant="outline">
						今日
					</Button>
					{actions?.map((btn) => (
						<ButtonRenderer key={btn.label} button={btn} size="sm" />
					))}
				</HStack>
			</HStack>

			<Box borderWidth={1} borderRadius="md" overflow="hidden">
				<Grid templateColumns="repeat(7, 1fr)" borderBottomWidth={1}>
					{weekDays.map((day, i) => (
						<GridItem
							key={day}
							p={2}
							textAlign="center"
							fontWeight="medium"
							fontSize="sm"
							color={i === 0 ? "red.500" : i === 6 ? "blue.500" : "gray.600"}
							bg="gray.50"
						>
							{day}
						</GridItem>
					))}
				</Grid>
				<Grid templateColumns="repeat(7, 1fr)">
					{days.map((day, index) => {
						const dayEvents = getEventsForDay(day);
						const isToday = day === today;
						const isWeekend = index % 7 === 0 || index % 7 === 6;

						return (
							<GridItem
								key={`day-${index}`}
								p={1}
								minH="80px"
								borderWidth="0.5px"
								borderColor="gray.100"
								bg={isToday ? "blue.50" : "white"}
							>
								{day && (
									<VStack align="stretch" spacing={1}>
										<Text
											fontSize="sm"
											fontWeight={isToday ? "bold" : "normal"}
											color={
												isToday
													? "blue.600"
													: isWeekend
														? index % 7 === 0
															? "red.500"
															: "blue.500"
														: "gray.700"
											}
											textAlign="right"
											pr={1}
										>
											{day}
										</Text>
										{dayEvents.slice(0, 2).map((event, i) => (
											<Box
												key={`event-${i}`}
												bg={event.color ?? "blue.400"}
												color="white"
												fontSize="xs"
												px={1}
												py={0.5}
												borderRadius="sm"
												noOfLines={1}
											>
												{event.title}
											</Box>
										))}
										{dayEvents.length > 2 && (
											<Text fontSize="xs" color="gray.500" textAlign="center">
												+{dayEvents.length - 2}件
											</Text>
										)}
									</VStack>
								)}
							</GridItem>
						);
					})}
				</Grid>
			</Box>
		</VStack>
	);
}
