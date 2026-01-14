import {
	Box,
	Button,
	Modal,
	ModalBody,
	ModalCloseButton,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalOverlay,
	useDisclosure,
} from "@chakra-ui/react";
import type { CrudWireframe, FormWireframe, TableWireframe } from "../../types";
import { FormRenderer } from "./FormRenderer";
import { TableRenderer } from "./TableRenderer";

interface Props {
	config: CrudWireframe;
}

export function CrudRenderer({ config }: Props) {
	const { table, form } = config;
	const { isOpen, onOpen, onClose } = useDisclosure();

	const tableConfig: TableWireframe = {
		screen: config.screen,
		type: "table",
		columns: table.columns,
		actions: table.actions,
		data: table.data,
	};

	const formConfig: FormWireframe = {
		screen: form.title,
		type: "form",
		fields: form.fields,
		buttons: [
			{ label: "保存", variant: "primary" },
			{ label: "キャンセル", variant: "secondary" },
		],
	};

	return (
		<Box>
			<Box mb={4}>
				<Button colorScheme="blue" size="sm" onClick={onOpen}>
					モーダルプレビュー
				</Button>
			</Box>

			<TableRenderer config={tableConfig} />

			<Modal isOpen={isOpen} onClose={onClose} size="lg">
				<ModalOverlay />
				<ModalContent>
					<ModalHeader>{form.title}</ModalHeader>
					<ModalCloseButton />
					<ModalBody>
						<FormRenderer config={formConfig} />
					</ModalBody>
					<ModalFooter>
						<Button variant="ghost" mr={3} onClick={onClose}>
							キャンセル
						</Button>
						<Button colorScheme="blue">保存</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>
		</Box>
	);
}
