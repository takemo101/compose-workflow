import {
	Avatar,
	AvatarBadge,
	Box,
	HStack,
	Icon,
	IconButton,
	Input,
	InputGroup,
	InputRightElement,
	Text,
	VStack,
} from "@chakra-ui/react";
import { FiCheck, FiCheckCircle, FiSend } from "react-icons/fi";
import type { ChatMessage, ChatWireframe } from "../../types";

interface Props {
	config: ChatWireframe;
}

function MessageBubble({ message }: { message: ChatMessage }) {
	const statusIcon = message.status === "read" ? FiCheckCircle : FiCheck;

	return (
		<HStack
			justify={message.isOwn ? "flex-end" : "flex-start"}
			w="full"
			spacing={2}
		>
			{!message.isOwn && (
				<Avatar
					size="sm"
					name={message.sender.name}
					src={message.sender.avatar}
				/>
			)}
			<VStack
				align={message.isOwn ? "flex-end" : "flex-start"}
				spacing={1}
				maxW="70%"
			>
				{!message.isOwn && (
					<Text fontSize="xs" color="gray.500">
						{message.sender.name}
					</Text>
				)}
				<Box
					bg={message.isOwn ? "blue.500" : "gray.100"}
					color={message.isOwn ? "white" : "gray.800"}
					px={3}
					py={2}
					borderRadius="lg"
					borderBottomRightRadius={message.isOwn ? "sm" : undefined}
					borderBottomLeftRadius={!message.isOwn ? "sm" : undefined}
				>
					<Text fontSize="sm">{message.content}</Text>
				</Box>
				<HStack spacing={1}>
					<Text fontSize="xs" color="gray.400">
						{message.timestamp}
					</Text>
					{message.isOwn && message.status && (
						<Icon
							as={statusIcon}
							boxSize={3}
							color={message.status === "read" ? "blue.400" : "gray.400"}
						/>
					)}
				</HStack>
			</VStack>
		</HStack>
	);
}

export function ChatRenderer({ config }: Props) {
	const {
		title,
		participants,
		messages,
		inputPlaceholder = "メッセージを入力...",
	} = config;

	const statusColorMap = {
		online: "green.400",
		offline: "gray.400",
		away: "yellow.400",
	};

	return (
		<VStack
			spacing={0}
			h="500px"
			borderWidth={1}
			borderRadius="md"
			overflow="hidden"
		>
			<HStack
				w="full"
				p={3}
				borderBottomWidth={1}
				bg="white"
				justify="space-between"
			>
				<HStack spacing={3}>
					{participants && participants.length === 1 ? (
						<>
							<Avatar
								size="sm"
								name={participants[0].name}
								src={participants[0].avatar}
							>
								{participants[0].status && (
									<AvatarBadge
										boxSize="1em"
										bg={statusColorMap[participants[0].status]}
									/>
								)}
							</Avatar>
							<VStack align="start" spacing={0}>
								<Text fontWeight="medium" fontSize="sm">
									{participants[0].name}
								</Text>
								{participants[0].status && (
									<Text fontSize="xs" color="gray.500">
										{participants[0].status === "online"
											? "オンライン"
											: "オフライン"}
									</Text>
								)}
							</VStack>
						</>
					) : (
						<Text fontWeight="medium">{title ?? "チャット"}</Text>
					)}
				</HStack>
				{participants && participants.length > 1 && (
					<HStack spacing={-2}>
						{participants.slice(0, 3).map((p) => (
							<Avatar key={p.name} size="xs" name={p.name} src={p.avatar} />
						))}
						{participants.length > 3 && (
							<Avatar
								size="xs"
								name={`+${participants.length - 3}`}
								bg="gray.300"
							/>
						)}
					</HStack>
				)}
			</HStack>

			<VStack flex={1} w="full" p={4} spacing={3} overflowY="auto" bg="gray.50">
				{messages.map((msg) => (
					<MessageBubble key={msg.id} message={msg} />
				))}
			</VStack>

			<HStack w="full" p={3} borderTopWidth={1} bg="white">
				<InputGroup>
					<Input placeholder={inputPlaceholder} />
					<InputRightElement>
						<IconButton
							aria-label="Send"
							icon={<FiSend />}
							size="sm"
							colorScheme="blue"
							variant="ghost"
						/>
					</InputRightElement>
				</InputGroup>
			</HStack>
		</VStack>
	);
}
