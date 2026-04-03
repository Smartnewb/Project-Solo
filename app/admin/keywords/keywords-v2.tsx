'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
	Box,
	Typography,
	TextField,
	InputAdornment,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Paper,
	Skeleton,
	TablePagination,
	IconButton,
	Select,
	MenuItem,
	Chip,
	Button,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import AdminService from '@/app/services/admin';
import {
	KEYWORD_CATEGORIES,
	type KeywordItem,
	type KeywordCategory,
} from '@/app/services/admin/keywords';
import { useConfirm } from '@/shared/ui/admin/confirm-dialog';
import { useToast } from '@/shared/ui/admin/toast';

const CATEGORY_COLORS: Record<KeywordCategory, { color: string; bg: string }> = {
	HOBBY: { color: '#7c3aed', bg: '#f5f3ff' },
	FOOD: { color: '#ea580c', bg: '#fff7ed' },
	MUSIC: { color: '#db2777', bg: '#fdf2f8' },
	TRAVEL: { color: '#0891b2', bg: '#ecfeff' },
	SPORT: { color: '#059669', bg: '#ecfdf5' },
	CULTURE: { color: '#4f46e5', bg: '#eef2ff' },
	LIFESTYLE: { color: '#d97706', bg: '#fffbeb' },
	STUDY: { color: '#2563eb', bg: '#eff6ff' },
	OTHER: { color: '#6b7280', bg: '#f9fafb' },
};

type EditMode = null | { type: 'name' | 'icon' | 'category'; keyword: string };

