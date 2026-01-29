import {
	Box,
	Button,
	Divider,
	Heading,
	HStack,
	Icon,
	Image,
	Link,
	Text,
	VStack,
} from "@chakra-ui/react";
import { FaApple, FaFacebook, FaGoogle, FaTwitter } from "react-icons/fa";
import { FiGithub } from "react-icons/fi";
import type { AuthWireframe } from "../../types";
import { FormRenderer } from "./FormRenderer";

interface Props {
	config: AuthWireframe;
}

const providerConfig = {
	google: { icon: FaGoogle, label: "Google", color: "red" },
	github: { icon: FiGithub, label: "GitHub", color: "gray" },
	facebook: { icon: FaFacebook, label: "Facebook", color: "facebook" },
	twitter: { icon: FaTwitter, label: "Twitter", color: "twitter" },
	apple: { icon: FaApple, label: "Apple", color: "gray" },
};

const defaultTitles = {
	login: "ログイン",
	register: "アカウント作成",
	"forgot-password": "パスワードをお忘れですか？",
	"reset-password": "パスワードのリセット",
	"verify-email": "メール確認",
	"two-factor": "2段階認証",
};

const defaultDescriptions = {
	login: "アカウントにログインしてください",
	register: "新しいアカウントを作成します",
	"forgot-password": "登録したメールアドレスを入力してください",
	"reset-password": "新しいパスワードを設定してください",
	"verify-email": "メールに送信された確認コードを入力してください",
	"two-factor": "認証アプリのコードを入力してください",
};

export function AuthRenderer({ config }: Props) {
	const {
		variant,
		title,
		description,
		logo,
		fields,
		submitLabel,
		socialProviders,
		links,
		footer,
	} = config;

	const displayTitle = title ?? defaultTitles[variant];
	const displayDescription = description ?? defaultDescriptions[variant];
	const displaySubmitLabel =
		submitLabel ??
		(variant === "login"
			? "ログイン"
			: variant === "register"
				? "登録"
				: "送信");

	return (
		<Box maxW="400px" mx="auto" py={8}>
			<VStack spacing={6} align="stretch">
				{logo && (
					<HStack justify="center">
						{logo.image ? (
							<Image src={logo.image} alt="Logo" h="40px" />
						) : (
							<Heading size="lg" color="blue.500">
								{logo.text}
							</Heading>
						)}
					</HStack>
				)}

				<VStack spacing={1} textAlign="center">
					<Heading size="lg">{displayTitle}</Heading>
					{displayDescription && (
						<Text color="gray.600">{displayDescription}</Text>
					)}
				</VStack>

				{socialProviders && socialProviders.length > 0 && (
					<>
						<VStack spacing={2}>
							{socialProviders.map((provider) => {
								const { icon, label } = providerConfig[provider];
								return (
									<Button
										key={provider}
										w="full"
										variant="outline"
										leftIcon={<Icon as={icon} />}
									>
										{label}で続ける
									</Button>
								);
							})}
						</VStack>
						<HStack>
							<Divider />
							<Text fontSize="sm" color="gray.500" whiteSpace="nowrap">
								または
							</Text>
							<Divider />
						</HStack>
					</>
				)}

				<FormRenderer
					config={{
						screen: "",
						type: "form",
						fields,
						buttons: [{ label: displaySubmitLabel, variant: "primary" }],
					}}
				/>

				{links && links.length > 0 && (
					<VStack spacing={2}>
						{links.map((link) => (
							<Link key={link.label} color="blue.500" fontSize="sm">
								{link.label}
							</Link>
						))}
					</VStack>
				)}

				{footer && (
					<Text fontSize="sm" color="gray.500" textAlign="center">
						{footer}
					</Text>
				)}
			</VStack>
		</Box>
	);
}
