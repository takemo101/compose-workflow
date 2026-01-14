import {
	Avatar,
	Box,
	Heading,
	HStack,
	Icon,
	Image,
	Link,
	Stat,
	StatLabel,
	StatNumber,
	Tab,
	TabList,
	TabPanel,
	TabPanels,
	Tabs,
	Text,
	VStack,
} from "@chakra-ui/react";
import {
	FiFacebook,
	FiGithub,
	FiGlobe,
	FiInstagram,
	FiLinkedin,
	FiTwitter,
} from "react-icons/fi";
import type { ProfileWireframe } from "../../types";
import { ButtonRenderer } from "./ButtonRenderer";
import { ContentRenderer } from "./ContentRenderer";

interface Props {
	config: ProfileWireframe;
}

const socialIcons: Record<string, React.ComponentType> = {
	twitter: FiTwitter,
	github: FiGithub,
	linkedin: FiLinkedin,
	facebook: FiFacebook,
	instagram: FiInstagram,
	website: FiGlobe,
};

export function ProfileRenderer({ config }: Props) {
	const { user, tabs, actions } = config;

	return (
		<VStack spacing={0} align="stretch">
			<Box position="relative" h="200px" bg="gray.200">
				{user.coverImage && (
					<Image
						src={user.coverImage}
						alt="Cover"
						w="full"
						h="full"
						objectFit="cover"
					/>
				)}
			</Box>

			<Box px={6} pb={6}>
				<HStack spacing={6} mt="-50px" align="end" justify="space-between">
					<HStack spacing={4} align="end">
						<Avatar
							size="2xl"
							name={user.name}
							src={user.avatar}
							border="4px solid white"
							bg="gray.300"
						/>
						<VStack align="start" spacing={0} pb={2}>
							<Heading size="lg">{user.name}</Heading>
							{user.title && <Text color="gray.600">{user.title}</Text>}
						</VStack>
					</HStack>
					{actions && actions.length > 0 && (
						<HStack spacing={2}>
							{actions.map((btn) => (
								<ButtonRenderer key={btn.label} button={btn} />
							))}
						</HStack>
					)}
				</HStack>

				{user.bio && (
					<Text color="gray.600" mt={4}>
						{user.bio}
					</Text>
				)}

				{user.stats && user.stats.length > 0 && (
					<HStack spacing={8} mt={4}>
						{user.stats.map((stat) => (
							<Stat key={stat.label} flex="none">
								<StatNumber>{stat.value}</StatNumber>
								<StatLabel>{stat.label}</StatLabel>
							</Stat>
						))}
					</HStack>
				)}

				{user.social && user.social.length > 0 && (
					<HStack spacing={3} mt={4}>
						{user.social.map((s) => {
							const IconComponent = socialIcons[s.platform] ?? FiGlobe;
							return (
								<Link key={s.platform} href={s.url} isExternal>
									<Icon
										as={IconComponent}
										boxSize={5}
										color="gray.500"
										_hover={{ color: "blue.500" }}
									/>
								</Link>
							);
						})}
					</HStack>
				)}
			</Box>

			{tabs && tabs.length > 0 && (
				<Box borderTopWidth={1}>
					<Tabs>
						<TabList px={6}>
							{tabs.map((tab) => (
								<Tab key={tab.label}>{tab.label}</Tab>
							))}
						</TabList>
						<TabPanels>
							{tabs.map((tab) => (
								<TabPanel key={tab.label}>
									<ContentRenderer content={tab.content} />
								</TabPanel>
							))}
						</TabPanels>
					</Tabs>
				</Box>
			)}
		</VStack>
	);
}
