// ============================================
// Shared Types
// ============================================

export interface FieldOption {
	value: string;
	label: string;
}

export interface FormField {
	name: string;
	label: string;
	type:
		| "text"
		| "email"
		| "password"
		| "number"
		| "textarea"
		| "select"
		| "checkbox"
		| "radio"
		| "date"
		| "file"
		| "time"
		| "datetime"
		| "color"
		| "range"
		| "tel"
		| "url"
		| "hidden"
		| "pin";
	required?: boolean;
	placeholder?: string;
	maxLength?: number;
	min?: number;
	max?: number;
	step?: number;
	rows?: number;
	options?: FieldOption[];
	accept?: string;
	disabled?: boolean;
	helperText?: string;
	defaultValue?: string | number | boolean;
	pinLength?: number;
}

export interface FormButton {
	label: string;
	variant: "primary" | "secondary" | "danger" | "ghost" | "link" | "outline";
	icon?: IconType;
	disabled?: boolean;
}

export type IconType =
	| "users"
	| "currency"
	| "activity"
	| "chart"
	| "inbox"
	| "settings"
	| "home"
	| "search"
	| "plus"
	| "edit"
	| "delete"
	| "check"
	| "close"
	| "arrow-left"
	| "arrow-right"
	| "download"
	| "upload"
	| "filter"
	| "calendar"
	| "clock"
	| "star"
	| "heart"
	| "bell"
	| "mail"
	| "phone"
	| "map"
	| "link"
	| "image"
	| "file"
	| "folder"
	| "lock"
	| "unlock"
	| "eye"
	| "eye-off"
	| "alert"
	| "info"
	| "help"
	| "warning"
	| "error"
	| "success";

// ============================================
// Form Wireframe
// ============================================

export interface FormWireframe {
	screen: string;
	type: "form";
	title?: string;
	description?: string;
	fields: FormField[];
	buttons?: FormButton[];
	layout?: "vertical" | "horizontal" | "grid";
	columns?: number;
}

// ============================================
// Table Wireframe
// ============================================

export interface TableColumn {
	name: string;
	label: string;
	width?: number;
	type?:
		| "text"
		| "badge"
		| "date"
		| "currency"
		| "number"
		| "image"
		| "avatar"
		| "progress"
		| "link"
		| "boolean";
	sortable?: boolean;
	filterable?: boolean;
}

export type TableAction =
	| "search"
	| "pagination"
	| "create-button"
	| "row-edit"
	| "row-delete"
	| "row-view"
	| "bulk-select"
	| "bulk-delete"
	| "export"
	| "import"
	| "filter"
	| "sort"
	| "refresh";

export interface TableWireframe {
	screen: string;
	type: "table";
	title?: string;
	description?: string;
	columns: TableColumn[];
	actions?: TableAction[];
	data?: Record<string, unknown>[];
	emptyState?: EmptyStateContent;
}

// ============================================
// Detail Wireframe
// ============================================

export interface DetailField {
	label: string;
	value: string;
	type?:
		| "text"
		| "badge"
		| "date"
		| "link"
		| "image"
		| "avatar"
		| "currency"
		| "boolean"
		| "list"
		| "html";
	span?: number; // grid span
}

export interface DetailSection {
	title: string;
	fields: DetailField[];
	collapsible?: boolean;
	defaultExpanded?: boolean;
}

export interface DetailWireframe {
	screen: string;
	type: "detail";
	title?: string;
	subtitle?: string;
	avatar?: { src?: string; name: string };
	sections: DetailSection[];
	actions?: FormButton[];
	tabs?: TabItem[];
}

// ============================================
// Dashboard Wireframe
// ============================================

export interface DashboardStat {
	label: string;
	value: string;
	icon?: IconType;
	trend?: string;
	trendDirection?: "up" | "down" | "neutral";
	color?: "blue" | "green" | "red" | "yellow" | "purple" | "gray";
}

export interface DashboardWidget {
	type:
		| "chart"
		| "table"
		| "list"
		| "calendar"
		| "map"
		| "progress"
		| "activity";
	title: string;
	chartType?: "line" | "bar" | "pie" | "area" | "donut" | "radar";
	columns?: { label: string }[];
	items?: { label: string; value?: string }[];
	span?: number; // grid span (1-4)
}

