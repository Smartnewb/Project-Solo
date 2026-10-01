"use client";
import {
	Alert,
	Button,
	ButtonGroup,
	Card,
	Chip,
	Input,
	Label,
	ListBox,
	Select,
	Skeleton,
	Spinner,
	TextField,
	Tooltip,
} from "@heroui/react";
import {
	Apple,
	ChevronDown,
	Globe,
	GlobeLock,
	ListFilter,
	Smartphone,
	Star,
	Store,
} from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import AdminService, {
	type AppReviewItem,
	type AppReviewsParams,
} from "@/app/services/admin";
import { useToast } from "@/shared/ui/admin/toast";
import { safeToLocaleDateString } from "@/app/utils/formatters";
interface ReviewListProps {
	initialFilter?: {
		rating?: number;
		store?: "APP_STORE" | "PLAY_STORE";
	} | null;
	onFilterClear?: () => void;
}
const STORE_LABELS: Record<string, string> = {
	APP_STORE: "App Store",
	PLAY_STORE: "Play Store",
};
export const RATING_COLORS: Record<number, string> = {
	1: "#ef4444",
	2: "#f97316",
	3: "#eab308",
	4: "#84cc16",
	5: "#22c55e",
};
export default function ReviewList({
	initialFilter,
	onFilterClear,
}: ReviewListProps) {
	const [reviews, setReviews] = useState<AppReviewItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [nextCursor, setNextCursor] = useState<string | null>(null);
	const [togglingId, setTogglingId] = useState<string | null>(null);
	const toast = useToast();
	// 필터 상태
	const [store, setStore] = useState<"APP_STORE" | "PLAY_STORE" | "ALL">(
		initialFilter?.store || "ALL",
	);
	const [rating, setRating] = useState<number | 0>(initialFilter?.rating || 0);
	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");
	const isInitialMount = useRef(true);
	// initialFilter가 변경되면 필터 적용
	useEffect(() => {
		if (initialFilter) {
			if (initialFilter.store) setStore(initialFilter.store);
			if (initialFilter.rating) setRating(initialFilter.rating);
		}
	}, [initialFilter]);
	const buildParams = useCallback((): AppReviewsParams => {
		const params: AppReviewsParams = { limit: 20 };
		if (store !== "ALL") params.store = store;
		if (rating > 0) params.rating = rating;
		if (startDate) params.startDate = startDate;
		if (endDate) params.endDate = endDate;
		return params;
	}, [store, rating, startDate, endDate]);
	const fetchReviews = useCallback(
		async (isLoadMore = false) => {
			try {
				if (isLoadMore) {
					setLoadingMore(true);
				} else {
					setLoading(true);
				}
				setError(null);
				const params = buildParams();
				if (isLoadMore && nextCursor) {
					params.cursor = nextCursor;
				}
				const data = await AdminService.appReviews.getList(params);
				if (isLoadMore) {
					setReviews((prev) => [...prev, ...data.items]);
				} else {
					setReviews(data.items);
				}
				setNextCursor(data.nextCursor);
			} catch (err: any) {
				setError(err.message || "리뷰를 불러오는데 실패했습니다.");
			} finally {
				setLoading(false);
				setLoadingMore(false);
			}
		},
		[buildParams, nextCursor],
	);
	const handleToggleFeatured = async (review: AppReviewItem) => {
		setTogglingId(review.pk);
		try {
			const result = await AdminService.appReviews.toggleFeatured(review.pk);
			setReviews((prev) =>
				prev.map((r) =>
					r.pk === review.pk
						? {
								...r,
								isFeatured: result.isFeatured,
								featuredAt: result.isFeatured
									? new Date().toISOString()
									: undefined,
							}
						: r,
				),
			);
			if (result.isFeatured) toast.success("외부 공개 처리되었습니다.");
			else toast.info("외부 공개가 해제되었습니다.");
		} catch {
			toast.error("처리 중 오류가 발생했습니다.");
		} finally {
			setTogglingId(null);
		}
	};
	// 필터 변경 시 재조회
	useEffect(() => {
		if (isInitialMount.current) {
			isInitialMount.current = false;
			fetchReviews();
			return;
		}
		fetchReviews();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [store, rating, startDate, endDate]);
	const handleClearAllFilters = () => {
		setStore("ALL");
		setRating(0);
		setStartDate("");
		setEndDate("");
		onFilterClear?.();
	};
	const activeFilterCount =
		(store !== "ALL" ? 1 : 0) +
		(rating > 0 ? 1 : 0) +
		(startDate ? 1 : 0) +
		(endDate ? 1 : 0);
	const formatDate = (dateStr: string) => {
		return safeToLocaleDateString(dateStr, "ko-KR", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};
	return (
		<div className="space-y-4">
			{/* 필터 바 */}
			<Card>
				<Card.Content style={{ padding: 16 }}>
					<div className="flex items-center gap-2 mb-3">
						<ListFilter style={{ color: "#525252", fontSize: 20 }} size={18} />
						<p className={"text-sm text-neutral-700"}>필터</p>
						{activeFilterCount > 0 && (
							<Chip style={{ height: 22 }} size={"sm"} variant={"soft"}>
								<Chip.Label>{`${activeFilterCount}개 활성`}</Chip.Label>
							</Chip>
						)}
					</div>
					<div className="flex flex-wrap items-center gap-3">
						{/* 스토어 토글 */}
						<ButtonGroup aria-label={"지표 필터"} className={"flex flex-wrap"}>
							<Button
								style={{
									paddingLeft: 16,
									paddingRight: 16,
									paddingTop: 4,
									paddingBottom: 4,
								}}
								variant={store === "ALL" ? "primary" : "secondary"}
								aria-pressed={store === "ALL"}
								onPress={() => setStore("ALL")}
							>
								<Smartphone
									style={{ fontSize: 18, marginRight: 4 }}
									size={18}
								/>
								전체
							</Button>
							<Button
								style={{
									paddingLeft: 16,
									paddingRight: 16,
									paddingTop: 4,
									paddingBottom: 4,
								}}
								variant={store === "APP_STORE" ? "primary" : "secondary"}
								aria-pressed={store === "APP_STORE"}
								onPress={() => setStore("APP_STORE")}
							>
								<Apple style={{ fontSize: 18, marginRight: 4 }} size={18} />
								App Store
							</Button>
							<Button
								style={{
									paddingLeft: 16,
									paddingRight: 16,
									paddingTop: 4,
									paddingBottom: 4,
								}}
								variant={store === "PLAY_STORE" ? "primary" : "secondary"}
								aria-pressed={store === "PLAY_STORE"}
								onPress={() => setStore("PLAY_STORE")}
							>
								<Store style={{ fontSize: 18, marginRight: 4 }} size={18} />
								Play Store
							</Button>
						</ButtonGroup>
						{/* 별점 필터 */}
						<div style={{ minWidth: 120 }}>
							<Select
								value={rating}
								onChange={(value) => setRating(Number(value))}
								className="w-full"
							>
								<Label>{"별점"}</Label>
								<Select.Trigger>
									<Select.Value />
									<Select.Indicator />
								</Select.Trigger>
								<Select.Popover>
									<ListBox>
										<ListBox.Item id={0} textValue={"전체"}>
											전체
										</ListBox.Item>
										{[5, 4, 3, 2, 1].map((r) => (
											<ListBox.Item key={r} id={r} textValue={String(r)}>
												<div className="flex items-center gap-1">
													{"★".repeat(r)}
													<span
														style={{ marginLeft: 4 }}
														className={"text-sm text-neutral-700"}
													>
														({r}점)
													</span>
												</div>
											</ListBox.Item>
										))}
									</ListBox>
								</Select.Popover>
							</Select>
						</div>
						{/* 날짜 범위 */}
						<TextField className="w-full">
							<Label>{"시작일"}</Label>
							<Input
								type="date"
								value={startDate}
								onChange={(e) => setStartDate(e.target.value)}
								style={{ width: 160 }}
								aria-label={"시작일"}
							/>
						</TextField>
						<p className={"text-sm text-neutral-700"}>~</p>
						<TextField className="w-full">
							<Label>{"종료일"}</Label>
							<Input
								type="date"
								value={endDate}
								onChange={(e) => setEndDate(e.target.value)}
								style={{ width: 160 }}
								aria-label={"종료일"}
							/>
						</TextField>
						{activeFilterCount > 0 && (
							<Button
								onClick={handleClearAllFilters}
								style={{ marginLeft: "auto" }}
								variant={"tertiary"}
								size={"sm"}
							>
								필터 초기화
							</Button>
						)}
					</div>
					{/* 활성 필터 Chip */}
					{activeFilterCount > 0 && (
						<div className="flex flex-wrap gap-1 mt-2">
							{store !== "ALL" && (
								<Chip size={"sm"} variant={"soft"}>
									{store === "APP_STORE" ? (
										<Apple size={18} />
									) : (
										<Store size={18} />
									)}
									<Chip.Label>{STORE_LABELS[store]}</Chip.Label>
									<Button
										variant="ghost"
										size="sm"
										isIconOnly
										aria-label="필터 제거"
										onPress={() => setStore("ALL")}
									>
										×
									</Button>
								</Chip>
							)}
							{rating > 0 && (
								<Chip size={"sm"} variant={"soft"}>
									{<Star style={{ color: RATING_COLORS[rating] }} size={18} />}
									<Chip.Label>{`${"★".repeat(rating)} (${rating}점)`}</Chip.Label>
									<Button
										variant="ghost"
										size="sm"
										isIconOnly
										aria-label="필터 제거"
										onPress={() => setRating(0)}
									>
										×
									</Button>
								</Chip>
							)}
							{startDate && (
								<Chip size={"sm"} variant={"soft"}>
									<Chip.Label>{`시작: ${startDate}`}</Chip.Label>
									<Button
										variant="ghost"
										size="sm"
										isIconOnly
										aria-label="필터 제거"
										onPress={() => setStartDate("")}
									>
										×
									</Button>
								</Chip>
							)}
							{endDate && (
								<Chip size={"sm"} variant={"soft"}>
									<Chip.Label>{`종료: ${endDate}`}</Chip.Label>
									<Button
										variant="ghost"
										size="sm"
										isIconOnly
										aria-label="필터 제거"
										onPress={() => setEndDate("")}
									>
										×
									</Button>
								</Chip>
							)}
						</div>
					)}
				</Card.Content>
			</Card>
			{/* 에러 */}
			{error && (
				<Alert style={{ marginBottom: 16 }} status={"danger"}>
					<Alert.Content>{error}</Alert.Content>
				</Alert>
			)}
			{/* 리뷰 카드 목록 */}
			{loading ? (
				<div className="space-y-3">
					{Array.from({ length: 5 }).map((_, i) => (
						<Skeleton
							key={i}
							style={{
								...{ borderRadius: 16 },
								...{ width: "100%", height: 120 },
							}}
							className="rounded-xl"
						/>
					))}
				</div>
			) : reviews.length === 0 ? (
				<Card>
					<Card.Content>
						<div className="text-center py-12">
							<h2 className={"text-lg font-semibold text-neutral-900"}>
								리뷰가 없습니다
							</h2>
							<p
								style={{ marginTop: 8 }}
								className={"text-sm text-neutral-700"}
							>
								필터 조건을 변경해보세요
							</p>
						</div>
					</Card.Content>
				</Card>
			) : (
				<div className="space-y-3">
					{reviews.map((review) => (
						<ReviewCard
							key={review.pk}
							review={review}
							toggling={togglingId === review.pk}
							onToggleFeatured={() => handleToggleFeatured(review)}
						/>
					))}
				</div>
			)}
			{/* 더 보기 버튼 */}
			{nextCursor && !loading && (
				<div className="flex justify-center pt-2 pb-4">
					<Button
						onClick={() => fetchReviews(true)}
						style={{
							paddingLeft: 32,
							paddingRight: 32,
							paddingTop: 8,
							paddingBottom: 8,
							borderRadius: 24,
							textTransform: "none",
						}}
						variant={"secondary"}
						isDisabled={loadingMore}
						size={"md"}
					>
						{loadingMore ? (
							<Spinner aria-label="불러오는 중" size="sm" />
						) : (
							<ChevronDown size={18} />
						)}
						{loadingMore ? "불러오는 중..." : "더 보기"}
					</Button>
				</div>
			)}
		</div>
	);
}
// ─── 리뷰 카드 컴포넌트 ─────────────────────────────────
function ReviewCard({
	review,
	toggling,
	onToggleFeatured,
}: {
	review: AppReviewItem;
	toggling: boolean;
	onToggleFeatured: () => void;
}) {
	const isAppStore = review.store === "APP_STORE";
	const storeColor = isAppStore ? "#007AFF" : "#34A853";
	return (
		<Card
			style={{
				borderLeft: `4px solid ${storeColor}`,
				opacity: toggling ? 0.7 : 1,
				transition: "all 0.15s ease",
			}}
		>
			<Card.Content style={{ padding: 20 }}>
				{/* 상단: 별점 + 스토어 배지 + 공개 토글 */}
				<div className="flex items-center justify-between mb-1.5">
					<div className="flex items-center gap-2">
						<span
							role="img"
							aria-label={"별점 " + review.rating + "점"}
							className="text-amber-500"
						>
							{"★".repeat(Math.round(review.rating ?? 0))}
							{"☆".repeat(5 - Math.round(review.rating ?? 0))}
						</span>
						{review.title && (
							<p className={"text-sm text-neutral-700"}>{review.title}</p>
						)}
					</div>
					<div className="flex items-center gap-2">
						<Chip
							style={{
								backgroundColor: isAppStore ? "#f0f4ff" : "#f0fdf4",
								color: storeColor,
								fontWeight: 500,
							}}
							size={"sm"}
							variant={"soft"}
						>
							{isAppStore ? <Apple size={18} /> : <Store size={18} />}
							<Chip.Label>{isAppStore ? "App Store" : "Play Store"}</Chip.Label>
						</Chip>
						<Tooltip>
							<Button
								onClick={onToggleFeatured}
								style={{
									minWidth: 90,
									fontWeight: 600,
									whiteSpace: "nowrap",
								}}
								variant={
									(review.isFeatured ? "contained" : "outlined") === "contained"
										? "primary"
										: (review.isFeatured ? "contained" : "outlined") ===
												"outlined"
											? "secondary"
											: "tertiary"
								}
								isDisabled={toggling}
								size={"sm"}
							>
								{toggling ? (
									<Spinner aria-label="불러오는 중" size="sm" />
								) : review.isFeatured ? (
									<Globe size={18} />
								) : (
									<GlobeLock size={18} />
								)}
								{review.isFeatured ? "공개 중" : "비공개"}
							</Button>
							<Tooltip.Content>
								{review.isFeatured ? "외부 공개 해제" : "외부 공개 처리"}
							</Tooltip.Content>
						</Tooltip>
					</div>
				</div>
				{/* 본문 */}
				{review.body && (
					<p
						style={{
							marginBottom: 12,
							lineHeight: 1.6,
							whiteSpace: "pre-wrap",
						}}
						className={"text-sm text-neutral-700"}
					>
						{review.body}
					</p>
				)}
				{/* 메타 정보 */}
				<div className="flex items-center gap-3 flex-wrap">
					<span className={"text-sm text-neutral-700"}>{review.author}</span>
					<span className={"text-sm text-neutral-700"}>|</span>
					<span className={"text-sm text-neutral-700"}>
						v{review.appVersion}
					</span>
					<span className={"text-sm text-neutral-700"}>|</span>
					<span className={"text-sm text-neutral-700"}>
						{safeToLocaleDateString(review.createdAt, "ko-KR", {
							year: "numeric",
							month: "short",
							day: "numeric",
						})}
					</span>
					{review.language && review.language !== "ko" && (
						<>
							<span className={"text-sm text-neutral-700"}>|</span>
							<Chip
								style={{ height: 20, fontSize: "0.65rem" }}
								size={"sm"}
								variant={"soft"}
							>
								<Chip.Label>{review.language.toUpperCase()}</Chip.Label>
							</Chip>
						</>
					)}
				</div>
				{/* 공개 닉네임 표시 */}
				{review.isFeatured && review.displayNickname && (
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
						<Globe style={{ fontSize: 14, color: "#22c55e" }} size={18} />
						<span className={"text-sm text-neutral-700"}>
							공개 닉네임: {review.displayNickname}
							{review.displayUniversity &&
								` · ${review.displayUniversity.name}`}
						</span>
					</div>
				)}
			</Card.Content>
		</Card>
	);
}
