import {
	Badge,
	Box,
	Card,
	CardBody,
	CardFooter,
	CardHeader,
	Heading,
	HStack,
	List,
	ListIcon,
	ListItem,
	SimpleGrid,
	Switch,
	Text,
	VStack,
} from "@chakra-ui/react";
import { FiCheck, FiX } from "react-icons/fi";
import type { PricingWireframe } from "../../types";
import { ButtonRenderer } from "./ButtonRenderer";

interface Props {
	config: PricingWireframe;
}

export function PricingRenderer({ config }: Props) {
	const { title, description, plans, billingToggle } = config;

	return (
		<VStack spacing={6} align="stretch">
			{(title || description) && (
				<VStack spacing={2} textAlign="center">
					{title && <Heading size="lg">{title}</Heading>}
					{description && <Text color="gray.600">{description}</Text>}
				</VStack>
			)}
			{billingToggle && (
				<HStack justify="center" spacing={4}>
					<Text>月払い</Text>
					<Switch size="lg" />
					<Text>年払い</Text>
					<Badge colorScheme="green">20% OFF</Badge>
				</HStack>
			)}
			<SimpleGrid
				columns={{ base: 1, md: plans.length > 3 ? 4 : plans.length }}
				spacing={4}
			>
				{plans.map((plan) => (
					<Card
						key={plan.name}
						borderWidth={plan.featured ? 2 : 1}
						borderColor={plan.featured ? "blue.500" : "gray.200"}
						position="relative"
					>
						{plan.badge && (
							<Badge
								position="absolute"
								top={-3}
								left="50%"
								transform="translateX(-50%)"
								colorScheme="blue"
								px={3}
								py={1}
								borderRadius="full"
							>
								{plan.badge}
							</Badge>
						)}
						<CardHeader textAlign="center" pt={plan.badge ? 8 : 4}>
							<Heading size="md">{plan.name}</Heading>
							{plan.description && (
								<Text color="gray.500" fontSize="sm" mt={1}>
									{plan.description}
								</Text>
							)}
							<HStack justify="center" mt={4}>
								<Text fontSize="4xl" fontWeight="bold">
									{plan.price}
								</Text>
								{plan.period && (
									<Text color="gray.500" fontSize="sm">
										/{plan.period}
									</Text>
								)}
							</HStack>
						</CardHeader>
						<CardBody>
							<List spacing={2}>
								{plan.features.map((feature) => (
									<ListItem key={feature.label}>
										<ListIcon
											as={feature.included ? FiCheck : FiX}
											color={feature.included ? "green.500" : "gray.300"}
										/>
										<Text
											as="span"
											color={feature.included ? "inherit" : "gray.400"}
										>
											{feature.label}
										</Text>
									</ListItem>
								))}
							</List>
						</CardBody>
						<CardFooter>
							<Box w="full">
								<ButtonRenderer
									button={{
										...plan.action,
										variant: plan.featured ? "primary" : "outline",
									}}
								/>
							</Box>
						</CardFooter>
					</Card>
				))}
			</SimpleGrid>
		</VStack>
	);
}
