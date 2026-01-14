import {
	Box,
	Button,
	Heading,
	HStack,
	Step,
	StepDescription,
	StepIcon,
	StepIndicator,
	StepNumber,
	Stepper,
	StepSeparator,
	StepStatus,
	StepTitle,
	Text,
	VStack,
} from "@chakra-ui/react";
import type { WizardWireframe } from "../../types";
import { ContentRenderer } from "./ContentRenderer";
import { FormRenderer } from "./FormRenderer";

interface Props {
	config: WizardWireframe;
}

export function WizardRenderer({ config }: Props) {
	const {
		title,
		description,
		steps,
		currentStep = 0,
		orientation = "horizontal",
		showStepNumbers = true,
	} = config;

	const activeStep = steps[currentStep];

	return (
		<VStack spacing={6} align="stretch">
			{(title || description) && (
				<Box>
					{title && <Heading size="md">{title}</Heading>}
					{description && (
						<Text color="gray.600" mt={1}>
							{description}
						</Text>
					)}
				</Box>
			)}

			<Stepper index={currentStep} orientation={orientation} gap={0}>
				{steps.map((step, _index) => (
					<Step key={step.title}>
						<StepIndicator>
							<StepStatus
								complete={<StepIcon />}
								incomplete={showStepNumbers ? <StepNumber /> : undefined}
								active={showStepNumbers ? <StepNumber /> : undefined}
							/>
						</StepIndicator>
						<Box flexShrink="0">
							<StepTitle>{step.title}</StepTitle>
							{step.description && (
								<StepDescription>{step.description}</StepDescription>
							)}
						</Box>
						<StepSeparator />
					</Step>
				))}
			</Stepper>

			<Box p={4} borderWidth={1} borderRadius="md">
				{activeStep.fields && activeStep.fields.length > 0 ? (
					<FormRenderer
						config={{
							screen: "",
							type: "form",
							fields: activeStep.fields,
						}}
					/>
				) : activeStep.content ? (
					<ContentRenderer content={activeStep.content} />
				) : (
					<Text color="gray.500">ステップ {currentStep + 1} のコンテンツ</Text>
				)}
			</Box>

			<HStack justify="space-between">
				<Button variant="outline" isDisabled={currentStep === 0}>
					戻る
				</Button>
				<HStack>
					{currentStep < steps.length - 1 ? (
						<Button colorScheme="blue">次へ</Button>
					) : (
						<Button colorScheme="green">完了</Button>
					)}
				</HStack>
			</HStack>
		</VStack>
	);
}
