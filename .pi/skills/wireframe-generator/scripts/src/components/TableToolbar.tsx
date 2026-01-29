import {
	Button,
	HStack,
	Input,
	InputGroup,
	InputLeftElement,
} from "@chakra-ui/react";
import { FiDownload, FiPlus, FiSearch } from "react-icons/fi";
import type { TableAction } from "../../types";

interface Props {
	actions: TableAction[];
}

export function TableToolbar({ actions }: Props) {
	const hasAction = (action: TableAction) => actions.includes(action);

	const showToolbar =
		hasAction("search") || hasAction("create-button") || hasAction("export");

	if (!showToolbar) return null;

	return (
		<HStack mb={4} justify="space-between">
			{hasAction("search") && (
				<InputGroup maxW="300px">
					<InputLeftElement pointerEvents="none">
						<FiSearch color="gray.300" />
					</InputLeftElement>
					<Input placeholder="検索..." />
				</InputGroup>
			)}
			<HStack>
				{hasAction("export") && (
					<Button leftIcon={<FiDownload />} variant="outline" size="sm">
						エクスポート
					</Button>
				)}
				{hasAction("create-button") && (
					<Button leftIcon={<FiPlus />} colorScheme="blue" size="sm">
						新規作成
					</Button>
				)}
			</HStack>
		</HStack>
	);
}
