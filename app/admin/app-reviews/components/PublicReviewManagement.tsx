"use client";
import {
	Alert,
	Button,
	ButtonGroup,
	Card,
	Chip,
	Skeleton,
} from "@heroui/react";
import {
	Apple,
	CircleCheck,
	Flame,
	Globe,
	LucideIcon,
	MessagesSquare,
	Smartphone,
	Store,
} from "lucide-react";
import { useState, useCallback, useEffect, useMemo } from "react";
import AdminService, {
	type PublicReviewItem,
	type PublicReviewSource,
} from "@/app/services/admin";
import { RATING_COLORS } from "./ReviewList";
import { formatSimpleDate } from "@/app/utils/formatters";
type PublicSourceFilter =
	| "ALL"
	| "app"
	| "community"
	| "inapp"
	| "hot"
	| "review";
const SOURCE_CONFIG: Record<
	"APP_STORE" | "PLAY_STORE" | "COMMUNITY" | "HOT",
	{
		label: string;
		color: string;
		bg: string;
		Icon: LucideIcon;
	}
> = {
	APP_STORE: {
		label: "App Store",
		color: "#007AFF",
		bg: "#f0f4ff",
		Icon: Apple,
	},
	PLAY_STORE: {
		label: "Play Store",
		color: "#34A853",
		bg: "#f0fdf4",
		Icon: Store,
	},
	COMMUNITY: {
		label: "커뮤니티",
		color: "#8b5cf6",
		bg: "#f5f3ff",
		Icon: MessagesSquare,
	},
	HOT: {
		label: "인기 게시글",
		color: "#ef4444",
		bg: "#fef2f2",
		Icon: Flame,
	},
};
export default function PublicReviewManagement() {
	const [reviews, setReviews] = useState<PublicReviewItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [sourceFilter, setSourceFilter] = useState<PublicSourceFilter>("ALL");
	const fetchPublicReviews = useCallback(async (type?: string) => {
		try {
			setLoading(true);
			setError(null);
			const res = await AdminService.publicReviews.getList({
				type: type as any,
				limit: 100,
			});
			setReviews(res?.items ?? []);
		} catch (err: any) {
			setError(err.message || "공개 리뷰를 불러오는데 실패했습니다.");
			setReviews([]);
		} finally {
			setLoading(false);
		}
	}, []);
	useEffect(() => {
		fetchPublicReviews(sourceFilter === "ALL" ? undefined : sourceFilter);
	}, [fetchPublicReviews, sourceFilter]);
	const sourceCounts = useMemo(
		() =>
			(reviews ?? []).reduce<Partial<Record<PublicReviewSource, number>>>(
				(acc, r) => {
					acc[r.source] = (acc[r.source] || 0) + 1;
					return acc;
				},
				{},
			),
		[reviews],
	);
	if (error) {
		return (
			<Alert style={{ marginBottom: 16 }} status={"danger"}>
				<Alert.Content>{error}</Alert.Content>
			</Alert>
		);
	}
	return (
		<div className="space-y-4">
			{/* 공개 현황 요약 */}
			{!loading && (
				<div className="flex gap-3 flex-wrap">
					<SummaryBadge
						label="전체 공개 리뷰"
						count={reviews.length}
						color="#ff385c"
					/>
					{(Object.entries(sourceCounts) as [PublicReviewSource, number][]).map(
						([source, count]) => {
							const cfg = SOURCE_CONFIG[source];
							return cfg ? (
								<SummaryBadge
									key={source}
									label={cfg.label}
									count={count}
									color={cfg.color}
								/>
							) : null;
						},
					)}
				</div>
			)}
			{/* 필터 */}
			<Card>
				<Card.Content style={{ padding: 16 }}>
					<div className="flex items-center gap-3 flex-wrap">
						<p className={"text-sm text-neutral-700"}>소스 필터:</p>
						<ButtonGroup aria-label={"지표 필터"} className={"flex flex-wrap"}>
							<Button
								style={{
									paddingLeft: 16,
									paddingRight: 16,
									paddingTop: 4,
									paddingBottom: 4,
								}}
								variant={sourceFilter === "ALL" ? "primary" : "secondary"}
								aria-pressed={sourceFilter === "ALL"}
								onPress={() => setSourceFilter("ALL")}
							>
								전체
							</Button>
							<Button
								style={{
									paddingLeft: 16,
									paddingRight: 16,
									paddingTop: 4,
									paddingBottom: 4,
								}}
								variant={sourceFilter === "app" ? "primary" : "secondary"}
								aria-pressed={sourceFilter === "app"}
								onPress={() => setSourceFilter("app")}
							>
								<Smartphone
									style={{ fontSize: 18, marginRight: 4 }}
									size={18}
								/>
								스토어 + 인기글
							</Button>
							<Button
								style={{
									paddingLeft: 16,
									paddingRight: 16,
									paddingTop: 4,
									paddingBottom: 4,
								}}
								variant={sourceFilter === "inapp" ? "primary" : "secondary"}
								aria-pressed={sourceFilter === "inapp"}
								onPress={() => setSourceFilter("inapp")}
							>
								<Flame style={{ fontSize: 18, marginRight: 4 }} size={18} />
								인앱 리뷰
							</Button>
							<Button
								style={{
									paddingLeft: 16,
									paddingRight: 16,
									paddingTop: 4,
									paddingBottom: 4,
								}}
								variant={sourceFilter === "hot" ? "primary" : "secondary"}
								aria-pressed={sourceFilter === "hot"}
								onPress={() => setSourceFilter("hot")}
							>
								<Flame style={{ fontSize: 18, marginRight: 4 }} size={18} />
								인기글만
							</Button>
							<Button
								style={{
									paddingLeft: 16,
									paddingRight: 16,
									paddingTop: 4,
									paddingBottom: 4,
								}}
								variant={sourceFilter === "review" ? "primary" : "secondary"}
								aria-pressed={sourceFilter === "review"}
								onPress={() => setSourceFilter("review")}
							>
								<MessagesSquare
									style={{ fontSize: 18, marginRight: 4 }}
									size={18}
								/>
								리뷰만
							</Button>
							<Button
								style={{
									paddingLeft: 16,
									paddingRight: 16,
									paddingTop: 4,
									paddingBottom: 4,
								}}
								variant={sourceFilter === "community" ? "primary" : "secondary"}
								aria-pressed={sourceFilter === "community"}
								onPress={() => setSourceFilter("community")}
							>
								<MessagesSquare
									style={{ fontSize: 18, marginRight: 4 }}
									size={18}
								/>
								커뮤니티
							</Button>
						</ButtonGroup>
					</div>
				</Card.Content>
			</Card>
			{/* 리뷰 목록 */}
			{loading ? (
				<div className="space-y-3">
					{Array.from({ length: 6 }).map((_, i) => (
						<Skeleton
							key={i}
							style={{
								...{ borderRadius: 16 },
								...{ width: "100%", height: 130 },
							}}
							className="rounded-xl"
						/>
					))}
				</div>
			) : reviews.length === 0 ? (
				<Card>
					<Card.Content>
						<p
							className={["text-center py-8", "text-sm text-neutral-700"]
								.filter(Boolean)
								.join(" ")}
						>
							공개 처리된 리뷰가 없습니다
						</p>
					</Card.Content>
				</Card>
			) : (
				<div className="space-y-3">
					{reviews.map((review) => (
						<PublicReviewCard key={review.id} review={review} />
					))}
				</div>
			)}
		</div>
	);
}
// ─── 공개 현황 배지 ───────────────────────────────────
function SummaryBadge({
	label,
	count,
	color,
}: {
	label: string;
	count: number;
	color: string;
}) {
	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				gap: 12,
				paddingLeft: 16,
				paddingRight: 16,
				paddingTop: 8,
				paddingBottom: 8,
				borderRadius: 16,
				backgroundColor: "#fff",
				border: "1px solid #e5e7eb",
			}}
		>
			<CircleCheck style={{ fontSize: 20 }} size={18} />
			<div>
				<span className={"text-sm text-neutral-700"}>{label}</span>
				<p className={"text-sm text-neutral-700"}>{count}건</p>
			</div>
		</div>
	);
}
// ─── 공개 리뷰 카드 ──────────────────────────────────
function PublicReviewCard({
	review,
}: {
	review: PublicReviewItem;
}) {
	const cfg = SOURCE_CONFIG[review.source];
	const Icon = cfg?.Icon;
	return (
		<Card style={{ borderLeft: `4px solid ${cfg?.color ?? "#9ca3af"}` }}>
			<Card.Content style={{ padding: 20 }}>
				<div className="flex items-start justify-between gap-3">
					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-2 mb-1.5 flex-wrap">
							{review.rating != null && (
								<span
									role="img"
									aria-label={"별점 " + review.rating + "점"}
									className="text-amber-500"
								>
									{"★".repeat(Math.round(review.rating ?? 0))}
									{"☆".repeat(5 - Math.round(review.rating ?? 0))}
								</span>
							)}
							{review.title && (
								<p className={"text-sm text-neutral-700"}>{review.title}</p>
							)}
							{cfg && Icon && (
								<Chip
									style={{
										backgroundColor: cfg.bg,
										color: cfg.color,
										fontWeight: 500,
									}}
									size={"sm"}
									variant={"soft"}
								>
									{<Icon />}
									<Chip.Label>{cfg.label}</Chip.Label>
								</Chip>
							)}
						</div>
						<p
							style={{
								marginBottom: 12,
								lineHeight: 1.6,
								display: "-webkit-box",
								WebkitLineClamp: 3,
								WebkitBoxOrient: "vertical",
								overflow: "hidden",
							}}
							className={"text-sm text-neutral-700"}
						>
							{review.body}
						</p>
						<div className="flex items-center gap-2 flex-wrap">
							<span className={"text-sm text-neutral-700"}>
								{review.author?.nickname ?? "익명"}
							</span>
							{review.author?.university && (
								<>
									<span className={"text-sm text-neutral-700"}>·</span>
									<span className={"text-sm text-neutral-700"}>
										{review.author.university.name}
									</span>
								</>
							)}
							<span className={"text-sm text-neutral-700"}>·</span>
							<span className={"text-sm text-neutral-700"}>
								{formatSimpleDate(review.createdAt)}
							</span>
						</div>
						<div
							style={{
								marginTop: 8,
								paddingLeft: 12,
								paddingRight: 12,
								paddingTop: 6,
								paddingBottom: 6,
								borderRadius: 12,
								backgroundColor: "#f0fdf4",
								border: "1px solid #bbf7d0",
								display: "inline-flex",
								alignItems: "center",
								gap: 8,
							}}
						>
							<CircleCheck
								style={{ fontSize: 14, color: "#22c55e" }}
								size={18}
							/>
							<span className={"text-sm text-neutral-700"}>
								공개일: {formatSimpleDate(review.featuredAt)}
							</span>
						</div>
					</div>
					<Chip
						style={{ fontWeight: 600, flexShrink: 0 }}
						size={"sm"}
						variant={"soft"}
					>
						{<Globe size={18} />}
						<Chip.Label>{"공개 중"}</Chip.Label>
					</Chip>
				</div>
			</Card.Content>
		</Card>
	);
}
