"use client";
import {
	Button,
	Chip,
	Input,
	Label,
	ListBox,
	Modal,
	Pagination,
	Select,
	Skeleton,
	Spinner,
	TextArea,
	TextField,
	Tooltip,
} from "@heroui/react";
import {
	Check,
	CloudUpload,
	Pencil,
	Search,
	Trash2,
	WandSparkles,
	X,
} from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import AdminService from "@/app/services/admin";
import {
	KEYWORD_CATEGORIES,
	type KeywordItem,
	type KeywordCategory,
} from "@/app/services/admin/keywords";
import {
	ACCEPT_IMAGE_ATTR,
	MAX_IMAGE_MB,
	validateImageFile,
} from "@/app/admin/ai-profiles/_shared/image-upload-constants";
import { getAdminErrorMessage } from "@/shared/lib/http/admin-fetch";
import { useConfirm } from "@/shared/ui/admin/confirm-dialog";
import { useToast } from "@/shared/ui/admin/toast";
const CATEGORY_COLORS: Record<
	KeywordCategory,
	{
		color: string;
		bg: string;
	}
> = {
	HOBBY: { color: "#7c3aed", bg: "#f5f3ff" },
	FOOD: { color: "#ea580c", bg: "#fff7ed" },
	MUSIC: { color: "#db2777", bg: "#fdf2f8" },
	TRAVEL: { color: "#0891b2", bg: "#ecfeff" },
	SPORT: { color: "#059669", bg: "#ecfdf5" },
	CULTURE: { color: "#4f46e5", bg: "#eef2ff" },
	LIFESTYLE: { color: "#d97706", bg: "#fffbeb" },
	STUDY: { color: "#2563eb", bg: "#eff6ff" },
	OTHER: { color: "#6b7280", bg: "#f9fafb" },
};
type EditMode = null | {
	type: "name" | "icon" | "category";
	keyword: string;
};
function KeywordsContent() {
	const [items, setItems] = useState<KeywordItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [pagination, setPagination] = useState({
		page: 1,
		pageSize: 50,
		total: 0,
	});
	const [searchInput, setSearchInput] = useState("");
	const [searchTerm, setSearchTerm] = useState("");
	const [editMode, setEditMode] = useState<EditMode>(null);
	const [editValue, setEditValue] = useState("");
	const [editCategory, setEditCategory] = useState<KeywordCategory>("OTHER");
	const [saving, setSaving] = useState(false);
	const confirm = useConfirm();
	const toast = useToast();
	const editInputRef = useRef<HTMLInputElement>(null);
	const [generatingIcon, setGeneratingIcon] = useState<string | undefined>();
	const [isUploading, setIsUploading] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	// 프롬프트 다이얼로그 상태
	const [promptDialog, setPromptDialog] = useState<{
		open: boolean;
		item: KeywordItem | null;
	}>({
		open: false,
		item: null,
	});
	const [promptValue, setPromptValue] = useState("");
	const [promptSubmitting, setPromptSubmitting] = useState(false);
	const fetchKeywords = useCallback(
		async (page: number = 1) => {
			try {
				setLoading(true);
				setError(null);
				const params: {
					page: number;
					pageSize: number;
					search?: string;
				} = {
					page,
					pageSize: 50,
				};
				if (searchTerm) params.search = searchTerm;
				const data = await AdminService.keywords.getAll(params);
				setItems(data?.items ?? []);
				setPagination({
					page: data?.page ?? 1,
					pageSize: data?.pageSize ?? 50,
					total: data?.total ?? 0,
				});
			} catch (err: any) {
				setError(
					err.response?.data?.message || "키워드 목록을 불러올 수 없습니다.",
				);
			} finally {
				setLoading(false);
			}
		},
		[searchTerm],
	);
	useEffect(() => {
		fetchKeywords();
	}, [fetchKeywords]);
	// debounce 검색
	useEffect(() => {
		const timer = setTimeout(() => {
			setSearchTerm(searchInput);
		}, 300);
		return () => clearTimeout(timer);
	}, [searchInput]);
	// 편집 시작
	const startEdit = (type: "name" | "icon", item: KeywordItem) => {
		setEditMode({ type, keyword: item.normalizedKeyword });
		setEditValue(type === "name" ? item.keyword : item.iconUrl || "");
		setTimeout(() => editInputRef.current?.focus(), 50);
	};
	const startCategoryEdit = (item: KeywordItem) => {
		setEditMode({ type: "category", keyword: item.normalizedKeyword });
		setEditCategory(item.category);
	};
	const cancelEdit = () => {
		setEditMode(null);
		setEditValue("");
	};
	// 저장
	const handleSave = async () => {
		if (!editMode || saving) return;
		try {
			setSaving(true);
			if (editMode.type === "name") {
				const trimmed = editValue.trim();
				if (!trimmed) return;
				const result = await AdminService.keywords.updateName(
					editMode.keyword,
					trimmed,
				);
				toast.success(`키워드 이름 변경 완료 (${result.updatedCount}명 반영)`);
				cancelEdit();
				fetchKeywords(pagination.page);
			} else if (editMode.type === "icon") {
				await AdminService.keywords.updateIcon(
					editMode.keyword,
					editValue.trim(),
				);
				toast.success("아이콘 URL 변경 완료");
				cancelEdit();
				fetchKeywords(pagination.page);
			} else if (editMode.type === "category") {
				// Optimistic update
				const targetKeyword = editMode.keyword;
				const newCategory = editCategory;
				setItems((prev) =>
					prev.map((item) =>
						item.normalizedKeyword === targetKeyword
							? { ...item, category: newCategory }
							: item,
					),
				);
				cancelEdit();
				// 백그라운드 API 호출
				AdminService.keywords.updateCategory(targetKeyword, newCategory).then(
					(result) => {
						toast.success(`카테고리 변경 완료 (${result.updatedCount}명 반영)`);
					},
					(err: any) => {
						toast.error(
							err.response?.data?.message || "카테고리 변경에 실패했습니다.",
						);
						fetchKeywords(pagination.page); // 실패 시 서버 데이터로 롤백
					},
				);
				return; // setSaving(false) 즉시 실행되도록 finally 이전에 return
			}
		} catch (err: any) {
			toast.error(err.response?.data?.message || "저장에 실패했습니다.");
		} finally {
			setSaving(false);
		}
	};
	const handleIconFileUpload = async (
		normalizedKeyword: string,
		file: File,
	) => {
		const validationError = validateImageFile(file);
		if (validationError) {
			toast.error(
				validationError.kind === "mime"
					? "지원하지 않는 파일 형식입니다 (JPG, PNG, WebP만 가능)"
					: `파일이 너무 큽니다 (최대 ${MAX_IMAGE_MB}MB)`,
			);
			return;
		}
		try {
			setIsUploading(true);
			const result = await AdminService.keywords.uploadIcon(
				normalizedKeyword,
				file,
			);
			setItems((prev) =>
				prev.map((item) =>
					item.normalizedKeyword === normalizedKeyword
						? { ...item, iconUrl: result.iconUrl }
						: item,
				),
			);
			toast.success("아이콘이 업로드되었습니다.");
			cancelEdit();
		} catch (err: any) {
			toast.error(getAdminErrorMessage(err, "업로드에 실패했습니다."));
		} finally {
			setIsUploading(false);
		}
	};
	// 삭제
	const handleDelete = async (item: KeywordItem) => {
		const ok = await confirm({
			message: `"${item.keyword}" 키워드를 삭제하시겠습니까?\n해당 키워드를 가진 ${item.userCount}명의 유저에게서도 제거됩니다.`,
			severity: "error",
			confirmText: "삭제",
		});
		if (!ok) return;
		try {
			const result = await AdminService.keywords.delete(item.keyword);
			toast.success(`키워드 삭제 완료 (${result.deletedCount}명에서 제거)`);
			fetchKeywords(pagination.page);
		} catch (err: any) {
			toast.error(err.response?.data?.message || "삭제에 실패했습니다.");
		}
	};
	// 기본 아이콘 생성 (프롬프트 없음)
	const handleGenerateIcon = async (item: KeywordItem) => {
		if (generatingIcon) return;
		setGeneratingIcon(item.normalizedKeyword);
		try {
			await AdminService.keywords.generateIcon(item.keyword);
			toast.success(
				`"${item.keyword}" 아이콘 생성이 요청되었습니다. 잠시 후 반영됩니다.`,
			);
		} catch (err: any) {
			toast.error(err.message || "아이콘 생성에 실패했습니다.");
		} finally {
			setGeneratingIcon(undefined);
		}
	};
	// 프롬프트 다이얼로그 열기
	const openPromptDialog = (item: KeywordItem) => {
		setPromptDialog({ open: true, item });
		setPromptValue("");
	};
	// 프롬프트로 아이콘 생성
	const handleGenerateWithPrompt = async () => {
		if (!promptDialog.item || promptSubmitting) return;
		const trimmed = promptValue.trim();
		if (!trimmed) {
			toast.error("프롬프트를 입력해주세요.");
			return;
		}
		setPromptSubmitting(true);
		try {
			await AdminService.keywords.generateIconWithPrompt(
				promptDialog.item.keyword,
				trimmed,
			);
			toast.success(
				`"${promptDialog.item.keyword}" 아이콘이 커스텀 프롬프트로 생성 요청되었습니다.`,
			);
			setPromptDialog({ open: false, item: null });
		} catch (err: any) {
			toast.error(err.message || "아이콘 생성에 실패했습니다.");
		} finally {
			setPromptSubmitting(false);
		}
	};
	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") handleSave();
		if (e.key === "Escape") cancelEdit();
	};
	return (
		<div style={{ padding: 24 }}>
			<h1
				style={{ marginBottom: 16, fontWeight: 700 }}
				className={"text-lg font-semibold text-neutral-900"}
			>
				매칭 키워드 관리
			</h1>
			<div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
				<div
					style={{
						flex: 1,
						backgroundColor: "#f0f7ff",
						padding: 12,
						borderRadius: 16,
						textAlign: "center",
					}}
				>
					{loading ? (
						<Skeleton
							style={{
								...{ marginLeft: "auto", marginRight: "auto" },
								...{ width: 40, height: 36 },
							}}
							className="rounded-xl"
						/>
					) : (
						<p
							style={{ fontSize: 24, fontWeight: 700, color: "#2563eb" }}
							className={"text-sm text-neutral-700"}
						>
							{pagination.total}
						</p>
					)}
					<p
						style={{ fontSize: 11, color: "#6b7280" }}
						className={"text-sm text-neutral-700"}
					>
						전체 키워드
					</p>
				</div>
			</div>
			<TextField className="w-full" aria-label={"키워드 검색..."}>
				{
					<span>
						<Search style={{ fontSize: 18, color: "#9ca3af" }} size={18} />
					</span>
				}
				<Input
					placeholder="키워드 검색..."
					value={searchInput}
					onChange={(e) => setSearchInput(e.target.value)}
					style={{ marginBottom: 16, width: 320 }}
					aria-label={"키워드 검색..."}
				/>
			</TextField>
			{error && (
				<p style={{ marginBottom: 16 }} className={"text-sm text-neutral-700"}>
					{error}
				</p>
			)}
			<div className={"overflow-x-auto"}>
				<table
					className={
						"w-full text-sm text-left [&_td]:p-3 [&_thead]:bg-neutral-50 [&_tr]:border-b"
					}
				>
					<thead>
						<tr style={{ backgroundColor: "#f9fafb" }}>
							<th style={{ fontWeight: 600, width: 60 }} scope="col">
								아이콘
							</th>
							<th style={{ fontWeight: 600 }} scope="col">
								키워드
							</th>
							<th style={{ fontWeight: 600, width: 120 }} scope="col">
								카테고리
							</th>
							<th
								style={{ fontWeight: 600, width: 80, textAlign: "right" }}
								scope="col"
							>
								유저 수
							</th>
							<th style={{ fontWeight: 600, width: 140 }} scope="col">
								생성일
							</th>
							<th
								style={{ fontWeight: 600, width: 100, textAlign: "center" }}
								scope="col"
							>
								액션
							</th>
						</tr>
					</thead>
					<tbody>
						{loading ? (
							[1, 2, 3, 4, 5].map((i) => (
								<tr key={i}>
									{[1, 2, 3, 4, 5, 6].map((j) => (
										<td key={j}>
											<Skeleton
												style={{ width: "100%", height: 24 }}
												className="rounded-xl"
											/>
										</td>
									))}
								</tr>
							))
						) : items.length === 0 ? (
							<tr>
								<td
									colSpan={6}
									style={{
										textAlign: "center",
										paddingTop: 32,
										paddingBottom: 32,
									}}
								>
									<p
										style={{ fontSize: 13 }}
										className={"text-sm text-neutral-700"}
									>
										{searchTerm
											? "검색 결과가 없습니다"
											: "등록된 키워드가 없습니다"}
									</p>
								</td>
							</tr>
						) : (
							items.map((item) => {
								const isEditingName =
									editMode?.type === "name" &&
									editMode.keyword === item.normalizedKeyword;
								const isEditingIcon =
									editMode?.type === "icon" &&
									editMode.keyword === item.normalizedKeyword;
								const isEditingCategory =
									editMode?.type === "category" &&
									editMode.keyword === item.normalizedKeyword;
								const catColor =
									CATEGORY_COLORS[item.category] || CATEGORY_COLORS.OTHER;
								return (
									<tr key={item.normalizedKeyword}>
										<td>
											{isEditingIcon ? (
												<div
													style={{
														display: "flex",
														alignItems: "center",
														gap: 4,
													}}
												>
													<TextField className="w-full" aria-label={"URL"}>
														<Input
															ref={editInputRef}
															value={editValue}
															onChange={(e) => setEditValue(e.target.value)}
															onKeyDown={handleKeyDown}
															placeholder="URL"
															style={{ width: 120 }}
															aria-label={"URL"}
														/>
													</TextField>
													<Button
														onClick={handleSave}
														variant={"tertiary"}
														isDisabled={saving}
														isIconOnly={true}
														aria-label="저장"
														size={"sm"}
													>
														<Check
															style={{ fontSize: 16, color: "#16a34a" }}
															size={18}
														/>
													</Button>
													<Button
														onClick={cancelEdit}
														variant={"tertiary"}
														isIconOnly={true}
														aria-label="수정 취소"
														size={"sm"}
													>
														<X style={{ fontSize: 16 }} size={18} />
													</Button>
													<input
														type="file"
														accept={ACCEPT_IMAGE_ATTR}
														style={{ display: "none" }}
														ref={fileInputRef}
														onChange={(e) => {
															const file = e.target.files?.[0];
															if (!file || !editMode) return;
															handleIconFileUpload(editMode.keyword, file);
															e.currentTarget.value = "";
														}}
													/>
													<Tooltip>
														<Button
															onClick={() => fileInputRef.current?.click()}
															style={{ padding: 2 }}
															variant={"tertiary"}
															isDisabled={isUploading}
															isIconOnly={true}
															aria-label="아이콘 업로드"
															size={"sm"}
														>
															{isUploading ? (
																<Spinner aria-label="불러오는 중" size="sm" />
															) : (
																<CloudUpload
																	style={{ fontSize: 16, color: "#2563eb" }}
																	size={18}
																/>
															)}
														</Button>
														<Tooltip.Content>
															{"파일에서 업로드"}
														</Tooltip.Content>
													</Tooltip>
												</div>
											) : (
												<div
													style={{
														display: "flex",
														alignItems: "center",
														gap: 4,
													}}
												>
													<Button
														variant="ghost"
														className="h-auto justify-start text-left"
														style={{
															display: "flex",
															alignItems: "center",
															gap: 4,
															cursor: "pointer",
														}}
														onClick={() => startEdit("icon", item)}
														aria-label={`${item.keyword} 아이콘 수정`}
													>
														{item.iconUrl ? (
															<img
																src={item.iconUrl}
																style={{
																	width: 24,
																	height: 24,
																	borderRadius: 8,
																	objectFit: "cover",
																}}
															></img>
														) : (
															<div
																style={{
																	width: 24,
																	height: 24,
																	borderRadius: 8,
																	backgroundColor: "#e5e7eb",
																	display: "flex",
																	alignItems: "center",
																	justifyContent: "center",
																	fontSize: 10,
																	color: "#9ca3af",
																}}
															>
																-
															</div>
														)}
														<Pencil
															className="edit-hint"
															style={{
																fontSize: 12,
																color: "#9ca3af",
																opacity: 0.4,
																transition: "opacity 0.15s",
															}}
															size={18}
														/>
													</Button>
													<Tooltip>
														<Button
															onClick={(e) => {
																e.stopPropagation();
																if (item.iconUrl) {
																	openPromptDialog(item);
																} else {
																	handleGenerateIcon(item);
																}
															}}
															style={{ padding: 2 }}
															variant={"tertiary"}
															isDisabled={
																generatingIcon === item.normalizedKeyword
															}
															isIconOnly={true}
															aria-label="AI 아이콘 생성"
															size={"sm"}
														>
															{generatingIcon === item.normalizedKeyword ? (
																<Spinner aria-label="불러오는 중" size="sm" />
															) : (
																<WandSparkles
																	style={{
																		fontSize: 14,
																		color: item.iconUrl ? "#9ca3af" : "#8b5cf6",
																	}}
																	size={18}
																/>
															)}
														</Button>
														<Tooltip.Content>
															{item.iconUrl
																? "AI 아이콘 재생성 (프롬프트)"
																: "AI 아이콘 생성"}
														</Tooltip.Content>
													</Tooltip>
												</div>
											)}
										</td>
										<td>
											{isEditingName ? (
												<div
													style={{
														display: "flex",
														alignItems: "center",
														gap: 4,
													}}
												>
													<TextField className="w-full" aria-label={"입력"}>
														<Input
															ref={editInputRef}
															value={editValue}
															onChange={(e) => setEditValue(e.target.value)}
															onKeyDown={handleKeyDown}
															style={{ width: 200 }}
															aria-label={"입력"}
														/>
													</TextField>
													<Button
														onClick={handleSave}
														variant={"tertiary"}
														isDisabled={saving}
														isIconOnly={true}
														aria-label="저장"
														size={"sm"}
													>
														<Check
															style={{ fontSize: 16, color: "#16a34a" }}
															size={18}
														/>
													</Button>
													<Button
														onClick={cancelEdit}
														variant={"tertiary"}
														isIconOnly={true}
														aria-label="수정 취소"
														size={"sm"}
													>
														<X style={{ fontSize: 16 }} size={18} />
													</Button>
												</div>
											) : (
												<Button
													variant="ghost"
													className="h-auto justify-start text-left"
													style={{
														display: "flex",
														alignItems: "center",
														gap: 4,
														cursor: "pointer",
													}}
													onClick={() => startEdit("name", item)}
												>
													<p
														style={{ fontWeight: 500, fontSize: 13 }}
														className={"text-sm text-neutral-700"}
													>
														{item.keyword}
													</p>
													<Pencil
														className="edit-hint"
														style={{
															fontSize: 12,
															color: "#9ca3af",
															opacity: 0.4,
															transition: "opacity 0.15s",
														}}
														size={18}
													/>
												</Button>
											)}
										</td>
										<td>
											{isEditingCategory ? (
												<div
													style={{
														display: "flex",
														alignItems: "center",
														gap: 4,
													}}
												>
													<Select
														value={editCategory}
														onChange={(value) =>
															setEditCategory(value as KeywordCategory)
														}
														className="w-full"
													>
														<Label className="sr-only">키워드 카테고리</Label>
														<Select.Trigger>
															<Select.Value />
															<Select.Indicator />
														</Select.Trigger>
														<Select.Popover>
															<ListBox>
																{Object.entries(KEYWORD_CATEGORIES).map(
																	([key, label]) => (
																		<ListBox.Item
																			key={key}
																			id={key}
																			textValue={label}
																		>
																			{label}
																		</ListBox.Item>
																	),
																)}
															</ListBox>
														</Select.Popover>
													</Select>
													<Button
														onClick={handleSave}
														variant={"tertiary"}
														isDisabled={saving}
														isIconOnly={true}
														aria-label="저장"
														size={"sm"}
													>
														<Check
															style={{ fontSize: 16, color: "#16a34a" }}
															size={18}
														/>
													</Button>
													<Button
														onClick={cancelEdit}
														variant={"tertiary"}
														isIconOnly={true}
														aria-label="수정 취소"
														size={"sm"}
													>
														<X style={{ fontSize: 16 }} size={18} />
													</Button>
												</div>
											) : (
												<Button
													variant="ghost"
													className="h-auto justify-start text-left"
													onClick={() => startCategoryEdit(item)}
													style={{
														backgroundColor: catColor.bg,
														color: catColor.color,
														fontWeight: 600,
														fontSize: 10,
														height: 22,
														cursor: "pointer",
													}}
													size="sm"
												>
													<span>
														{KEYWORD_CATEGORIES[item.category] || item.category}
													</span>
												</Button>
											)}
										</td>
										<td
											style={{
												textAlign: "right",
												fontSize: 13,
												fontWeight: 500,
											}}
										>
											{item.userCount.toLocaleString()}
										</td>
										<td style={{ fontSize: 12, color: "#666" }}>
											{new Date(item.firstCreatedAt).toLocaleDateString(
												"ko-KR",
												{
													year: "numeric",
													month: "numeric",
													day: "numeric",
												},
											)}
										</td>
										<td style={{ textAlign: "center" }}>
											<div
												style={{
													display: "flex",
													gap: 2,
													justifyContent: "center",
												}}
											>
												<Tooltip>
													<Button
														onClick={() => openPromptDialog(item)}
														style={{ color: "#8b5cf6" }}
														variant={"tertiary"}
														isIconOnly={true}
														aria-label="AI 아이콘 생성"
														size={"sm"}
													>
														<WandSparkles style={{ fontSize: 16 }} size={18} />
													</Button>
													<Tooltip.Content>
														{"프롬프트로 아이콘 생성"}
													</Tooltip.Content>
												</Tooltip>
												<Button
													onClick={() => handleDelete(item)}
													style={{ color: "#ef4444" }}
													variant={"tertiary"}
													isIconOnly={true}
													aria-label="키워드 삭제"
													size={"sm"}
												>
													<Trash2 style={{ fontSize: 16 }} size={18} />
												</Button>
											</div>
										</td>
									</tr>
								);
							})
						)}
					</tbody>
				</table>
			</div>
			{!loading && items.length > 0 && (
				<Pagination aria-label="페이지 이동">
					<Pagination.Summary>
						{pagination.page - 1 + 1} /{" "}
						{Math.max(1, Math.ceil(pagination.total / pagination.pageSize))}
					</Pagination.Summary>
					<Pagination.Content>
						<Pagination.Item>
							<Pagination.Previous
								isDisabled={pagination.page - 1 <= 0}
								onPress={() => fetchKeywords(pagination.page - 1)}
							>
								이전
							</Pagination.Previous>
						</Pagination.Item>
						<Pagination.Item>
							<Pagination.Next
								isDisabled={
									pagination.page - 1 + 1 >=
									Math.ceil(pagination.total / pagination.pageSize)
								}
								onPress={() => fetchKeywords(pagination.page + 1)}
							>
								다음
							</Pagination.Next>
						</Pagination.Item>
					</Pagination.Content>
					<span className="text-sm text-neutral-500">
						페이지당 {pagination.pageSize}개
					</span>
				</Pagination>
			)}
			{/* 프롬프트 아이콘 생성 다이얼로그 */}
			<Modal.Backdrop
				isOpen={promptDialog.open}
				onOpenChange={(isOpen) => {
					if (!isOpen)
						(() =>
							!promptSubmitting &&
							setPromptDialog({ open: false, item: null }))?.();
				}}
				isDismissable={!promptSubmitting}
			>
				<Modal.Container size="md" scroll="inside">
					<Modal.Dialog>
						<Modal.Header style={{ fontWeight: 700 }}>
							<Modal.Heading>
								AI 아이콘 생성 - &quot;{promptDialog.item?.keyword}&quot;
							</Modal.Heading>
						</Modal.Header>
						<Modal.Body>
							<p
								style={{ marginBottom: 16 }}
								className={"text-sm text-neutral-700"}
							>
								아이콘 생성에 사용할 이미지 프롬프트를 입력하세요.
								{promptDialog.item?.iconUrl && (
									<> 기존 아이콘이 새로 생성된 아이콘으로 교체됩니다.</>
								)}
							</p>
							{promptDialog.item?.iconUrl && (
								<div
									style={{
										marginBottom: 16,
										display: "flex",
										alignItems: "center",
										gap: 8,
									}}
								>
									<span className={"text-sm text-neutral-700"}>
										현재 아이콘:
									</span>
									<img
										src={promptDialog.item.iconUrl}
										style={{
											width: 32,
											height: 32,
											borderRadius: 8,
											objectFit: "cover",
										}}
									></img>
								</div>
							)}
							<TextField
								className="w-full"
								aria-label={
									"예: A flat colorful fishing icon with a fishing rod and fish. Clean, simple, emoji style."
								}
							>
								<TextArea
									autoFocus
									rows={3}
									value={promptValue}
									onChange={(e) => setPromptValue(e.target.value)}
									placeholder="예: A flat colorful fishing icon with a fishing rod and fish. Clean, simple, emoji style."
									onKeyDown={(e) => {
										if (e.key === "Enter" && !e.shiftKey) {
											e.preventDefault();
											handleGenerateWithPrompt();
										}
									}}
									style={{}}
									aria-label={
										"예: A flat colorful fishing icon with a fishing rod and fish. Clean, simple, emoji style."
									}
								/>
							</TextField>
						</Modal.Body>
						<Modal.Footer>
							<Button
								onClick={() => setPromptDialog({ open: false, item: null })}
								variant={"tertiary"}
								isDisabled={promptSubmitting}
								size={"md"}
							>
								취소
							</Button>
							<Button
								onClick={handleGenerateWithPrompt}
								variant={"primary"}
								isDisabled={promptSubmitting || !promptValue.trim()}
								size={"md"}
							>
								{promptSubmitting ? (
									<Spinner aria-label="불러오는 중" size="sm" />
								) : (
									<WandSparkles size={18} />
								)}
								{promptSubmitting ? "요청 중..." : "생성 요청"}
							</Button>
						</Modal.Footer>
					</Modal.Dialog>
				</Modal.Container>
			</Modal.Backdrop>
		</div>
	);
}
export default function KeywordsV2() {
	return <KeywordsContent />;
}
