import { Box, Container, Heading, Text, VStack } from "@chakra-ui/react";
import { AlertRenderer } from "./components/AlertRenderer";
import { AuthRenderer } from "./components/AuthRenderer";
import { CalendarRenderer } from "./components/CalendarRenderer";
import { CardGridRenderer } from "./components/CardGridRenderer";
import { ChatRenderer } from "./components/ChatRenderer";
import { ConfirmRenderer } from "./components/ConfirmRenderer";
import { CrudRenderer } from "./components/CrudRenderer";
import { DashboardRenderer } from "./components/DashboardRenderer";
import { DetailRenderer } from "./components/DetailRenderer";
import { DrawerRenderer } from "./components/DrawerRenderer";
import { EmptyStateRenderer } from "./components/EmptyStateRenderer";
import { FaqRenderer } from "./components/FaqRenderer";
import { FormRenderer } from "./components/FormRenderer";
import { GalleryRenderer } from "./components/GalleryRenderer";
import { HeroRenderer } from "./components/HeroRenderer";
import { KanbanRenderer } from "./components/KanbanRenderer";
import { LayoutRenderer } from "./components/LayoutRenderer";
import { ModalRenderer } from "./components/ModalRenderer";
import { PricingRenderer } from "./components/PricingRenderer";
import { ProfileRenderer } from "./components/ProfileRenderer";
import { SettingsRenderer } from "./components/SettingsRenderer";
import { StatsRenderer } from "./components/StatsRenderer";
import { TableRenderer } from "./components/TableRenderer";
import { TabsRenderer } from "./components/TabsRenderer";
import { TimelineRenderer } from "./components/TimelineRenderer";
import { WizardRenderer } from "./components/WizardRenderer";
import { type LoadedWireframe, useWireframes } from "./hooks/useWireframes";
import { toSafeName } from "./utils";

const renderers = {
	form: FormRenderer,
	table: TableRenderer,
	detail: DetailRenderer,
	dashboard: DashboardRenderer,
	crud: CrudRenderer,
	layout: LayoutRenderer,
	tabs: TabsRenderer,
	"card-grid": CardGridRenderer,
	wizard: WizardRenderer,
	"empty-state": EmptyStateRenderer,
	modal: ModalRenderer,
	drawer: DrawerRenderer,
	confirm: ConfirmRenderer,
	alert: AlertRenderer,
	timeline: TimelineRenderer,
	gallery: GalleryRenderer,
	pricing: PricingRenderer,
	faq: FaqRenderer,
	hero: HeroRenderer,
	stats: StatsRenderer,
	kanban: KanbanRenderer,
	calendar: CalendarRenderer,
	chat: ChatRenderer,
	profile: ProfileRenderer,
	settings: SettingsRenderer,
	auth: AuthRenderer,
} as const;

function WireframeRenderer({ wireframe }: { wireframe: LoadedWireframe }) {
	const Renderer = renderers[wireframe.type as keyof typeof renderers];

	return (
		<Box
			id={`wireframe-${toSafeName(wireframe.name)}`}
			p={6}
			bg="white"
			borderRadius="md"
			boxShadow="md"
			mb={6}
		>
			<Heading size="md" mb={4}>
				{wireframe.name}
			</Heading>
			{Renderer ? (
				<Renderer config={wireframe.config as never} />
			) : (
				<Text>Unknown wireframe type: {wireframe.type}</Text>
			)}
		</Box>
	);
}

export default function App() {
	const { wireframes, loading, error } = useWireframes();

	if (loading) {
		return (
			<Container py={8}>
				<Text>Loading wireframes...</Text>
			</Container>
		);
	}

	if (error) {
		return (
			<Container py={8}>
				<Text color="red.500">Error: {error}</Text>
				<Text mt={2} fontSize="sm">
					Run: npx tsx generate.ts your-design.md
				</Text>
			</Container>
		);
	}

	if (wireframes.length === 0) {
		return (
			<Container py={8}>
				<Text>No wireframes found</Text>
			</Container>
		);
	}

	return (
		<Box bg="gray.100" minH="100vh" py={8}>
			<Container maxW="container.xl" id="wireframe-container">
				<Heading mb={6}>Wireframe Preview</Heading>
				<VStack spacing={6} align="stretch">
					{wireframes.map((wf) => (
						<WireframeRenderer key={wf.name} wireframe={wf} />
					))}
				</VStack>
			</Container>
		</Box>
	);
}
