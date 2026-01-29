import { Button, type ButtonProps } from "@chakra-ui/react";
import type { FormButton } from "../../types";
import { getButtonColorScheme } from "../utils";
import { IconRenderer } from "./IconRenderer";

interface Props {
	button: FormButton;
	size?: ButtonProps["size"];
}

export function ButtonRenderer({ button, size }: Props) {
	const { label, variant, icon, disabled } = button;

	return (
		<Button
			colorScheme={getButtonColorScheme(variant)}
			variant={
				variant === "ghost" || variant === "link" || variant === "outline"
					? variant
					: "solid"
			}
			isDisabled={disabled}
			size={size}
			leftIcon={icon ? <IconRenderer icon={icon} /> : undefined}
		>
			{label}
		</Button>
	);
}