export interface DashboardWireframe {
	screen: string;
	type: "dashboard";
	title?: string;
	stats?: DashboardStat[];
	widgets?: DashboardWidget[];
	actions?: FormButton[];
}

// ============================================
// CRUD Wireframe
// ============================================

export interface CrudWireframe {
	screen: string;
	type: "crud";
	table: Omit<TableWireframe, "screen" | "type">;
	form: {
		title: string;
		fields: FormField[];
	};
}

// ============================================
// Layout Wireframe (NEW)
// ============================================

export interface NavItem {
	label: string;
	icon?: IconType;
	href?: string;
	active?: boolean;
	badge?: string | number;
	children?: NavItem[];
}

export interface HeaderConfig {
	logo?: { text?: string; image?: string };
	nav?: NavItem[];
	search?: boolean;
	notifications?: boolean;
	userMenu?: {
		name: string;
		avatar?: string;
		items?: NavItem[];
	};
}

export interface SidebarConfig {
	title?: string;
	logo?: { text?: string; image?: string };
	items: NavItem[];
	collapsed?: boolean;
	footer?: NavItem[];
}

export interface BreadcrumbItem {
	label: string;
	href?: string;
}

export interface LayoutWireframe {
	screen: string;
	type: "layout";
	header?: HeaderConfig;
	sidebar?: SidebarConfig;
	breadcrumbs?: BreadcrumbItem[];
	content: WireframeContent;
	footer?: {
		text?: string;
		links?: NavItem[];
	};
}

// ============================================
// Tabs Wireframe (NEW)
// ============================================

export interface TabItem {
	label: string;
	icon?: IconType;
	badge?: string | number;
	disabled?: boolean;
	content: WireframeContent;
}

export interface TabsWireframe {
	screen: string;
	type: "tabs";
	title?: string;
	description?: string;
	variant?: "line" | "enclosed" | "soft-rounded" | "solid-rounded";
	orientation?: "horizontal" | "vertical";
	tabs: TabItem[];
	actions?: FormButton[];
}

// ============================================
// Card Grid Wireframe (NEW)
// ============================================

export interface CardItem {
	title: string;
	subtitle?: string;
	description?: string;
	image?: string;
	avatar?: { src?: string; name: string };
	badge?: { label: string; color?: string };
	stats?: { label: string; value: string }[];
	actions?: FormButton[];
	href?: string;
}

export interface CardGridWireframe {
	screen: string;
	type: "card-grid";
	title?: string;
	description?: string;
	columns?: 1 | 2 | 3 | 4;
	cards: CardItem[];
	actions?: FormButton[]; // header actions like "Add New"
	pagination?: boolean;
	emptyState?: EmptyStateContent;
}

// ============================================
// Wizard / Stepper Wireframe (NEW)
// ============================================

export interface WizardStep {
	title: string;
	description?: string;
	icon?: IconType;
	fields?: FormField[];
	content?: WireframeContent;
	optional?: boolean;
}

export interface WizardWireframe {
	screen: string;
	type: "wizard";
	title?: string;
	description?: string;
	steps: WizardStep[];
	currentStep?: number;
	orientation?: "horizontal" | "vertical";
	allowSkip?: boolean;
	showStepNumbers?: boolean;
}

// ============================================
// Empty State Wireframe (NEW)
// ============================================

export interface EmptyStateContent {
	icon?: IconType;
	image?: string;
	title: string;
	description?: string;
	actions?: FormButton[];
}

export interface EmptyStateWireframe {
	screen: string;
	type: "empty-state";
	variant?:
		| "default"
		| "error"
		| "no-results"
		| "no-permission"
		| "maintenance";
	icon?: IconType;
	image?: string;
	title: string;
	description?: string;
	actions?: FormButton[];
}

// ============================================
// Modal Wireframe (NEW)
// ============================================

export interface ModalWireframe {
	screen: string;
	type: "modal";
	title: string;
	size?: "xs" | "sm" | "md" | "lg" | "xl" | "full";
	closable?: boolean;
	content: WireframeContent;
	footer?: {
		actions?: FormButton[];
		align?: "left" | "center" | "right";
	};
}

