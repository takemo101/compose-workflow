import {
	Box,
	Heading,
	HStack,
	Image,
	SimpleGrid,
	Text,
	VStack,
} from "@chakra-ui/react";
import type { HeroWireframe } from "../../types";
import { ButtonRenderer } from "./ButtonRenderer";
import { IconRenderer } from "./IconRenderer";

interface Props {
	config: HeroWireframe;
}

export function HeroRenderer({ config }: Props) {
	const {
		variant = "centered",
		title,
		subtitle,
		description,
		image,
		actions,
		features,
	} = config;

	if (variant === "split") {
		return (
			<SimpleGrid columns={2} spacing={8} alignItems="center" py={8}>
				<VStack align="start" spacing={4}>
					{subtitle && (
						<Text color="blue.500" fontWeight="semibold">
							{subtitle}
						</Text>
					)}
					<Heading size="2xl">{title}</Heading>
					{description && (
						<Text fontSize="lg" color="gray.600">
							{description}
						</Text>
					)}
					{actions && actions.length > 0 && (
						<HStack spacing={4} pt={4}>
							{actions.map((btn) => (
								<ButtonRenderer key={btn.label} button={btn} />
							))}
						</HStack>
					)}
				</VStack>
				{image && (
					<Box>
						<Image
							src={image}
							alt={title}
							borderRadius="lg"
							fallback={<Box h="300px" bg="gray.200" borderRadius="lg" />}
						/>
					</Box>
				)}
			</SimpleGrid>
		);
	}

	if (variant === "image-bg") {
		return (
			<Box
				position="relative"
				py={20}
				px={8}
				borderRadius="lg"
				overflow="hidden"
				bg="gray.800"
			>
				{image && (
					<Image
						src={image}
						alt=""
						position="absolute"
						inset={0}
						w="full"
						h="full"
						objectFit="cover"
						opacity={0.3}
					/>
				)}
				<VStack
					spacing={4}
					textAlign="center"
					position="relative"
					color="white"
				>
					{subtitle && (
						<Text color="blue.300" fontWeight="semibold">
							{subtitle}
						</Text>
					)}
					<Heading size="2xl">{title}</Heading>
					{description && (
						<Text fontSize="lg" maxW="2xl" opacity={0.9}>
							{description}
						</Text>
					)}
					{actions && actions.length > 0 && (
						<HStack spacing={4} pt={4}>
							{actions.map((btn) => (
								<ButtonRenderer key={btn.label} button={btn} />
							))}
						</HStack>
					)}
				</VStack>
			</Box>
		);
	}

	return (
		<VStack spacing={6} textAlign="center" py={8}>
			{subtitle && (
				<Text color="blue.500" fontWeight="semibold">
					{subtitle}
				</Text>
			)}
			<Heading size="2xl">{title}</Heading>
			{description && (
				<Text fontSize="lg" color="gray.600" maxW="2xl">
					{description}
				</Text>
			)}
			{actions && actions.length > 0 && (
				<HStack spacing={4}>
					{actions.map((btn) => (
						<ButtonRenderer key={btn.label} button={btn} />
					))}
				</HStack>
			)}
			{image && (
				<Box pt={8}>
					<Image
						src={image}
						alt={title}
						borderRadius="lg"
						maxH="400px"
						fallback={
							<Box h="300px" w="600px" bg="gray.200" borderRadius="lg" />
						}
					/>
				</Box>
			)}
			{features && features.length > 0 && (
				<SimpleGrid columns={{ base: 1, md: 3 }} spacing={8} pt={12} w="full">
					{features.map((feature) => (
						<VStack key={feature.title} spacing={3}>
							{feature.icon && (
								<Box p={3} bg="blue.50" borderRadius="full">
									<IconRenderer
										icon={feature.icon}
										color="blue.500"
										boxSize={6}
									/>
								</Box>
							)}
							<Text fontWeight="semibold">{feature.title}</Text>
							{feature.description && (
								<Text color="gray.600" fontSize="sm">
									{feature.description}
								</Text>
							)}
						</VStack>
					))}
				</SimpleGrid>
			)}
		</VStack>
	);
}
