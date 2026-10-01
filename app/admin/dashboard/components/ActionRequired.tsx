"use client";
import { Card, Skeleton, Tooltip } from "@heroui/react";
import { Contact, GraduationCap, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ShieldBan } from "lucide-react";
import AdminService, { usersStats } from "@/app/services/admin";
import { getReviewInbox } from "@/app/services/review-inbox";
interface ActionItemCardProps {
	title: string;
	count: number;
	icon: React.ReactNode;
	link: string;
	color: string;
	bgColor: string;
	loading?: boolean;
	subtitle?: string;
	tooltip?: string;
}
function ActionItemCard({
	title,
	count,
	icon,
	link,
	color,
	bgColor,
	loading,
	subtitle,
	tooltip,
}: ActionItemCardProps) {
	const hasItems = count > 0;
	const cardContent = (
		<Link href={link} className="block flex-1 min-w-[140px]">
			<Card
				style={{
					height: "100%",
					cursor: "pointer",
					transition: "all 0.2s ease-in-out",
					border: hasItems ? `2px solid ${color}` : "1px solid #e5e7eb",
					backgroundColor: hasItems ? bgColor : "#f9fafb",
				}}
			>
				<Card.Content style={{ padding: 16 }}>
					<div className="flex items-center gap-3">
						<div
							style={{
								padding: 8,
								borderRadius: 16,
								backgroundColor: hasItems ? color : "#9ca3af",
								color: "white",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							{icon}
						</div>
						<div className="flex-1">
							<span
								style={{
									color: hasItems ? "#171717" : "#525252",
									fontWeight: 500,
								}}
								className={"text-sm text-neutral-700"}
							>
								{title}
							</span>
							{loading ? (
								<Skeleton
									style={{ width: 40, height: 28 }}
									className="rounded-xl"
								/>
							) : (
								<h2
									style={{
										fontWeight: 700,
										color: hasItems ? color : "#9ca3af",
										lineHeight: 1.2,
									}}
									className={"text-lg font-semibold text-neutral-900"}
								>
									{count}
									<span
										style={{ marginLeft: 4, color: "#525252" }}
										className={"text-sm text-neutral-700"}
									>
										건
									</span>
								</h2>
							)}
							{subtitle && (
								<span className={"text-sm text-neutral-700"}>{subtitle}</span>
							)}
						</div>
					</div>
				</Card.Content>
			</Card>
		</Link>
	);
	if (tooltip) {
		return (
			<Tooltip>
				{cardContent}
				<Tooltip.Content>{tooltip}</Tooltip.Content>
			</Tooltip>
		);
	}
	return cardContent;
}
export default function ActionRequired() {
	const [pendingReview, setPendingReview] = useState(0);
	const [reviewLoading, setReviewLoading] = useState(true);
	const [reviewInboxPending, setReviewInboxPending] = useState(0);
	const [reviewInboxLoading, setReviewInboxLoading] = useState(true);
	const [pendingCertification, setPendingCertification] = useState(0);
	const [certificationLoading, setCertificationLoading] = useState(true);
	const [blacklistedCount, setBlacklistedCount] = useState(0);
	const [blacklistedLoading, setBlacklistedLoading] = useState(true);
	useEffect(() => {
		const fetchReviewCount = async () => {
			try {
				setReviewLoading(true);
				const response = await AdminService.userReview.getPendingUsers(1, 1);
				setPendingReview(response.meta?.total ?? 0);
			} catch (_error) {
				setPendingReview(0);
			} finally {
				setReviewLoading(false);
			}
		};
		const fetchReviewInboxCount = async () => {
			try {
				setReviewInboxLoading(true);
				const response = await getReviewInbox();
				setReviewInboxPending(
					response.summary.approval + response.summary.judgment,
				);
			} catch (_error) {
				setReviewInboxPending(0);
			} finally {
				setReviewInboxLoading(false);
			}
		};
		const fetchCertificationCount = async () => {
			try {
				setCertificationLoading(true);
				const response =
					await AdminService.userAppearance.getUniversityVerificationPending({
						page: 1,
						limit: 1,
					});
				setPendingCertification(
					response.pagination?.total ?? response.total ?? 0,
				);
			} catch (_error) {
				setPendingCertification(0);
			} finally {
				setCertificationLoading(false);
			}
		};
		const fetchBlacklistedCount = async () => {
			try {
				setBlacklistedLoading(true);
				const response = await usersStats.get();
				setBlacklistedCount(response.data?.blacklisted ?? 0);
			} catch (_error) {
				setBlacklistedCount(0);
			} finally {
				setBlacklistedLoading(false);
			}
		};
		fetchReviewCount();
		fetchReviewInboxCount();
		fetchCertificationCount();
		fetchBlacklistedCount();
	}, []);
	const totalPending =
		pendingReview + reviewInboxPending + pendingCertification;
	return (
		<Card style={{ marginBottom: 24 }}>
			<Card.Content>
				<div className="flex items-center gap-2 mb-4">
					<div
						style={{
							width: 8,
							height: 8,
							borderRadius: "50%",
							backgroundColor: totalPending > 0 ? "#ef4444" : "#22c55e",
							animation: totalPending > 0 ? "pulse 2s infinite" : "none",
						}}
					></div>
					<h2 className={"text-lg font-semibold text-neutral-900"}>
						긴급 처리 필요
					</h2>
					{totalPending > 0 && (
						<span
							style={{
								marginLeft: 8,
								paddingLeft: 12,
								paddingRight: 12,
								paddingTop: 4,
								paddingBottom: 4,
								borderRadius: 80,
								backgroundColor: "#fef2f2",
								color: "#dc2626",
								fontWeight: 600,
							}}
							className={"text-sm text-neutral-700"}
						>
							총 {totalPending}건
						</span>
					)}
				</div>
				<div className="flex gap-3 flex-wrap">
					<ActionItemCard
						title="검토 인박스"
						count={reviewInboxPending}
						icon={<Sparkles size={18} />}
						link="/admin/review-inbox"
						color="#7c3aed"
						bgColor="#f5f3ff"
						loading={reviewInboxLoading}
					/>
					<ActionItemCard
						title="회원 심사"
						count={pendingReview}
						icon={<Contact size={18} />}
						link="/admin/profile-review"
						color="#3b82f6"
						bgColor="#eff6ff"
						loading={reviewLoading}
					/>
					<ActionItemCard
						title="학생증 인증"
						count={pendingCertification}
						icon={<GraduationCap size={18} />}
						link="/admin/users/appearance?tab=5"
						color="#f59e0b"
						bgColor="#fffbeb"
						loading={certificationLoading}
					/>
					<ActionItemCard
						title="블랙리스트"
						count={blacklistedCount}
						icon={<ShieldBan size={18} />}
						link="/admin/blacklist"
						color="#dc2626"
						bgColor="#fef2f2"
						loading={blacklistedLoading}
						subtitle="활성 기준"
						tooltip="suspended와 다른 수치. user_blacklist 활성 row 기준."
					/>
				</div>
			</Card.Content>
		</Card>
	);
}
