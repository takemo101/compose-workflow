import {
	Avatar,
	Badge,
	Box,
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	Button,
	Collapse,
	Flex,
	Heading,
	HStack,
	Icon,
	IconButton,
	Input,
	InputGroup,
	InputLeftElement,
	Menu,
	MenuButton,
	MenuItem,
	MenuList,
	Text,
	VStack,
} from "@chakra-ui/react";
import { useState } from "react";
import {
	FiBell,
	FiChevronDown,
	FiChevronRight,
	FiSearch,
} from "react-icons/fi";
import type {
	HeaderConfig,
	LayoutWireframe,
	NavItem,
	SidebarConfig,
} from "../../types";
import { ContentRenderer } from "./ContentRenderer";
import { IconRenderer } from "./IconRenderer";

interface Props {
	config: LayoutWireframe;
}

function NavItemRenderer({
	item,
	isChild = false,
}: {
	item: NavItem;
	isChild?: boolean;
}) {
	const [isOpen, setIsOpen] = useState(false);
	const hasChildren = item.children && item.children.length > 0;

	return (
		<VStack align="stretch" spacing={0}>
			<Button
				variant={item.active ? "solid" : "ghost"}
				colorScheme={item.active ? "blue" : "gray"}
				justifyContent="flex-start"
				size="sm"
				pl={isChild ? 8 : 3}
				rightIcon={
					hasChildren ? (
						<Icon as={isOpen ? FiChevronDown : FiChevronRight} boxSize={3} />
					) : undefined
				}
				onClick={() => hasChildren && setIsOpen(!isOpen)}
			>
				<HStack spacing={3} flex={1}>
					{item.icon && <IconRenderer icon={item.icon} boxSize={4} />}
					<Text flex={1} textAlign="left">
						{item.label}
					</Text>
					{item.badge !== undefined && (
						<Badge colorScheme="red" borderRadius="full" fontSize="xs">
							{item.badge}
						</Badge>
					)}
				</HStack>
			</Button>
			{hasChildren && (
				<Collapse in={isOpen}>
					<VStack align="stretch" spacing={0} mt={1}>
						{item.children?.map((child) => (
							<NavItemRenderer key={child.label} item={child} isChild />
						))}
					</VStack>
				</Collapse>
			)}
		</VStack>
	);
}

function Header({ config }: { config: HeaderConfig }) {
	return (
		<HStack
			as="header"
			px={4}
			py={3}
			borderBottomWidth={1}
			bg="white"
			justify="space-between"
		>
			<HStack spacing={4}>
				{config.logo && (
					<Heading size="md" color="blue.500">
						{config.logo.text ?? "Logo"}
					</Heading>
				)}
				{config.nav && (
					<HStack spacing={1} display={{ base: "none", md: "flex" }}>
						{config.nav.map((item) => (
							<Button
								key={item.label}
								variant={item.active ? "solid" : "ghost"}
								colorScheme={item.active ? "blue" : "gray"}
								size="sm"
							>
								{item.label}
							</Button>
						))}
					</HStack>
				)}
			</HStack>
			<HStack spacing={3}>
				{config.search && (
					<InputGroup
						size="sm"
						maxW="200px"
						display={{ base: "none", md: "block" }}
					>
						<InputLeftElement>
							<FiSearch />
						</InputLeftElement>
						<Input placeholder="検索..." />
					</InputGroup>
				)}
				{config.notifications && (
					<IconButton
						aria-label="Notifications"
						icon={<FiBell />}
						variant="ghost"
						size="sm"
					/>
				)}
				{config.userMenu && (
					<Menu>
						<MenuButton
							as={Button}
							variant="ghost"
							size="sm"
							rightIcon={<FiChevronDown />}
						>
							<HStack spacing={2}>
								<Avatar
									size="xs"
									name={config.userMenu.name}
									src={config.userMenu.avatar}
								/>
								<Text display={{ base: "none", md: "block" }}>
									{config.userMenu.name}
								</Text>
							</HStack>
						</MenuButton>
						<MenuList>
							{config.userMenu.items?.map((item) => (
								<MenuItem key={item.label}>{item.label}</MenuItem>
							))}
						</MenuList>
					</Menu>
				)}
			</HStack>
		</HStack>
	);
}

function Sidebar({ config }: { config: SidebarConfig }) {
	return (
		<VStack
			as="aside"
			w={config.collapsed ? "60px" : "240px"}
			minH="100%"
			borderRightWidth={1}
			bg="white"
			py={4}
			align="stretch"
			spacing={4}
		>
			{config.logo && !config.collapsed && (
				<HStack px={4} pb={2}>
					<Heading size="sm" color="blue.500">
						{config.logo.text ?? config.title}
					</Heading>
				</HStack>
			)}
			<VStack align="stretch" spacing={1} px={2} flex={1}>
				{config.items.map((item) => (
					<NavItemRenderer key={item.label} item={item} />
				))}
			</VStack>
			{config.footer && config.footer.length > 0 && (
				<VStack align="stretch" spacing={1} px={2} borderTopWidth={1} pt={4}>
					{config.footer.map((item) => (
						<NavItemRenderer key={item.label} item={item} />
					))}
				</VStack>
			)}
		</VStack>
	);
}

export function LayoutRenderer({ config }: Props) {
	const { header, sidebar, breadcrumbs, content, footer } = config;

	return (
		<Flex direction="column" minH="600px" bg="gray.50">
			{header && <Header config={header} />}
			<Flex flex={1}>
				{sidebar && <Sidebar config={sidebar} />}
				<Box flex={1} p={6}>
					{breadcrumbs && breadcrumbs.length > 0 && (
						<Breadcrumb mb={4} fontSize="sm">
							{breadcrumbs.map((item, index) => (
								<BreadcrumbItem
									key={item.label}
									isCurrentPage={index === breadcrumbs.length - 1}
								>
									<BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
								</BreadcrumbItem>
							))}
						</Breadcrumb>
					)}
					<ContentRenderer content={content} />
				</Box>
			</Flex>
			{footer && (
				<HStack
					as="footer"
					px={6}
					py={4}
					borderTopWidth={1}
					bg="white"
					justify="space-between"
				>
					{footer.text && (
						<Text fontSize="sm" color="gray.500">
							{footer.text}
						</Text>
					)}
					{footer.links && (
						<HStack spacing={4}>
							{footer.links.map((link) => (
								<Button
									key={link.label}
									variant="link"
									size="sm"
									color="gray.500"
								>
									{link.label}
								</Button>
							))}
						</HStack>
					)}
				</HStack>
			)}
		</Flex>
	);
}
