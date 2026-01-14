import {
	Avatar,
	Box,
	Circle,
	Heading,
	HStack,
	Text,
	VStack,
} from "@chakra-ui/react";
import type { TimelineWireframe } from "../../types";
import { IconRenderer } from "./IconRenderer";

interface Props {
	config: TimelineWireframe;
}

const colorMap = {
	blue: "blue.500",
	green: "green.500",
	red: "red.500",
	yellow: "yellow.500",
	purple: "purple.500",
	gray: "gray.500",
};

export function TimelineRenderer({ config }: Props) {
	const { title, items } = config;

	return (
		<VStack spacing={4} align="stretch">
			{title && <Heading size="md">{title}</Heading>}
			<VStack spacing={0} align="stretch" position="relative">
				{items.map((item, index) => {
					const color = item.color ? colorMap[item.color] : "blue.500";
					const isLast = index === items.length - 1;

					return (
						<HStack
							key={`timeline-${index}`}
							spacing={4}
							align="start"
							pb={isLast ? 0 : 6}
						>
							<VStack spacing={0} align="center">
								<Circle size={10} bg={color} color="white">
									{item.icon ? (
										<IconRenderer icon={item.icon} color="white" boxSize={5} />
									) : (
										<Box w={2} h={2} bg="white" borderRadius="full" />
									)}
								</Circle>
								{!isLast && <Box w="2px" bg="gray.200" flex={1} minH={8} />}
							</VStack>
							<Box flex={1} pb={4}>
								<HStack justify="space-between" align="start">
									<VStack align="start" spacing={1}>
										<Text fontWeight="semibold">{item.title}</Text>
										{item.description && (
											<Text color="gray.600" fontSize="sm">
												{item.description}
											</Text>
										)}
									</VStack>
									{item.timestamp && (
										<Text color="gray.500" fontSize="sm" whiteSpace="nowrap">
											{item.timestamp}
										</Text>
									)}
								</HStack>
								{item.user && (
									<HStack spacing={2} mt={2}>
										<Avatar
											size="xs"
											name={item.user.name}
											src={item.user.avatar}
										/>
										<Text fontSize="sm" color="gray.600">
											{item.user.name}
										</Text>
									</HStack>
								)}
							</Box>
						</HStack>
					);
				})}
			</VStack>
		</VStack>
	);
}
