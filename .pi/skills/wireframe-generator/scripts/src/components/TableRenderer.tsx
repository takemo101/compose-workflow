import {
	Box,
	Checkbox,
	HStack,
	IconButton,
	Table,
	Tbody,
	Td,
	Th,
	Thead,
	Tr,
} from "@chakra-ui/react";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import type { TableAction, TableWireframe } from "../../types";
import { CellValue } from "./CellValue";
import { Pagination } from "./Pagination";
import { TableToolbar } from "./TableToolbar";

interface Props {
	config: TableWireframe;
}

const DEFAULT_DATA = [
	{
		id: 1,
		name: "サンプル 1",
		email: "sample1@example.com",
		status: "active",
		createdAt: "2025-01-01",
	},
	{
		id: 2,
		name: "サンプル 2",
		email: "sample2@example.com",
		status: "inactive",
		createdAt: "2025-01-02",
	},
	{
		id: 3,
		name: "サンプル 3",
		email: "sample3@example.com",
		status: "active",
		createdAt: "2025-01-03",
	},
];

function getRowKey(row: Record<string, unknown>): string {
	return String(row.id ?? row.name ?? JSON.stringify(row));
}

export function TableRenderer({ config }: Props) {
	const { columns, actions = [], data } = config;
	const tableData = data ?? DEFAULT_DATA;

	const hasAction = (action: TableAction) => actions.includes(action);
	const showRowActions = hasAction("row-edit") || hasAction("row-delete");

	return (
		<Box>
			<TableToolbar actions={actions} />

			<Box overflowX="auto">
				<Table variant="simple" size="sm">
					<Thead>
						<Tr>
							{hasAction("bulk-select") && (
								<Th w="40px">
									<Checkbox />
								</Th>
							)}
							{columns.map((col) => (
								<Th key={col.name} w={col.width ? `${col.width}px` : undefined}>
									{col.label}
								</Th>
							))}
							{showRowActions && <Th w="100px">操作</Th>}
						</Tr>
					</Thead>
					<Tbody>
						{tableData.map((row) => (
							<Tr key={getRowKey(row as Record<string, unknown>)}>
								{hasAction("bulk-select") && (
									<Td>
										<Checkbox />
									</Td>
								)}
								{columns.map((col) => (
									<Td key={col.name}>
										<CellValue
											value={(row as Record<string, unknown>)[col.name]}
											type={col.type}
										/>
									</Td>
								))}
								{showRowActions && (
									<Td>
										<HStack spacing={1}>
											{hasAction("row-edit") && (
												<IconButton
													aria-label="Edit"
													icon={<FiEdit2 />}
													size="xs"
													variant="ghost"
												/>
											)}
											{hasAction("row-delete") && (
												<IconButton
													aria-label="Delete"
													icon={<FiTrash2 />}
													size="xs"
													variant="ghost"
													colorScheme="red"
												/>
											)}
										</HStack>
									</Td>
								)}
							</Tr>
						))}
					</Tbody>
				</Table>
			</Box>

			{hasAction("pagination") && <Pagination />}
		</Box>
	);
}
