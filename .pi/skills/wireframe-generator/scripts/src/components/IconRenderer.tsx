import { Icon } from "@chakra-ui/react";
import {
	FiActivity,
	FiAlertCircle,
	FiAlertTriangle,
	FiArrowLeft,
	FiArrowRight,
	FiBell,
	FiCalendar,
	FiCheck,
	FiCheckCircle,
	FiClock,
	FiDollarSign,
	FiDownload,
	FiEdit,
	FiEye,
	FiEyeOff,
	FiFile,
	FiFilter,
	FiFolder,
	FiHeart,
	FiHelpCircle,
	FiHome,
	FiImage,
	FiInbox,
	FiInfo,
	FiLink,
	FiLock,
	FiMail,
	FiMap,
	FiPhone,
	FiPieChart,
	FiPlus,
	FiSearch,
	FiSettings,
	FiStar,
	FiTrash2,
	FiTrendingUp,
	FiUnlock,
	FiUpload,
	FiUsers,
	FiX,
} from "react-icons/fi";
import type { IconType as WireframeIconType } from "../../types";

const iconMap: Record<WireframeIconType, React.ComponentType> = {
	users: FiUsers,
	currency: FiDollarSign,
	activity: FiActivity,
	chart: FiPieChart,
	inbox: FiInbox,
	settings: FiSettings,
	home: FiHome,
	search: FiSearch,
	plus: FiPlus,
	edit: FiEdit,
	delete: FiTrash2,
	check: FiCheck,
	close: FiX,
	"arrow-left": FiArrowLeft,
	"arrow-right": FiArrowRight,
	download: FiDownload,
	upload: FiUpload,
	filter: FiFilter,
	calendar: FiCalendar,
	clock: FiClock,
	star: FiStar,
	heart: FiHeart,
	bell: FiBell,
	mail: FiMail,
	phone: FiPhone,
	map: FiMap,
	link: FiLink,
	image: FiImage,
	file: FiFile,
	folder: FiFolder,
	lock: FiLock,
	unlock: FiUnlock,
	eye: FiEye,
	"eye-off": FiEyeOff,
	alert: FiAlertCircle,
	info: FiInfo,
	help: FiHelpCircle,
	warning: FiAlertTriangle,
	error: FiAlertCircle,
	success: FiCheckCircle,
};

interface Props {
	icon: WireframeIconType;
	boxSize?: number | string;
	color?: string;
}

export function IconRenderer({ icon, boxSize = 5, color }: Props) {
	const IconComponent = iconMap[icon] ?? FiHelpCircle;
	return <Icon as={IconComponent} boxSize={boxSize} color={color} />;
}

export function getTrendIcon(direction?: "up" | "down" | "neutral") {
	if (direction === "up") return FiTrendingUp;
	if (direction === "down") return FiTrendingUp;
	return FiActivity;
}
