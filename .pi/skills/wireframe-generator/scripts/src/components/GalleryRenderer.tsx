import {
	AspectRatio,
	Box,
	Heading,
	Image,
	SimpleGrid,
	Text,
	VStack,
} from "@chakra-ui/react";
import type { GalleryWireframe } from "../../types";

interface Props {
	config: GalleryWireframe;
}

const aspectRatioMap = {
	square: 1,
	video: 16 / 9,
	portrait: 3 / 4,
};

export function GalleryRenderer({ config }: Props) {
	const {
		title,
		description,
		items,
		columns = 3,
		aspectRatio = "square",
	} = config;

	return (
		<VStack spacing={4} align="stretch">
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
			<SimpleGrid columns={columns} spacing={4}>
				{items.map((item, index) => (
					<Box
						key={`gallery-${index}`}
						borderRadius="md"
						overflow="hidden"
						cursor="pointer"
						_hover={{ opacity: 0.9 }}
					>
						<AspectRatio ratio={aspectRatioMap[aspectRatio]}>
							<Image
								src={item.src}
								alt={item.alt ?? `Image ${index + 1}`}
								objectFit="cover"
								fallback={<Box bg="gray.200" />}
							/>
						</AspectRatio>
						{item.caption && (
							<Text fontSize="sm" color="gray.600" p={2}>
								{item.caption}
							</Text>
						)}
					</Box>
				))}
			</SimpleGrid>
		</VStack>
	);
}
