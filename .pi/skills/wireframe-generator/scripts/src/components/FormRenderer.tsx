import {
	Box,
	Button,
	Checkbox,
	FormControl,
	FormLabel,
	HStack,
	Input,
	PinInput,
	PinInputField,
	Radio,
	RadioGroup,
	Select,
	Stack,
	Textarea,
	VStack,
} from "@chakra-ui/react";
import type { FormField, FormWireframe } from "../../types";
import { getButtonColorScheme } from "../utils";

interface Props {
	config: FormWireframe;
}

function FieldInput({ field }: { field: FormField }) {
	switch (field.type) {
		case "text":
			return (
				<Input placeholder={field.placeholder} maxLength={field.maxLength} />
			);
		case "email":
			return <Input type="email" placeholder={field.placeholder} />;
		case "password":
			return <Input type="password" />;
		case "number":
			return <Input type="number" min={field.min} max={field.max} />;
		case "textarea":
			return (
				<Textarea rows={field.rows ?? 4} placeholder={field.placeholder} />
			);
		case "select":
			return (
				<Select placeholder="選択してください">
					{field.options?.map((opt) => (
						<option key={opt.value} value={opt.value}>
							{opt.label}
						</option>
					))}
				</Select>
			);
		case "checkbox":
			return <Checkbox>{field.label}</Checkbox>;
		case "radio":
			return (
				<RadioGroup>
					<Stack direction="row">
						{field.options?.map((opt) => (
							<Radio key={opt.value} value={opt.value}>
								{opt.label}
							</Radio>
						))}
					</Stack>
				</RadioGroup>
			);
		case "date":
			return <Input type="date" />;
		case "file":
			return <Input type="file" accept={field.accept} />;
		case "pin": {
			const length = field.pinLength ?? 6;
			return (
				<HStack justify="center">
					<PinInput size="lg" otp>
						{Array.from({ length }).map((_, i) => (
							<PinInputField key={i} />
						))}
					</PinInput>
				</HStack>
			);
		}
		default:
			return null;
	}
}

export function FormRenderer({ config }: Props) {
	const { fields, buttons } = config;

	return (
		<Box as="form" onSubmit={(e: React.FormEvent) => e.preventDefault()}>
			<VStack spacing={4} align="stretch">
				{fields.map((field) => (
					<FormControl key={field.name} isRequired={field.required}>
						{field.type !== "checkbox" && <FormLabel>{field.label}</FormLabel>}
						<FieldInput field={field} />
					</FormControl>
				))}

				{buttons && buttons.length > 0 && (
					<HStack spacing={4} pt={4}>
						{buttons.map((btn) => (
							<Button
								key={btn.label}
								colorScheme={getButtonColorScheme(btn.variant)}
								variant={btn.variant === "ghost" ? "ghost" : "solid"}
							>
								{btn.label}
							</Button>
						))}
					</HStack>
				)}
			</VStack>
		</Box>
	);
}
