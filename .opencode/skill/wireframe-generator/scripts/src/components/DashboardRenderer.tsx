import {
	Box,
	Card,
	CardBody,
	CardHeader,
	Heading,
	Icon,
	SimpleGrid,
	Stat,
	StatArrow,
	StatHelpText,
	StatLabel,
	StatNumber,
	Table,
	Tbody,
	Td,
	Text,
	Th,
	Thead,
	Tr,
} from "@chakra-ui/react";
import {
	FiActivity,
	FiBarChart2,
	FiDollarSign,
	FiInbox,
	FiSettings,
	FiUsers,
} from "react-icons/fi";
import type { DashboardWireframe } from "../../types";

interface Props {
	config: DashboardWireframe;
}

const iconMap: Record<string, typeof FiUsers> = {
	users: FiUsers,
	currency: FiDollarSign,
	activity: FiActivity,
	chart: FiBarChart2,
	inbox: FiInbox,
	settings: FiSettings,
};

export function DashboardRenderer({ config }: Props) {
	const { stats = [], widgets = [] } = config;

	return (
		<Box>
			{stats.length > 0 && (
				<SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4} mb={6}>
					{stats.map((stat) => (
						<Card key={stat.label}>
							<CardBody>
								<Stat>
									<StatLabel display="flex" alignItems="center" gap={2}>
										{stat.icon && iconMap[stat.icon] && (
											<Icon as={iconMap[stat.icon]} />
										)}
										{stat.label}
									</StatLabel>
									<StatNumber>{stat.value}</StatNumber>
									{stat.trend && (
										<StatHelpText>
											<StatArrow
												type={
													stat.trend.startsWith("+") ? "increase" : "decrease"
												}
											/>
											{stat.trend}
										</StatHelpText>
									)}
								</Stat>
							</CardBody>
						</Card>
					))}
				</SimpleGrid>
			)}

			{widgets.length > 0 && (
				<SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
					{widgets.map((widget) => (
						<Card key={widget.title}>
							<CardHeader>
								<Heading size="sm">{widget.title}</Heading>
							</CardHeader>
							<CardBody pt={0}>
								{widget.type === "chart" && (
									<Box
										h="200px"
										bg="gray.100"
										borderRadius="md"
										display="flex"
										alignItems="center"
										justifyContent="center"
									>
										<Text color="gray.500">
											{widget.chartType === "line" && "📈 "}
											{widget.chartType === "bar" && "📊 "}
											{widget.chartType === "pie" && "🥧 "}
											{widget.chartType} chart placeholder
										</Text>
									</Box>
								)}

								{widget.type === "table" && widget.columns && (
									<Table size="sm" variant="simple">
										<Thead>
											<Tr>
												{widget.columns.map((col) => (
													<Th key={col.label}>{col.label}</Th>
												))}
											</Tr>
										</Thead>
										<Tbody>
											{[1, 2, 3].map((row) => (
												<Tr key={row}>
													{widget.columns?.map((col) => (
														<Td key={`${col.label}-${row}`}>Sample {row}</Td>
													))}
												</Tr>
											))}
										</Tbody>
									</Table>
								)}

								{widget.type === "list" && (
									<Box>
										{[1, 2, 3].map((item) => (
											<Box
												key={item}
												py={2}
												borderBottomWidth={item < 3 ? 1 : 0}
											>
												<Text>List item {item}</Text>
											</Box>
										))}
									</Box>
								)}
							</CardBody>
						</Card>
					))}
				</SimpleGrid>
			)}
		</Box>
	);
}
