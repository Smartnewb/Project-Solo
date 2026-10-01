"use client";
import { Card } from "@heroui/react";
import {
	Apple,
	Bell,
	Gem,
	MessageCircle,
	MessageSquare,
	PanelsTopLeft,
	Sparkles,
	Users,
} from "lucide-react";
import Link from "next/link";
interface QuickAccessItemProps {
	title: string;
	icon: React.ReactNode;
	link: string;
	color: string;
	bgColor: string;
}
function QuickAccessItem({
	title,
	icon,
	link,
	color,
	bgColor,
}: QuickAccessItemProps) {
	return (
		<Link href={link} className="block">
			<div
				style={{
					padding: 16,
					borderRadius: 16,
					backgroundColor: "#fff",
					border: "1px solid #e5e7eb",
					cursor: "pointer",
					transition: "all 0.2s ease-in-out",
				}}
			>
				<div className="flex items-center gap-3">
					<div
						style={{
							padding: 8,
							borderRadius: 12,
							backgroundColor: bgColor,
							color: color,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						{icon}
					</div>
					<p className={"text-sm text-neutral-700"}>{title}</p>
				</div>
			</div>
		</Link>
	);
}
const quickAccessItems: QuickAccessItemProps[] = [
	{
		title: "검토 인박스",
		icon: <Sparkles size={18} />,
		link: "/admin/review-inbox",
		color: "#7c3aed",
		bgColor: "#f5f3ff",
	},
	{
		title: "사용자 관리",
		icon: <Users size={18} />,
		link: "/admin/users/appearance",
		color: "#3b82f6",
		bgColor: "#eff6ff",
	},
	{
		title: "매칭 관리",
		icon: <Sparkles size={18} />,
		link: "/admin/matching-management",
		color: "#ec4899",
		bgColor: "#fdf2f8",
	},
	{
		title: "구슬 관리",
		icon: <Gem size={18} />,
		link: "/admin/gems",
		color: "#8b5cf6",
		bgColor: "#f5f3ff",
	},
	{
		title: "SMS 발송",
		icon: <MessageSquare size={18} />,
		link: "/admin/sms",
		color: "#06b6d4",
		bgColor: "#ecfeff",
	},
	{
		title: "푸시 알림",
		icon: <Bell size={18} />,
		link: "/admin/push-notifications",
		color: "#f59e0b",
		bgColor: "#fffbeb",
	},
	{
		title: "채팅 관리",
		icon: <MessageCircle size={18} />,
		link: "/admin/chat",
		color: "#10b981",
		bgColor: "#ecfdf5",
	},
	{
		title: "iOS 환불",
		icon: <Apple size={18} />,
		link: "/admin/ios-refund",
		color: "#6b7280",
		bgColor: "#f3f4f6",
	},
	{
		title: "배너 관리",
		icon: <PanelsTopLeft size={18} />,
		link: "/admin/banners",
		color: "#ef4444",
		bgColor: "#fef2f2",
	},
];
export default function QuickAccess() {
	return (
		<Card>
			<Card.Content>
				<h2
					style={{ marginBottom: 24 }}
					className={"text-lg font-semibold text-neutral-900"}
				>
					🛠️ 자주 사용하는 메뉴
				</h2>
				<div className={"grid grid-cols-12 gap-4"}>
					{quickAccessItems.map((item) => (
						<div
							key={item.link}
							className={"min-w-0 col-span-6 sm:col-span-4 md:col-span-3"}
						>
							<QuickAccessItem {...item} />
						</div>
					))}
				</div>
			</Card.Content>
		</Card>
	);
}