// ============================================
// Drawer Wireframe (NEW)
// ============================================

export interface DrawerWireframe {
	screen: string;
	type: "drawer";
	title?: string;
	placement?: "left" | "right" | "top" | "bottom";
	size?: "xs" | "sm" | "md" | "lg" | "xl" | "full";
	closable?: boolean;
	content: WireframeContent;
	footer?: {
		actions?: FormButton[];
	};
}

// ============================================
// Confirm Dialog Wireframe (NEW)
// ============================================

export interface ConfirmWireframe {
	screen: string;
	type: "confirm";
	variant?: "info" | "warning" | "danger" | "success";
	icon?: IconType;
	title: string;
	message: string;
	confirmLabel?: string;
	cancelLabel?: string;
	confirmVariant?: FormButton["variant"];
}

// ============================================
// Alert / Notification Wireframe (NEW)
// ============================================

export interface AlertItem {
	title?: string;
	message: string;
	variant: "info" | "warning" | "error" | "success";
	closable?: boolean;
	action?: FormButton;
}

export interface AlertWireframe {
	screen: string;
	type: "alert";
	alerts: AlertItem[];
}

// ============================================
// Timeline Wireframe (NEW)
// ============================================

export interface TimelineItem {
	title: string;
	description?: string;
	timestamp?: string;
	icon?: IconType;
	color?: "blue" | "green" | "red" | "yellow" | "purple" | "gray";
	user?: { name: string; avatar?: string };
}

export interface TimelineWireframe {
	screen: string;
	type: "timeline";
	title?: string;
	items: TimelineItem[];
	orientation?: "vertical" | "horizontal";
}

// ============================================
// Gallery Wireframe (NEW)
// ============================================

export interface GalleryItem {
	src: string;
	alt?: string;
	caption?: string;
	thumbnail?: string;
}

export interface GalleryWireframe {
	screen: string;
	type: "gallery";
	title?: string;
	description?: string;
	items: GalleryItem[];
	columns?: 2 | 3 | 4 | 5 | 6;
	aspectRatio?: "square" | "video" | "portrait";
	lightbox?: boolean;
}

// ============================================
// Pricing Wireframe (NEW)
// ============================================

export interface PricingFeature {
	label: string;
	included: boolean;
	tooltip?: string;
}

export interface PricingPlan {
	name: string;
	description?: string;
	price: string;
	period?: string;
	featured?: boolean;
	features: PricingFeature[];
	action: FormButton;
	badge?: string;
}

export interface PricingWireframe {
	screen: string;
	type: "pricing";
	title?: string;
	description?: string;
	plans: PricingPlan[];
	billingToggle?: boolean;
}

// ============================================
// FAQ Wireframe (NEW)
// ============================================

export interface FaqItem {
	question: string;
	answer: string;
	category?: string;
}

export interface FaqWireframe {
	screen: string;
	type: "faq";
	title?: string;
	description?: string;
	items: FaqItem[];
	searchable?: boolean;
	categorized?: boolean;
}

// ============================================
// Landing / Hero Wireframe (NEW)
// ============================================

export interface HeroWireframe {
	screen: string;
	type: "hero";
	variant?: "centered" | "split" | "image-bg";
	title: string;
	subtitle?: string;
	description?: string;
	image?: string;
	video?: string;
	actions?: FormButton[];
	features?: { icon?: IconType; title: string; description?: string }[];
}

// ============================================
// Stats / Metrics Wireframe (NEW)
// ============================================

export interface StatsWireframe {
	screen: string;
	type: "stats";
	title?: string;
	description?: string;
	stats: DashboardStat[];
	columns?: 2 | 3 | 4;
	variant?: "simple" | "card" | "icon";
}

// ============================================
// Kanban Board Wireframe (NEW)
// ============================================

export interface KanbanCard {
	id: string;
	title: string;
	description?: string;
	labels?: { label: string; color: string }[];
	assignee?: { name: string; avatar?: string };
	dueDate?: string;
	comments?: number;
	attachments?: number;
}

