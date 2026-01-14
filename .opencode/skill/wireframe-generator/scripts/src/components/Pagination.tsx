import { Button, HStack } from "@chakra-ui/react";

export function Pagination() {
	return (
		<HStack mt={4} justify="center" spacing={2}>
			<Button size="sm" variant="outline" isDisabled>
				前へ
			</Button>
			<Button size="sm" colorScheme="blue">
				1
			</Button>
			<Button size="sm" variant="outline">
				2
			</Button>
			<Button size="sm" variant="outline">
				3
			</Button>
			<Button size="sm" variant="outline">
				次へ
			</Button>
		</HStack>
	);
}