function KeywordsContent() {
	const [items, setItems] = useState<KeywordItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [pagination, setPagination] = useState({ page: 1, pageSize: 50, total: 0 });
	const [searchInput, setSearchInput] = useState('');
	const [searchTerm, setSearchTerm] = useState('');

	const [editMode, setEditMode] = useState<EditMode>(null);
	const [editValue, setEditValue] = useState('');
	const [editCategory, setEditCategory] = useState<KeywordCategory>('OTHER');
	const [saving, setSaving] = useState(false);

	const confirm = useConfirm();
	const toast = useToast();
	const editInputRef = useRef<HTMLInputElement>(null);
	const [generatingIcon, setGeneratingIcon] = useState<string | undefined>();

	// 프롬프트 다이얼로그 상태
	const [promptDialog, setPromptDialog] = useState<{ open: boolean; item: KeywordItem | null }>({
		open: false,
		item: null,
	});
	const [promptValue, setPromptValue] = useState('');
	const [promptSubmitting, setPromptSubmitting] = useState(false);

	const fetchKeywords = useCallback(
		async (page: number = 1) => {
			try {
				setLoading(true);
				setError(null);
				const params: { page: number; pageSize: number; search?: string } = {
					page,
					pageSize: 50,
				};
				if (searchTerm) params.search = searchTerm;
				const data = await AdminService.keywords.getAll(params);
				setItems(data?.items ?? []);
				setPagination({ page: data?.page ?? 1, pageSize: data?.pageSize ?? 50, total: data?.total ?? 0 });
			} catch (err: any) {
				setError(err.response?.data?.message || '키워드 목록을 불러올 수 없습니다.');
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
	const startEdit = (type: 'name' | 'icon', item: KeywordItem) => {
		setEditMode({ type, keyword: item.normalizedKeyword });
		setEditValue(type === 'name' ? item.keyword : item.iconUrl || '');
		setTimeout(() => editInputRef.current?.focus(), 50);
	};

	const startCategoryEdit = (item: KeywordItem) => {
		setEditMode({ type: 'category', keyword: item.normalizedKeyword });
		setEditCategory(item.category);
	};

	const cancelEdit = () => {
		setEditMode(null);
		setEditValue('');
	};

	// 저장
	const handleSave = async () => {
		if (!editMode || saving) return;
		try {
			setSaving(true);
			if (editMode.type === 'name') {
				const trimmed = editValue.trim();
				if (!trimmed) return;
				const result = await AdminService.keywords.updateName(editMode.keyword, trimmed);
				toast.success(`키워드 이름 변경 완료 (${result.updatedCount}명 반영)`);
				cancelEdit();
				fetchKeywords(pagination.page);
			} else if (editMode.type === 'icon') {
				await AdminService.keywords.updateIcon(editMode.keyword, editValue.trim());
				toast.success('아이콘 URL 변경 완료');
				cancelEdit();
				fetchKeywords(pagination.page);
			} else if (editMode.type === 'category') {
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
						toast.error(err.response?.data?.message || '카테고리 변경에 실패했습니다.');
						fetchKeywords(pagination.page); // 실패 시 서버 데이터로 롤백
					},
				);
				return; // setSaving(false) 즉시 실행되도록 finally 이전에 return
			}
		} catch (err: any) {
			toast.error(err.response?.data?.message || '저장에 실패했습니다.');
		} finally {
			setSaving(false);
		}
	};

	// 삭제
	const handleDelete = async (item: KeywordItem) => {
		const ok = await confirm({
			message: `"${item.keyword}" 키워드를 삭제하시겠습니까?\n해당 키워드를 가진 ${item.userCount}명의 유저에게서도 제거됩니다.`,
			severity: 'error',
			confirmText: '삭제',
		});
		if (!ok) return;
		try {
			const result = await AdminService.keywords.delete(item.keyword);
			toast.success(`키워드 삭제 완료 (${result.deletedCount}명에서 제거)`);
			fetchKeywords(pagination.page);
		} catch (err: any) {
			toast.error(err.response?.data?.message || '삭제에 실패했습니다.');
		}
	};

	// 기본 아이콘 생성 (프롬프트 없음)
	const handleGenerateIcon = async (item: KeywordItem) => {
		if (generatingIcon) return;
		setGeneratingIcon(item.normalizedKeyword);
		try {
			await AdminService.keywords.generateIcon(item.keyword);
			toast.success(`"${item.keyword}" 아이콘 생성이 요청되었습니다. 잠시 후 반영됩니다.`);
		} catch (err: any) {
			toast.error(err.message || '아이콘 생성에 실패했습니다.');
		} finally {
			setGeneratingIcon(undefined);
		}
	};

	// 프롬프트 다이얼로그 열기
	const openPromptDialog = (item: KeywordItem) => {
		setPromptDialog({ open: true, item });
		setPromptValue('');
	};

	// 프롬프트로 아이콘 생성
	const handleGenerateWithPrompt = async () => {
		if (!promptDialog.item || promptSubmitting) return;
		const trimmed = promptValue.trim();
		if (!trimmed) {
			toast.error('프롬프트를 입력해주세요.');
			return;
		}
		setPromptSubmitting(true);
		try {
			await AdminService.keywords.generateIconWithPrompt(promptDialog.item.keyword, trimmed);
			toast.success(`"${promptDialog.item.keyword}" 아이콘이 커스텀 프롬프트로 생성 요청되었습니다.`);
			setPromptDialog({ open: false, item: null });
		} catch (err: any) {
			toast.error(err.message || '아이콘 생성에 실패했습니다.');
		} finally {
			setPromptSubmitting(false);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') handleSave();
		if (e.key === 'Escape') cancelEdit();
	};

	return (
		<Box sx={{ p: 3 }}>
			<Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
				매칭 키워드 관리
			</Typography>

			<Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
				<Box
					sx={{
						flex: 1,
						bgcolor: '#f0f7ff',
						p: 1.5,
						borderRadius: 2,
						textAlign: 'center',
					}}
				>
					{loading ? (
						<Skeleton variant="text" width={40} height={36} sx={{ mx: 'auto' }} />
					) : (
						<Typography sx={{ fontSize: 24, fontWeight: 700, color: '#2563eb' }}>
							{pagination.total}
						</Typography>
					)}
					<Typography sx={{ fontSize: 11, color: '#6b7280' }}>전체 키워드</Typography>
				</Box>
			</Box>

			<TextField
				size="small"
				placeholder="키워드 검색..."
				value={searchInput}
				onChange={(e) => setSearchInput(e.target.value)}
				InputProps={{
					startAdornment: (
						<InputAdornment position="start">
							<SearchIcon sx={{ fontSize: 18, color: '#9ca3af' }} />
						</InputAdornment>
					),
				}}
				sx={{ mb: 2, width: 320 }}
			/>

			{error && (
				<Typography color="error" sx={{ mb: 2 }}>
					{error}
				</Typography>
			)}

			<TableContainer component={Paper} variant="outlined">
				<Table size="small">
					<TableHead>
						<TableRow sx={{ bgcolor: '#f9fafb' }}>
							<TableCell sx={{ fontWeight: 600, width: 60 }}>아이콘</TableCell>
							<TableCell sx={{ fontWeight: 600 }}>키워드</TableCell>
							<TableCell sx={{ fontWeight: 600, width: 120 }}>카테고리</TableCell>
							<TableCell sx={{ fontWeight: 600, width: 80, textAlign: 'right' }}>
								유저 수
							</TableCell>
							<TableCell sx={{ fontWeight: 600, width: 140 }}>생성일</TableCell>
							<TableCell sx={{ fontWeight: 600, width: 100, textAlign: 'center' }}>
								액션
							</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{loading
							? [1, 2, 3, 4, 5].map((i) => (
									<TableRow key={i}>
										{[1, 2, 3, 4, 5, 6].map((j) => (
											<TableCell key={j}>
												<Skeleton variant="text" />
											</TableCell>
										))}
									</TableRow>
								))
							: items.length === 0
								? (
										<TableRow>
											<TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
												<Typography color="text.secondary" sx={{ fontSize: 13 }}>
													{searchTerm
														? '검색 결과가 없습니다'
														: '등록된 키워드가 없습니다'}
												</Typography>
											</TableCell>
										</TableRow>
									)
								: items.map((item) => {
										const isEditingName =
											editMode?.type === 'name' &&
											editMode.keyword === item.normalizedKeyword;
										const isEditingIcon =
											editMode?.type === 'icon' &&
											editMode.keyword === item.normalizedKeyword;
										const isEditingCategory =
											editMode?.type === 'category' &&
											editMode.keyword === item.normalizedKeyword;
										const catColor =
											CATEGORY_COLORS[item.category] || CATEGORY_COLORS.OTHER;

										return (
											<TableRow key={item.normalizedKeyword} hover>
												<TableCell>
													{isEditingIcon ? (
														<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
															<TextField
																size="small"
																value={editValue}
																onChange={(e) => setEditValue(e.target.value)}
																onKeyDown={handleKeyDown}
																inputRef={editInputRef}
																placeholder="URL"
																sx={{ width: 120, '& input': { fontSize: 11, py: 0.5 } }}
															/>
															<IconButton size="small" onClick={handleSave} disabled={saving}>
																<CheckIcon sx={{ fontSize: 16, color: '#16a34a' }} />
															</IconButton>
															<IconButton size="small" onClick={cancelEdit}>
																<CloseIcon sx={{ fontSize: 16 }} />
															</IconButton>
														</Box>
													) : (
														<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
															<Box
																sx={{
																	display: 'flex',
																	alignItems: 'center',
																	gap: 0.5,
																	cursor: 'pointer',
																	'&:hover .edit-hint': { opacity: 1 },
																}}
																onClick={() => startEdit('icon', item)}
															>
																{item.iconUrl ? (
																	<Box
																		component="img"
																		src={item.iconUrl}
																		sx={{
																			width: 24,
																			height: 24,
																			borderRadius: 1,
																			objectFit: 'cover',
																		}}
																	/>
																) : (
																	<Box
																		sx={{
																			width: 24,
																			height: 24,
																			borderRadius: 1,
																			bgcolor: '#e5e7eb',
																			display: 'flex',
																			alignItems: 'center',
																			justifyContent: 'center',
																			fontSize: 10,
																			color: '#9ca3af',
																		}}
																	>
																		-
																	</Box>
																)}
																<EditIcon
																	className="edit-hint"
																	sx={{ fontSize: 12, color: '#9ca3af', opacity: 0, transition: 'opacity 0.15s' }}
																/>
															</Box>
															<Tooltip title={item.iconUrl ? 'AI 아이콘 재생성 (프롬프트)' : 'AI 아이콘 생성'} arrow>
																<IconButton
																	size="small"
																	onClick={(e) => {
																		e.stopPropagation();
																		item.iconUrl
																			? openPromptDialog(item)
																			: handleGenerateIcon(item);
																	}}
																	disabled={generatingIcon === item.normalizedKeyword}
																	sx={{ p: 0.25 }}
																>
																	{generatingIcon === item.normalizedKeyword ? (
																		<CircularProgress size={14} />
																	) : (
																		<AutoFixHighIcon sx={{ fontSize: 14, color: item.iconUrl ? '#9ca3af' : '#8b5cf6' }} />
																	)}
																</IconButton>
															</Tooltip>
														</Box>
													)}
												</TableCell>

												<TableCell>
													{isEditingName ? (
														<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
															<TextField
																size="small"
																value={editValue}
																onChange={(e) => setEditValue(e.target.value)}
																onKeyDown={handleKeyDown}
																inputRef={editInputRef}
																sx={{ width: 200, '& input': { fontSize: 13, py: 0.5 } }}
															/>
															<IconButton size="small" onClick={handleSave} disabled={saving}>
																<CheckIcon sx={{ fontSize: 16, color: '#16a34a' }} />
															</IconButton>
															<IconButton size="small" onClick={cancelEdit}>
																<CloseIcon sx={{ fontSize: 16 }} />
															</IconButton>
														</Box>
													) : (
														<Box
															sx={{
																display: 'flex',
																alignItems: 'center',
																gap: 0.5,
																cursor: 'pointer',
																'&:hover .edit-hint': { opacity: 1 },
															}}
															onClick={() => startEdit('name', item)}
														>
															<Typography sx={{ fontWeight: 500, fontSize: 13 }}>
																{item.keyword}
															</Typography>
															<EditIcon
																className="edit-hint"
																sx={{ fontSize: 12, color: '#9ca3af', opacity: 0, transition: 'opacity 0.15s' }}
															/>
														</Box>
													)}
												</TableCell>

												<TableCell>
													{isEditingCategory ? (
														<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
															<Select
																size="small"
																value={editCategory}
																onChange={(e) => setEditCategory(e.target.value as KeywordCategory)}
																sx={{ fontSize: 12, minWidth: 80, '& .MuiSelect-select': { py: 0.5 } }}
															>
																{Object.entries(KEYWORD_CATEGORIES).map(([key, label]) => (
																	<MenuItem key={key} value={key} sx={{ fontSize: 12 }}>
																		{label}
																	</MenuItem>
																))}
															</Select>
															<IconButton size="small" onClick={handleSave} disabled={saving}>
																<CheckIcon sx={{ fontSize: 16, color: '#16a34a' }} />
															</IconButton>
															<IconButton size="small" onClick={cancelEdit}>
																<CloseIcon sx={{ fontSize: 16 }} />
															</IconButton>
														</Box>
													) : (
														<Chip
															label={KEYWORD_CATEGORIES[item.category] || item.category}
															size="small"
															onClick={() => startCategoryEdit(item)}
															sx={{
																bgcolor: catColor.bg,
																color: catColor.color,
																fontWeight: 600,
																fontSize: 10,
																height: 22,
																cursor: 'pointer',
															}}
														/>
													)}
												</TableCell>

												<TableCell sx={{ textAlign: 'right', fontSize: 13, fontWeight: 500 }}>
													{item.userCount.toLocaleString()}
												</TableCell>

												<TableCell sx={{ fontSize: 12, color: '#666' }}>
													{new Date(item.firstCreatedAt).toLocaleDateString('ko-KR', {
														year: 'numeric',
														month: 'numeric',
														day: 'numeric',
													})}
												</TableCell>

												<TableCell sx={{ textAlign: 'center' }}>
													<Box sx={{ display: 'flex', gap: 0.25, justifyContent: 'center' }}>
														<Tooltip title="프롬프트로 아이콘 생성" arrow>
															<IconButton
																size="small"
																onClick={() => openPromptDialog(item)}
																sx={{ color: '#8b5cf6' }}
															>
																<AutoFixHighIcon sx={{ fontSize: 16 }} />
															</IconButton>
														</Tooltip>
														<IconButton
															size="small"
															onClick={() => handleDelete(item)}
															sx={{ color: '#ef4444' }}
														>
															<DeleteIcon sx={{ fontSize: 16 }} />
														</IconButton>
													</Box>
												</TableCell>
											</TableRow>
										);
									})}
					</TableBody>
				</Table>
			</TableContainer>

			{!loading && items.length > 0 && (
				<TablePagination
					component="div"
					count={pagination.total}
					page={pagination.page - 1}
					onPageChange={(_, newPage) => fetchKeywords(newPage + 1)}
					rowsPerPage={pagination.pageSize}
					rowsPerPageOptions={[50]}
					labelDisplayedRows={({ from, to, count }) =>
						`${from}-${to} / 총 ${count}건`
					}
				/>
			)}

			{/* 프롬프트 아이콘 생성 다이얼로그 */}
			<Dialog
				open={promptDialog.open}
				onClose={() => !promptSubmitting && setPromptDialog({ open: false, item: null })}
				maxWidth="sm"
				fullWidth
			>
				<DialogTitle sx={{ fontWeight: 700 }}>
					AI 아이콘 생성 - &quot;{promptDialog.item?.keyword}&quot;
				</DialogTitle>
				<DialogContent>
					<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
						아이콘 생성에 사용할 이미지 프롬프트를 입력하세요.
						{promptDialog.item?.iconUrl && (
							<> 기존 아이콘이 새로 생성된 아이콘으로 교체됩니다.</>
						)}
					</Typography>
					{promptDialog.item?.iconUrl && (
						<Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
							<Typography variant="caption" color="text.secondary">현재 아이콘:</Typography>
							<Box
								component="img"
								src={promptDialog.item.iconUrl}
								sx={{ width: 32, height: 32, borderRadius: 1, objectFit: 'cover' }}
							/>
						</Box>
					)}
					<TextField
						autoFocus
						fullWidth
						multiline
						rows={3}
						value={promptValue}
						onChange={(e) => setPromptValue(e.target.value)}
						placeholder="예: A flat colorful fishing icon with a fishing rod and fish. Clean, simple, emoji style."
						onKeyDown={(e) => {
							if (e.key === 'Enter' && !e.shiftKey) {
								e.preventDefault();
								handleGenerateWithPrompt();
							}
						}}
						sx={{ '& textarea': { fontSize: 13 } }}
					/>
				</DialogContent>
				<DialogActions>
					<Button
						onClick={() => setPromptDialog({ open: false, item: null })}
						disabled={promptSubmitting}
					>
						취소
					</Button>
					<Button
						onClick={handleGenerateWithPrompt}
						variant="contained"
						disabled={promptSubmitting || !promptValue.trim()}
						startIcon={promptSubmitting ? <CircularProgress size={16} /> : <AutoFixHighIcon />}
						sx={{ bgcolor: '#8b5cf6', '&:hover': { bgcolor: '#7c3aed' } }}
					>
						{promptSubmitting ? '요청 중...' : '생성 요청'}
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
}

export default function KeywordsV2() {
	return <KeywordsContent />;
}