export interface KanbanColumn {
	id: string;
	title: string;
	color?: string;
	cards: KanbanCard[];
	limit?: number;
}

export interface KanbanWireframe {
	screen: string;
	type: "kanban";
	title?: string;
	columns: KanbanColumn[];
}

// ============================================
// Calendar Wireframe (NEW)
// ============================================

export interface CalendarEvent {
	title: string;
	start: string;
	end?: string;
	color?: string;
	allDay?: boolean;
}

export interface CalendarWireframe {
	screen: string;
	type: "calendar";
	title?: string;
	view?: "month" | "week" | "day" | "agenda";
	events?: CalendarEvent[];
	actions?: FormButton[];
}

// ============================================
// Chat Wireframe (NEW)
// ============================================

export interface ChatMessage {
	id: string;
	content: string;
	sender: { name: string; avatar?: string };
	timestamp: string;
	isOwn?: boolean;
	status?: "sent" | "delivered" | "read";
}

export interface ChatWireframe {
	screen: string;
	type: "chat";
	title?: string;
	participants?: {
		name: string;
		avatar?: string;
		status?: "online" | "offline" | "away";
	}[];
	messages: ChatMessage[];
	inputPlaceholder?: string;
}

// ============================================
// Profile Wireframe (NEW)
// ============================================

export interface ProfileWireframe {
	screen: string;
	type: "profile";
	user: {
		name: string;
		avatar?: string;
		coverImage?: string;
		title?: string;
		bio?: string;
		stats?: { label: string; value: string }[];
		social?: { platform: string; url: string }[];
	};
	tabs?: TabItem[];
	actions?: FormButton[];
}

// ============================================
// Settings Wireframe (NEW)
// ============================================

export interface SettingsSection {
	title: string;
	description?: string;
	fields: FormField[];
}

export interface SettingsWireframe {
	screen: string;
	type: "settings";
	title?: string;
	description?: string;
	sections: SettingsSection[];
	sidebar?: NavItem[];
}

// ============================================
// Login / Auth Wireframe (NEW)
// ============================================

export interface AuthWireframe {
	screen: string;
	type: "auth";
	variant:
		| "login"
		| "register"
		| "forgot-password"
		| "reset-password"
		| "verify-email"
		| "two-factor";
	title?: string;
	description?: string;
	logo?: { text?: string; image?: string };
	fields: FormField[];
	submitLabel?: string;
	socialProviders?: ("google" | "github" | "facebook" | "twitter" | "apple")[];
	links?: { label: string; href: string }[];
	footer?: string;
}

// ============================================
// Composite Content Type
// ============================================

export type WireframeContent =
	| { type: "form"; config: Omit<FormWireframe, "screen" | "type"> }
	| { type: "table"; config: Omit<TableWireframe, "screen" | "type"> }
	| { type: "detail"; config: Omit<DetailWireframe, "screen" | "type"> }
	| { type: "dashboard"; config: Omit<DashboardWireframe, "screen" | "type"> }
	| { type: "card-grid"; config: Omit<CardGridWireframe, "screen" | "type"> }
	| { type: "timeline"; config: Omit<TimelineWireframe, "screen" | "type"> }
	| { type: "empty-state"; config: EmptyStateContent }
	| { type: "custom"; html: string };

// ============================================
// Union Type for All Wireframes
// ============================================

export type WireframeConfig =
	| FormWireframe
	| TableWireframe
	| DetailWireframe
	| DashboardWireframe
	| CrudWireframe
	| LayoutWireframe
	| TabsWireframe
	| CardGridWireframe
	| WizardWireframe
	| EmptyStateWireframe
	| ModalWireframe
	| DrawerWireframe
	| ConfirmWireframe
	| AlertWireframe
	| TimelineWireframe
	| GalleryWireframe
	| PricingWireframe
	| FaqWireframe
	| HeroWireframe
	| StatsWireframe
	| KanbanWireframe
	| CalendarWireframe
	| ChatWireframe
	| ProfileWireframe
	| SettingsWireframe
	| AuthWireframe;

// ============================================
// Manifest
// ============================================

export interface WireframeManifestItem {
	name: string;
	type: WireframeConfig["type"];
	file: string;
}
