'use client';
import { Button, Spinner, Chip, Modal, Tabs, TextField, Label, Input, Select, ListBox, Checkbox } from '@heroui/react';
import { FileText as ArticleIcon, MessageSquare as CommentIcon, Trash2 as DeleteIcon, Heart as FavoriteIcon, MessagesSquare as ForumIcon, Inbox as MoveToInboxIcon, User as PersonIcon, RefreshCw as RefreshIcon, Flag as ReportIcon, Eye as VisibilityIcon, EyeOff as VisibilityOffIcon } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Controller } from 'react-hook-form';
import AdminService from '@/app/services/admin';
import { useToast } from '@/shared/ui/admin/toast/toast-context';
import { useConfirm } from '@/shared/ui/admin/confirm-dialog/confirm-dialog-context';
import communityService, { Category } from '@/app/services/community';
import type { GhostCommentBody } from '@/app/services/community';
import UserDetailModal, { type UserDetail } from '@/components/admin/appearance/UserDetailModal';
import { safeToLocaleString, safeToLocaleDateString } from '@/app/utils/formatters';
import { CommunityPostAppDetailPanel } from './components/CommunityPostAppDetailPanel';
// 사용자 상세를 불러오는 동안 모달에 넘기는 빈 값 (loading/error 상태가 화면을 대신한다)
const EMPTY_USER_DETAIL: UserDetail = {
    id: '',
    name: '',
    age: 0,
    gender: 'MALE',
    profileImages: [],
};
// 게시글 목록 컴포넌트
function ArticleList() {
    const toast = useToast();
    // 에러는 페이지 배너와 함께 토스트로도 알린다 (모달에 가려져 보이지 않기 때문).
    const fail = (message: string) => {
        setError(message);
        toast.error(message);
    };
    const [articles, setArticles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [filter, setFilter] = useState<'all' | 'reported' | 'blinded'>('all');
    const [selectedArticles, setSelectedArticles] = useState<string[]>([]);
    const [openBlindDialog, setOpenBlindDialog] = useState(false);
    const [blindAction, setBlindAction] = useState<'blind' | 'unblind'>('blind');
    const [actionLoading, setActionLoading] = useState(false);
    // 게시글 삭제 관련 상태
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState<string>('');
    // 카테고리 이전 관련 상태
    const [openCategoryDialog, setOpenCategoryDialog] = useState(false);
    const [categoryTargetId, setCategoryTargetId] = useState<string>('');
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    const [selectedArticleDetail, setSelectedArticleDetail] = useState<any>(null);
    const [startDate, setStartDate] = useState<Date | null>(new Date());
    const [endDate, setEndDate] = useState<Date | null>(new Date());
    // 카테고리 필터 상태
    const [selectedFilterCategoryId, setSelectedFilterCategoryId] = useState<string>('');
    // 사용자 프로필 상세 모달 상태
    const [userModalOpen, setUserModalOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    // 게시글 목록 조회
    const fetchArticles = async () => {
        try {
            setLoading(true);
            setError(null);
            const categoryId = selectedFilterCategoryId || null;
            const response = await communityService.getArticles(filter, page + 1, rowsPerPage, startDate, endDate, categoryId);
            setArticles(response.items ?? []);
            setTotalCount(response.meta?.totalItems ?? 0);
            ;
            ;
        }
        catch (error) {
            setError('게시글 목록을 불러오는 중 오류가 발생했습니다.');
        }
        finally {
            setLoading(false);
        }
    };
    // 시작 날짜 변경 시
    const handleStartDateChange = (date: Date | null) => {
        setStartDate(date);
        setPage(0); // 날짜가 변경되면 첫 페이지로 이동
    };
    // 종료 날짜 변경 시
    const handleEndDateChange = (date: Date | null) => {
        setEndDate(date);
        setPage(0); // 날짜가 변경되면 첫 페이지로 이동
    };
    // 페이지 변경 시
    const handleChangePage = (_: unknown, newPage: number) => {
        setPage(newPage);
    };
    // 페이지당 행 수 변경 시
    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };
    // 필터 변경 시
    const handleFilterChange = (event: any) => {
        setFilter(event.target.value as 'all' | 'reported' | 'blinded');
        setPage(0);
    };
    // 필터 초기화
    const handleResetFilters = () => {
        setFilter('all');
        setSelectedFilterCategoryId('');
        setStartDate(new Date());
        setEndDate(new Date());
        setPage(0);
    };
    // 게시글 선택 시
    const handleSelectArticle = (id: string) => {
        setSelectedArticles((prev) => {
            if (prev.includes(id)) {
                return prev.filter((articleId) => articleId !== id);
            }
            else {
                return [...prev, id];
            }
        });
    };
    // 전체 선택/해제
    const handleSelectAll = () => {
        if (selectedArticles.length === articles.length) {
            setSelectedArticles([]);
        }
        else {
            setSelectedArticles(articles.map((article) => article.id));
        }
    };
    // 블라인드 다이얼로그 열기
    const handleOpenBlindDialog = (action: 'blind' | 'unblind') => {
        setBlindAction(action);
        setOpenBlindDialog(true);
    };
    // 블라인드 다이얼로그 닫기
    const handleCloseBlindDialog = () => {
        setOpenBlindDialog(false);
    };
    // 게시글 블라인드 처리/해제
    const handleBlindArticles = async () => {
        try {
            setActionLoading(true);
            await communityService.bulkBlindArticles(selectedArticles, blindAction === 'blind');
            setSuccessMessage(`선택한 게시글을 ${blindAction === 'blind' ? '블라인드' : '블라인드 해제'} 처리했습니다.`);
            setSelectedArticles([]);
            fetchArticles();
            handleCloseBlindDialog();
        }
        catch (error) {
            fail('게시글 블라인드 처리 중 오류가 발생했습니다.');
        }
        finally {
            setActionLoading(false);
        }
    };
    // 게시글 삭제
    const handleDeleteArticle = async () => {
        try {
            setActionLoading(true);
            await communityService.deleteArticle(deleteTargetId);
            setSuccessMessage('게시글을 삭제했습니다.');
            fetchArticles();
            setOpenDeleteDialog(false);
            setDeleteTargetId('');
        }
        catch (error) {
            fail('게시글 삭제 중 오류가 발생했습니다.');
        }
        finally {
            setActionLoading(false);
        }
    };
    // 게시글 카테고리 이전
    const handleMoveCategory = async () => {
        try {
            setActionLoading(true);
            await communityService.moveArticleCategory(categoryTargetId, selectedCategoryId);
            setSuccessMessage('게시글 카테고리를 이전했습니다.');
            fetchArticles();
            setOpenCategoryDialog(false);
            setCategoryTargetId('');
            setSelectedCategoryId('');
        }
        catch (error) {
            fail('게시글 카테고리 이전 중 오류가 발생했습니다.');
        }
        finally {
            setActionLoading(false);
        }
    };
    // 게시글 상세 정보 조회
    const handleViewDetail = async (id: string) => {
        try {
            setActionLoading(true);
            const detail = await communityService.getArticleDetail(id);
            let articleReports: any[] = [];
            try {
                const reportsResponse = await communityService.getReports('article', 'all', 1, 100);
                articleReports =
                    reportsResponse?.items?.filter((report: any) => report.targetId === id || report.target_id === id) ?? [];
            }
            catch {
                toast.warning('게시글 신고 내역을 불러오지 못했습니다.');
            }
            setSelectedArticleDetail({ ...detail, reports: articleReports });
            setDetailDialogOpen(true);
        }
        catch (error) {
            fail('게시글 상세 정보를 불러오는 중 오류가 발생했습니다.');
        }
        finally {
            setActionLoading(false);
        }
    };
    // 상세 다이얼로그 닫기
    const handleCloseDetailDialog = () => {
        setDetailDialogOpen(false);
        setSelectedArticleDetail(null);
    };
    const refreshSelectedArticleDetail = async () => {
        if (!selectedArticleDetail?.id)
            return;
        const detail = await communityService.getArticleDetail(selectedArticleDetail.id);
        setSelectedArticleDetail((prev: any) => ({
            ...detail,
            reports: prev?.reports ?? [],
        }));
    };
    const handleCreateGhostComment = async (articleId: string, body: GhostCommentBody) => {
        const result = await communityService.createGhostComment(articleId, body);
        if (!result.comment) {
            await fetchArticles();
            return result;
        }
        setSelectedArticleDetail((prev: any) => {
            if (!prev || prev.id !== articleId)
                return prev;
            return {
                ...prev,
                comments: [...(prev.comments ?? []), result.comment],
                commentCount: (prev.commentCount ?? prev.comments?.length ?? 0) + 1,
            };
        });
        await fetchArticles();
        return result;
    };
    // 성공 메시지 초기화
    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => {
                setSuccessMessage(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);
    // 게시글 목록 조회
    useEffect(() => {
        fetchArticles();
    }, [filter, page, rowsPerPage, startDate, endDate, selectedFilterCategoryId]);
    // 카테고리 목록 조회
    const fetchCategories = async () => {
        try {
            const response = await communityService.getCategories();
            setCategories(response.categories ?? []);
        }
        catch {
            toast.error('카테고리 목록을 불러오지 못했습니다.');
        }
    };
    useEffect(() => {
        fetchCategories();
    }, []);
    return (<div>
			{/* 필터 및 액션 버튼 */}
			<div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
				<div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
					<h2 className="text-lg font-semibold">게시글 관리 ({totalCount})</h2>

					<div style={{ minWidth: 150 }}>
						<label id="filter-label">필터</label>
						<Select value={filter} aria-label={"필터"} onChange={(key) => {
            const value = String(key ?? "");
            (handleFilterChange)({ target: { value: value }, currentTarget: { value: value } } as never);
        }} className="min-w-[120px]"><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
							<ListBox.Item id={"all"} textValue={"\uC804\uCCB4 \uAC8C\uC2DC\uAE00"}>전체 게시글</ListBox.Item>
							<ListBox.Item id={"reported"} textValue={"\uC2E0\uACE0\uB41C \uAC8C\uC2DC\uAE00"}>신고된 게시글</ListBox.Item>
							<ListBox.Item id={"blinded"} textValue={"\uBE14\uB77C\uC778\uB4DC \uAC8C\uC2DC\uAE00"}>블라인드 게시글</ListBox.Item>
						</ListBox></Select.Popover></Select>
					</div>

					<div style={{ minWidth: 150 }}>
						<Select value={selectedFilterCategoryId} aria-label="카테고리" onChange={(key) => {
            const value = String(key ?? "");
            setSelectedFilterCategoryId(value);
            setPage(0); // 페이지를 첫 번째로 리셋
        }} className="min-w-[120px]"><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
							<ListBox.Item id={""} textValue={"\uC804\uCCB4 \uCE74\uD14C\uACE0\uB9AC"}>전체 카테고리</ListBox.Item>
							{categories.map((category) => (<ListBox.Item key={category.id} id={category.id} textValue={String(category.displayName)}>
									{category.displayName}
								</ListBox.Item>))}
						</ListBox></Select.Popover></Select>
					</div>

					<div>
						<TextField className="min-w-[150px]"><Label>{"시작 날짜"}</Label><Input type="date" value={startDate ? new Date(startDate.getTime() - startDate.getTimezoneOffset() * 60000).toISOString().slice(0, 10) : ""} onChange={event => (handleStartDateChange)(event.target.value ? new Date(event.target.value + "T00:00:00") : null)}></Input></TextField>
					</div>

					<div>
						<TextField className="min-w-[150px]"><Label>{"종료 날짜"}</Label><Input type="date" value={endDate ? new Date(endDate.getTime() - endDate.getTimezoneOffset() * 60000).toISOString().slice(0, 10) : ""} onChange={event => (handleEndDateChange)(event.target.value ? new Date(event.target.value + "T00:00:00") : null)}></Input></TextField>
					</div>

					<Button onPress={fetchArticles} variant="secondary">{<RefreshIcon></RefreshIcon>}
						새로고침
					</Button>

					<Button onPress={handleResetFilters} variant="secondary">
						필터 초기화
					</Button>
				</div>

				{selectedArticles.length > 0 && (<div style={{ display: 'flex', gap: 8 }}>
						<Button onPress={() => handleOpenBlindDialog('blind')} isDisabled={actionLoading} variant="secondary">{<VisibilityOffIcon></VisibilityOffIcon>}
							블라인드
						</Button>
						<Button onPress={() => handleOpenBlindDialog('unblind')} isDisabled={actionLoading} variant="secondary">{<VisibilityIcon></VisibilityIcon>}
							블라인드 해제
						</Button>
					</div>)}
			</div>

			{/* 성공/오류 메시지 */}
			{successMessage && (<aside role="alert" className="rounded-lg border p-3" style={{ marginBottom: 16 }}>
					{successMessage}
				</aside>)}
			{error && (<aside role="alert" className="rounded-lg border p-3" style={{ marginBottom: 16 }}>
					{error}
				</aside>)}

			{/* 게시글 목록 테이블 */}
			<div className="overflow-x-auto">
				<table className="w-full text-sm">
					<thead className="bg-gray-50 text-left">
						<tr className="border-b">
							<th scope="col" className="whitespace-nowrap border-b px-4 py-3">
								<Checkbox isSelected={articles.length > 0 && selectedArticles.length === articles.length} isIndeterminate={selectedArticles.length > 0 && selectedArticles.length < articles.length} onChange={checked => handleSelectAll()}><Checkbox.Content><Checkbox.Control><Checkbox.Indicator></Checkbox.Indicator></Checkbox.Control></Checkbox.Content></Checkbox>
							</th>
							<th scope="col" className="whitespace-nowrap border-b px-4 py-3">작성자</th>
							<th scope="col" className="whitespace-nowrap border-b px-4 py-3">제목</th>
							<th scope="col" className="whitespace-nowrap border-b px-4 py-3">내용</th>
							<th scope="col" className="whitespace-nowrap border-b px-4 py-3">댓글</th>
							<th scope="col" className="whitespace-nowrap border-b px-4 py-3">좋아요</th>
							<th scope="col" className="whitespace-nowrap border-b px-4 py-3">신고</th>
							<th scope="col" className="whitespace-nowrap border-b px-4 py-3">상태</th>
							<th scope="col" className="whitespace-nowrap border-b px-4 py-3">작성일</th>
							<th scope="col" className="whitespace-nowrap border-b px-4 py-3">액션</th>
						</tr>
					</thead>
					<tbody>
						{loading ? (<tr className="border-b">
								<td colSpan={9} className="border-b px-4 py-3">
									<Spinner size="sm" style={{ marginBlock: 16 }}></Spinner>
								</td>
							</tr>) : articles.length === 0 ? (<tr className="border-b">
								<td colSpan={9} className="border-b px-4 py-3">
									게시글이 없습니다.
								</td>
							</tr>) : (articles.map((article) => (<tr key={article.id} className="border-b">
									<td className="border-b px-4 py-3">
										<Checkbox isSelected={selectedArticles.includes(article.id)} onChange={checked => handleSelectArticle(article.id)}><Checkbox.Content><Checkbox.Control><Checkbox.Indicator></Checkbox.Indicator></Checkbox.Control></Checkbox.Content></Checkbox>
									</td>
									<td className="border-b px-4 py-3">
										<Button variant="tertiary" onPress={() => {
                const uid = article.author?.id ?? article.userId;
                if (uid) {
                    setSelectedUserId(uid);
                    setUserModalOpen(true);
                }
            }} style={{ color: "var(--accent)", cursor: 'pointer', display: 'inline' }}>
											{article.anonymous ?? '익명'}
											{article.author?.name ? ` [${article.author.name}]` : ''}
										</Button>
										{(article.author?.id ?? article.userId) && (
											<p className="text-xs text-gray-500">
												ID: {article.author?.id ?? article.userId}
											</p>
										)}
									</td>
									<td className="border-b px-4 py-3">
										<p title={article.title ?? undefined} className={`max-w-[200px] truncate ${article.isBlinded || (article as any).blindedAt ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
											{article.title ?? '제목 없음'}
										</p>
									</td>
									<td className="border-b px-4 py-3">
										<p title={article.content ?? undefined} className={`max-w-[200px] truncate ${article.isBlinded || (article as any).blindedAt ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
											{article.emoji} {article.content}
										</p>
									</td>
									<td className="whitespace-nowrap border-b px-4 py-3">{article.commentCount}</td>
									<td className="whitespace-nowrap border-b px-4 py-3">{article.likeCount ?? 0}</td>
									<td className="border-b px-4 py-3">
										{article.reportCount > 0 ? (<Chip size="sm">{article.reportCount}</Chip>) : ('0')}
									</td>
									<td className="border-b px-4 py-3">
										{article.isBlinded || (article as any).blindedAt ? (<Chip size="sm">{"블라인드"}</Chip>) : (<Chip size="sm">{"정상"}</Chip>)}
									</td>
									<td className="whitespace-nowrap border-b px-4 py-3">{safeToLocaleDateString(article.createdAt)}</td>
									<td className="whitespace-nowrap border-b px-4 py-3">
										<span title={"상세 보기"}>
											<Button onPress={() => handleViewDetail(article.id)} variant="tertiary" isIconOnly={true} aria-label={"상세 보기"}>
												<ArticleIcon></ArticleIcon>
											</Button>
										</span>
										{article.isBlinded || (article as any).blindedAt ? (<span title={"블라인드 해제"}>
												<Button onPress={() => {
                    setSelectedArticles([article.id]);
                    handleOpenBlindDialog('unblind');
                }} variant="tertiary" isIconOnly={true} aria-label={"블라인드 해제"}>
													<VisibilityIcon></VisibilityIcon>
												</Button>
											</span>) : (<span title={"블라인드"}>
												<Button onPress={() => {
                    setSelectedArticles([article.id]);
                    handleOpenBlindDialog('blind');
                }} variant="tertiary" isIconOnly={true} aria-label={"블라인드"}>
													<VisibilityOffIcon></VisibilityOffIcon>
												</Button>
											</span>)}
										<span title={"카테고리 이전"}>
											<Button onPress={() => {
                setCategoryTargetId(article.id);
                setSelectedCategoryId('');
                setOpenCategoryDialog(true);
            }} variant="tertiary" isIconOnly={true} aria-label={"카테고리 이전"}>
												<MoveToInboxIcon></MoveToInboxIcon>
											</Button>
										</span>
										<span title={"게시글 삭제"}>
											<Button onPress={() => {
                setDeleteTargetId(article.id);
                setOpenDeleteDialog(true);
            }} variant="tertiary" isIconOnly={true} aria-label={"게시글 삭제"}>
												<DeleteIcon></DeleteIcon>
											</Button>
										</span>
									</td>
								</tr>)))}
					</tbody>
				</table>
			</div>

			{/* 페이지네이션 */}
			<div className="flex items-center justify-end gap-3 border-t p-4"><div><Select aria-label="페이지당 행 수" value={rowsPerPage} onChange={(key) => {
            const value = String(key ?? "");
            (handleChangeRowsPerPage)({ target: { value: value }, currentTarget: { value: value } } as never);
        }} className="min-w-[120px]"><Label>페이지당 행 수</Label><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox><ListBox.Item id={5} textValue={"5"}>5</ListBox.Item><ListBox.Item id={10} textValue={"10"}>10</ListBox.Item><ListBox.Item id={25} textValue={"25"}>25</ListBox.Item><ListBox.Item id={50} textValue={"50"}>50</ListBox.Item></ListBox></Select.Popover></Select></div><Button variant="secondary" isDisabled={page <= 0} onPress={() => (handleChangePage)(null, page - 1)}>이전</Button><span>{page + 1} 페이지 / {totalCount}개</span><Button variant="secondary" isDisabled={(page + 1) * rowsPerPage >= totalCount} onPress={() => (handleChangePage)(null, page + 1)}>다음</Button></div>

			{/* 블라인드 다이얼로그 */}
			<Modal.Backdrop isOpen={openBlindDialog} isDismissable={!actionLoading} isKeyboardDismissDisabled={actionLoading} onOpenChange={next => {
            if (!next && !actionLoading)
                handleCloseBlindDialog();
        }}><Modal.Container size="lg"><Modal.Dialog style={{ width: '100%', maxWidth: 600, minWidth: 0 }}>
				<Modal.Heading>게시글 {blindAction === 'blind' ? '블라인드' : '블라인드 해제'}</Modal.Heading>
				<Modal.Body>
					<p style={{ marginBottom: 16 }}>
						선택한 {selectedArticles.length}개의 게시글을{' '}
						{blindAction === 'blind' ? '블라인드' : '블라인드 해제'} 처리하시겠습니까?
					</p>
				</Modal.Body>
				<Modal.Footer>
					<Button onPress={handleCloseBlindDialog} isDisabled={actionLoading} variant="tertiary">
						취소
					</Button>
					<Button onPress={handleBlindArticles} isDisabled={actionLoading} variant="tertiary">
						{actionLoading ? (<Spinner size="sm"></Spinner>) : blindAction === 'blind' ? ('블라인드') : ('블라인드 해제')}
					</Button>
				</Modal.Footer>
			</Modal.Dialog></Modal.Container></Modal.Backdrop>

			{/* 게시글 상세 다이얼로그 */}
			<Modal.Backdrop isOpen={detailDialogOpen} onOpenChange={next => {
            if (!next)
                handleCloseDetailDialog();
        }}><Modal.Container size="lg"><Modal.Dialog style={{ width: '100%', maxWidth: 1200, minWidth: 0 }}>
				<Modal.Heading>게시글 상세 정보</Modal.Heading>
				<Modal.Body>
					{selectedArticleDetail && (<CommunityPostAppDetailPanel post={{
                ...selectedArticleDetail,
                authorId: selectedArticleDetail.author?.id ?? selectedArticleDetail.userId,
                authorName: selectedArticleDetail.author?.name,
                nickname: selectedArticleDetail.anonymous ?? selectedArticleDetail.nickname,
            }} comments={selectedArticleDetail.comments ?? []} ghostCandidates={selectedArticleDetail.ghostCandidates ?? []} ghostCandidateCount={selectedArticleDetail.ghostCandidateCount} onSubmitGhostComment={handleCreateGhostComment} onReload={refreshSelectedArticleDetail}></CommunityPostAppDetailPanel>)}
				</Modal.Body>
				<Modal.Footer>
					<Button onPress={handleCloseDetailDialog} variant="tertiary">닫기</Button>
					{selectedArticleDetail && (<>
							{selectedArticleDetail.isBlinded || (selectedArticleDetail as any).blindedAt ? (<Button onPress={() => {
                    setSelectedArticles([selectedArticleDetail.id]);
                    handleCloseDetailDialog();
                    handleOpenBlindDialog('unblind');
                }} variant="tertiary">{<VisibilityIcon></VisibilityIcon>}
									블라인드 해제
								</Button>) : (<Button onPress={() => {
                    setSelectedArticles([selectedArticleDetail.id]);
                    handleCloseDetailDialog();
                    handleOpenBlindDialog('blind');
                }} variant="tertiary">{<VisibilityOffIcon></VisibilityOffIcon>}
									블라인드
								</Button>)}
							<Button onPress={() => {
                setCategoryTargetId(selectedArticleDetail.id);
                setSelectedCategoryId('');
                handleCloseDetailDialog();
                setOpenCategoryDialog(true);
            }} variant="tertiary">{<MoveToInboxIcon></MoveToInboxIcon>}
								카테고리 이전
							</Button>
							<Button onPress={() => {
                setDeleteTargetId(selectedArticleDetail.id);
                handleCloseDetailDialog();
                setOpenDeleteDialog(true);
            }} variant="tertiary">{<DeleteIcon></DeleteIcon>}
								삭제
							</Button>
						</>)}
				</Modal.Footer>
			</Modal.Dialog></Modal.Container></Modal.Backdrop>

			{/* 게시글 삭제 확인 다이얼로그 */}
			<Modal.Backdrop isOpen={openDeleteDialog} isDismissable={!actionLoading} isKeyboardDismissDisabled={actionLoading} onOpenChange={next => {
            if (!next && !actionLoading)
                setOpenDeleteDialog(false);
        }}><Modal.Container size="lg"><Modal.Dialog style={{ width: '100%', maxWidth: 600, minWidth: 0 }}>
				<Modal.Heading>게시글 삭제 확인</Modal.Heading>
				<Modal.Body>
					<p>
						정말로 ‘{articles.find((article) => article.id === deleteTargetId)?.title || '제목 없음'}’ 게시글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
					</p>
				</Modal.Body>
				<Modal.Footer>
					<Button onPress={() => setOpenDeleteDialog(false)} isDisabled={actionLoading} variant="tertiary">
						취소
					</Button>
					<Button onPress={handleDeleteArticle} isDisabled={actionLoading} variant="danger">
						{actionLoading ? <Spinner size="sm"></Spinner> : '삭제'}
					</Button>
				</Modal.Footer>
			</Modal.Dialog></Modal.Container></Modal.Backdrop>

			{/* 카테고리 이전 다이얼로그 */}
			<Modal.Backdrop isOpen={openCategoryDialog} isDismissable={!actionLoading} isKeyboardDismissDisabled={actionLoading} onOpenChange={next => {
            if (!next && !actionLoading)
                setOpenCategoryDialog(false);
        }}><Modal.Container size="lg"><Modal.Dialog style={{ width: '100%', maxWidth: 600, minWidth: 0 }}>
				<Modal.Heading>게시글 카테고리 이전</Modal.Heading>
				<Modal.Body>
					<p style={{ marginBottom: 16 }}>이 게시글을 어느 카테고리로 이전하시겠습니까?</p>
					<div>
						<label>카테고리 선택</label>
						<Select value={selectedCategoryId} aria-label={"카테고리 선택"} onChange={(key) => {
            const value = String(key ?? "");
            setSelectedCategoryId(value);
        }} className="min-w-[120px]"><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
							{categories.map((category) => (<ListBox.Item key={category.id} id={category.id} textValue={String(category.displayName)}>
									{category.displayName}
								</ListBox.Item>))}
						</ListBox></Select.Popover></Select>
					</div>
				</Modal.Body>
				<Modal.Footer>
					<Button onPress={() => setOpenCategoryDialog(false)} isDisabled={actionLoading} variant="tertiary">
						취소
					</Button>
					<Button onPress={handleMoveCategory} isDisabled={actionLoading || !selectedCategoryId} variant="tertiary">
						{actionLoading ? <Spinner size="sm"></Spinner> : '이전'}
					</Button>
				</Modal.Footer>
			</Modal.Dialog></Modal.Container></Modal.Backdrop>

			{/* 사용자 프로필 상세 모달 */}
			<UserDetailModal open={userModalOpen} onClose={() => setUserModalOpen(false)} userId={selectedUserId} userDetail={{
            id: '',
            name: '',
            age: 0,
            gender: 'MALE',
            profileImages: [],
        }} loading={false} error={null}></UserDetailModal>
		</div>);
}
// 신고 관리 컴포넌트
function ReportList() {
    const toast = useToast();
    const confirm = useConfirm();
    // 에러는 페이지 배너와 함께 토스트로도 알린다 (모달에 가려져 보이지 않기 때문).
    const fail = (message: string) => {
        setError(message);
        toast.error(message);
    };
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [statusFilter, setStatusFilter] = useState<'pending' | 'reviewing' | 'resolved' | 'rejected'>('pending');
    const [reporterNameFilter, setReporterNameFilter] = useState('');
    const [reportedNameFilter, setReportedNameFilter] = useState('');
    const [selectedReport, setSelectedReport] = useState<any>(null);
    const [openDetailDialog, setOpenDetailDialog] = useState(false);
    // 사용자 상세 정보 모달 관련 상태
    const [userDetailModalOpen, setUserDetailModalOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [userDetail, setUserDetail] = useState<any>(null);
    const [loadingUserDetail, setLoadingUserDetail] = useState(false);
    const [userDetailError, setUserDetailError] = useState<string | null>(null);
    // 게시글 관리 관련 상태
    const [actionLoading, setActionLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [openBlindDialog, setOpenBlindDialog] = useState(false);
    const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
    const [blindAction, setBlindAction] = useState<'blind' | 'unblind'>('blind');
    // 신고 목록 조회
    const fetchReports = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await communityService.getCommunityReports(page + 1, rowsPerPage, statusFilter, reporterNameFilter || undefined, reportedNameFilter || undefined);
            setReports(response.items ?? []);
            setTotalCount(response.meta?.totalItems ?? 0);
            ;
        }
        catch (error) {
            setError('신고 목록을 불러오는 중 오류가 발생했습니다.');
        }
        finally {
            setLoading(false);
        }
    };
    // 페이지 변경
    const handleChangePage = (_: unknown, newPage: number) => {
        setPage(newPage);
    };
    // 페이지당 행 수 변경
    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };
    // 상태 필터 변경
    const handleStatusFilterChange = (event: any) => {
        setStatusFilter(event.target.value);
        setPage(0);
    };
    // 신고자 이름 필터 변경
    const handleReporterNameFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setReporterNameFilter(event.target.value);
    };
    // 신고당한 사용자 이름 필터 변경
    const handleReportedNameFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setReportedNameFilter(event.target.value);
    };
    // 필터 적용
    const handleApplyFilters = () => {
        setPage(0);
        fetchReports();
    };
    // 신고 상세 보기
    const handleViewDetail = (report: any) => {
        setSelectedReport(report);
        setOpenDetailDialog(true);
    };
    // 사용자 상세 정보 모달 열기
    const handleOpenUserDetailModal = async (userId: string) => {
        try {
            setSelectedUserId(userId);
            setUserDetailModalOpen(true);
            setLoadingUserDetail(true);
            setUserDetailError(null);
            setUserDetail(null);
            ;
            const data = await AdminService.userAppearance.getUserDetails(userId);
            ;
            setUserDetail(data);
        }
        catch (error: any) {
            const message = error.message || '유저 상세 정보를 불러오는 중 오류가 발생했습니다.';
            setUserDetailError(message);
            toast.error(message);
        }
        finally {
            setLoadingUserDetail(false);
        }
    };
    // 사용자 상세 정보 모달 닫기
    const handleCloseUserDetailModal = () => {
        setUserDetailModalOpen(false);
    };
    // 게시글 블라인드 처리
    const handleBlindArticle = (articleId: string, isBlinded: boolean) => {
        setSelectedArticleId(articleId);
        setBlindAction(isBlinded ? 'unblind' : 'blind');
        setOpenBlindDialog(true);
    };
    // 게시글 블라인드 처리 확인
    const handleConfirmBlind = async () => {
        if (!selectedArticleId)
            return;
        try {
            setActionLoading(true);
            const isBlinded = blindAction === 'blind';
            await communityService.blindArticle(selectedArticleId, isBlinded);
            setSuccessMessage(`게시글이 ${isBlinded ? '블라인드' : '블라인드 해제'} 처리되었습니다.`);
            setOpenBlindDialog(false);
            fetchReports(); // 목록 새로고침
        }
        catch (error) {
            fail('게시글 블라인드 처리 중 오류가 발생했습니다.');
        }
        finally {
            setActionLoading(false);
        }
    };
    // 게시글 삭제
    const handleDeleteArticle = async (articleId: string, title?: string) => {
        if (!articleId) {
            toast.error('삭제할 게시글 정보를 찾을 수 없습니다.');
            return;
        }
        const ok = await confirm({
            title: '게시글 삭제',
            message: `‘${title || '제목 없음'}’ 게시글을 삭제합니다.\n이 작업은 되돌릴 수 없습니다.`,
            confirmText: '삭제',
            severity: 'error',
        });
        if (!ok)
            return;
        try {
            setActionLoading(true);
            await communityService.deleteArticle(articleId);
            setSuccessMessage('게시글이 삭제되었습니다.');
            fetchReports(); // 목록 새로고침
        }
        catch (error) {
            fail('게시글 삭제 중 오류가 발생했습니다.');
        }
        finally {
            setActionLoading(false);
        }
    };
    // 신고 목록 조회
    useEffect(() => {
        fetchReports();
    }, [page, rowsPerPage, statusFilter]);
    // 성공 메시지 초기화
    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => {
                setSuccessMessage(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);
    // 상태에 따른 칩 색상
    const getStatusChipColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'warning';
            case 'reviewing':
                return 'info';
            case 'resolved':
                return 'success';
            case 'rejected':
                return 'error';
            default:
                return 'default';
        }
    };
    // 상태 한글 변환
    const getStatusText = (status: string) => {
        switch (status) {
            case 'pending':
                return '대기중';
            case 'reviewing':
                return '검토중';
            case 'resolved':
                return '처리완료';
            case 'rejected':
                return '반려';
            default:
                return status;
        }
    };
    return (<div>
			{/* 필터 및 검색 */}
			<div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
				<div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
					<h2 className="text-lg font-semibold">신고 관리 ({totalCount})</h2>

					<div style={{ minWidth: 120 }}>
						<label id="status-filter-label">상태</label>
						<Select value={statusFilter} aria-label={"상태"} onChange={(key) => {
            const value = String(key ?? "");
            (handleStatusFilterChange)({ target: { value: value }, currentTarget: { value: value } } as never);
        }} className="min-w-[120px]"><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
							<ListBox.Item id={"pending"} textValue={"\uB300\uAE30\uC911"}>대기중</ListBox.Item>
							<ListBox.Item id={"reviewing"} textValue={"\uAC80\uD1A0\uC911"}>검토중</ListBox.Item>
							<ListBox.Item id={"resolved"} textValue={"\uCC98\uB9AC\uC644\uB8CC"}>처리완료</ListBox.Item>
							<ListBox.Item id={"rejected"} textValue={"\uBC18\uB824"}>반려</ListBox.Item>
						</ListBox></Select.Popover></Select>
					</div>

					<TextField className="mb-4"><Label>{"신고자 이름"}</Label><Input value={reporterNameFilter} onChange={handleReporterNameFilterChange}></Input></TextField>

					<TextField className="mb-4"><Label>{"신고당한 사용자 이름"}</Label><Input value={reportedNameFilter} onChange={handleReportedNameFilterChange}></Input></TextField>

					<Button onPress={handleApplyFilters} variant="primary" style={{ height: 40 }}>
						검색
					</Button>
				</div>

				<Button onPress={fetchReports} variant="secondary">{<RefreshIcon></RefreshIcon>}
					새로고침
				</Button>
			</div>

			{/* 에러 메시지 */}
			{error && (<aside role="alert" className="rounded-lg border p-3" style={{ marginBottom: 16 }}>
					{error}
				</aside>)}

			{/* 성공 메시지 */}
			{successMessage && (<aside role="alert" className="rounded-lg border p-3" style={{ marginBottom: 16 }}>
					{successMessage}
				</aside>)}

			{/* 신고 목록 테이블 */}
			<div>
				<table className="w-full text-sm">
					<thead className="bg-gray-50 text-left">
						<tr className="border-b">
							<th scope="col" className="whitespace-nowrap border-b px-4 py-3">신고자</th>
							<th scope="col" className="whitespace-nowrap border-b px-4 py-3">신고당한 사용자</th>
							<th scope="col" className="whitespace-nowrap border-b px-4 py-3">게시글 제목</th>
							<th scope="col" className="whitespace-nowrap border-b px-4 py-3">신고 사유</th>
							<th scope="col" className="whitespace-nowrap border-b px-4 py-3">상태</th>
							<th scope="col" className="whitespace-nowrap border-b px-4 py-3">신고일</th>
							<th scope="col" className="whitespace-nowrap border-b px-4 py-3">액션</th>
						</tr>
					</thead>
					<tbody>
						{loading ? (<tr className="border-b">
								<td colSpan={7} className="border-b px-4 py-3">
									<Spinner size="sm" style={{ marginBlock: 16 }}></Spinner>
								</td>
							</tr>) : reports.length === 0 ? (<tr className="border-b">
								<td colSpan={7} className="border-b px-4 py-3">
									신고 내역이 없습니다.
								</td>
							</tr>) : (reports.map((report) => (<tr key={report.id} className="border-b">
									<td className="border-b px-4 py-3">
										<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
											<img src={report.reporter?.profileImageUrl} alt="프로필" className="h-9 w-9 rounded-full object-cover"></img>
											<div>
												<p>
													{report.reporter?.name || '알 수 없음'}
												</p>
												<p>
													{report.reporter?.phoneNumber || ''}
												</p>
											</div>
										</div>
									</td>
									<td className="border-b px-4 py-3">
										<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
											<img src={report.reported?.profileImageUrl} alt="프로필" className="h-9 w-9 rounded-full object-cover"></img>
											<div>
												<p>
													{report.reported?.name || '알 수 없음'}
												</p>
												<p>
													{report.reported?.phoneNumber || ''}
												</p>
											</div>
										</div>
									</td>
									<td className="border-b px-4 py-3">
										<p style={{ maxWidth: 200 }}>
											{report.article?.title || '제목 없음'}
										</p>
									</td>
									<td className="border-b px-4 py-3">
										<p style={{ maxWidth: 150 }}>
											{report.reason === '기타' && report.description
                ? `기타(${report.description.length > 15 ? report.description.slice(0, 15) + '...' : report.description})`
                : report.reason || '사유 없음'}
										</p>
									</td>
									<td className="border-b px-4 py-3">
										<Chip size="sm">{getStatusText(report.status)}</Chip>
									</td>
									<td className="border-b px-4 py-3">
										<p>
											{safeToLocaleDateString(report.createdAt, 'ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
            })}
										</p>
									</td>
									<td className="border-b px-4 py-3">
										<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
											<Button onPress={() => handleViewDetail(report)} variant="secondary">
												상세보기
											</Button>
											<Button onPress={() => handleBlindArticle(report.article?.id, !!report.article?.blindedAt)} isDisabled={actionLoading} variant="secondary">
												{report.article?.blindedAt ? '블라인드 해제' : '블라인드'}
											</Button>
											<Button onPress={() => handleDeleteArticle(report.article?.id, report.article?.title)} isDisabled={actionLoading} variant="secondary">
												삭제
											</Button>
										</div>
									</td>
								</tr>)))}
					</tbody>
				</table>
			</div>

			{/* 페이지네이션 */}
			<div className="flex items-center justify-end gap-3 border-t p-4"><div><Select aria-label="페이지당 행 수" value={rowsPerPage} onChange={(key) => {
            const value = String(key ?? "");
            (handleChangeRowsPerPage)({ target: { value: value }, currentTarget: { value: value } } as never);
        }} className="min-w-[120px]"><Label>페이지당 행 수</Label><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox><ListBox.Item id={5} textValue={"5"}>5</ListBox.Item><ListBox.Item id={10} textValue={"10"}>10</ListBox.Item><ListBox.Item id={25} textValue={"25"}>25</ListBox.Item></ListBox></Select.Popover></Select></div><Button variant="secondary" isDisabled={page <= 0} onPress={() => (handleChangePage)(null, page - 1)}>이전</Button><span>{page + 1} 페이지 / {totalCount}개</span><Button variant="secondary" isDisabled={(page + 1) * rowsPerPage >= totalCount} onPress={() => (handleChangePage)(null, page + 1)}>다음</Button></div>

			{/* 신고 상세 다이얼로그 */}
			<Modal.Backdrop isOpen={openDetailDialog} onOpenChange={next => {
            if (!next)
                (() => setOpenDetailDialog(false))();
        }}><Modal.Container size="lg"><Modal.Dialog style={{ width: '100%', maxWidth: 900, minWidth: 0 }}>
				<Modal.Heading>신고 상세 정보</Modal.Heading>
				<Modal.Body>
					{selectedReport && (<div style={{ marginTop: 8 }}>
							<h2 className="text-lg font-semibold">
								신고 정보
							</h2>
							<div style={{ marginBottom: 16 }}>
								<p>
									<span>신고 ID:</span>{' '}
									{selectedReport.id}
								</p>
								<p>
									<span>신고 사유:</span>{' '}
									{selectedReport.reason}
								</p>
								{selectedReport.description && (<div style={{ marginTop: 8 }}>
										<p>
											<span>상세 설명:</span>
										</p>
										<section style={{ padding: 12, marginTop: 4, backgroundColor: '#fff3e0' }} className="rounded-xl border bg-white p-4">
											<p style={{ whiteSpace: 'pre-wrap' }}>
												{selectedReport.description}
											</p>
										</section>
									</div>)}
								<p style={{ marginTop: 8 }}>
									<span>상태:</span>{' '}
									{getStatusText(selectedReport.status)}
								</p>
								<p>
									<span>신고일:</span>{' '}
									{safeToLocaleString(selectedReport.createdAt)}
								</p>
							</div>

							<h2 className="text-lg font-semibold">
								신고자 정보
							</h2>
							<div style={{ marginBottom: 16, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
								<img src={selectedReport.reporter?.profileImageUrl} alt="프로필" className="h-9 w-9 rounded-full object-cover"></img>
								<div>
									<p>
										<span>이름:</span>{' '}
										{selectedReport.reporter?.name || '-'}
									</p>
									<p>
										<span>이메일:</span>{' '}
										{selectedReport.reporter?.email || '-'}
									</p>
									<p>
										<span>전화번호:</span>{' '}
										{selectedReport.reporter?.phoneNumber || '-'}
									</p>
									<p>
										<span>나이/성별:</span>{' '}
										{selectedReport.reporter?.age ? `${selectedReport.reporter.age}세` : '-'} /{' '}
										{selectedReport.reporter?.gender === 'MALE'
                ? '남성'
                : selectedReport.reporter?.gender === 'FEMALE'
                    ? '여성'
                    : '-'}
									</p>
								</div>
							</div>

							<h2 className="text-lg font-semibold">
								신고당한 사용자 정보
							</h2>
							<div style={{ marginBottom: 16, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
								<img src={selectedReport.reported?.profileImageUrl} alt="프로필" className="h-9 w-9 rounded-full object-cover"></img>
								<div>
									<p>
										<span>이름:</span>{' '}
										{selectedReport.reported?.name || '-'}
									</p>
									<p>
										<span>이메일:</span>{' '}
										{selectedReport.reported?.email || '-'}
									</p>
									<p>
										<span>전화번호:</span>{' '}
										{selectedReport.reported?.phoneNumber || '-'}
									</p>
									<p>
										<span>나이/성별:</span>{' '}
										{selectedReport.reported?.age ? `${selectedReport.reported.age}세` : '-'} /{' '}
										{selectedReport.reported?.gender === 'MALE'
                ? '남성'
                : selectedReport.reported?.gender === 'FEMALE'
                    ? '여성'
                    : '-'}
									</p>
								</div>
							</div>

							<h2 className="text-lg font-semibold">
								신고된 게시글
							</h2>
							<div style={{ marginBottom: 16 }}>
								<p>
									<span>제목:</span>{' '}
									{selectedReport.article?.title || '제목 없음'}
								</p>
								<p style={{ marginTop: 8 }}>
									<span>내용:</span>
								</p>
								<section style={{ padding: 16, marginTop: 8, backgroundColor: '#f5f5f5' }} className="rounded-xl border bg-white p-4">
									<p style={{ whiteSpace: 'pre-wrap' }}>
										{selectedReport.article?.content || '내용 없음'}
									</p>
								</section>
								<p style={{ marginTop: 8 }}>
									<span>작성일:</span>{' '}
									{safeToLocaleString(selectedReport.article?.createdAt)}
								</p>
								<p>
									<span>블라인드 상태:</span>{' '}
									<Chip size="sm">{selectedReport.article?.blindedAt ? '블라인드 처리됨' : '정상'}</Chip>
								</p>
							</div>
						</div>)}
				</Modal.Body>
				<Modal.Footer>
					<Button onPress={() => setOpenDetailDialog(false)} variant="tertiary">닫기</Button>
				</Modal.Footer>
			</Modal.Dialog></Modal.Container></Modal.Backdrop>

			{/* 블라인드 확인 다이얼로그 */}
			<Modal.Backdrop isOpen={openBlindDialog} isDismissable={!actionLoading} isKeyboardDismissDisabled={actionLoading} onOpenChange={next => {
            if (!next && !actionLoading)
                setOpenBlindDialog(false);
        }}><Modal.Container size="lg"><Modal.Dialog style={{ width: '100%', maxWidth: 600, minWidth: 0 }}>
				<Modal.Heading>
					게시글 {blindAction === 'blind' ? '블라인드' : '블라인드 해제'} 확인
				</Modal.Heading>
				<Modal.Body>
					<p>
						정말로 이 게시글을 {blindAction === 'blind' ? '블라인드' : '블라인드 해제'}{' '}
						처리하시겠습니까?
					</p>
				</Modal.Body>
				<Modal.Footer>
					<Button onPress={() => setOpenBlindDialog(false)} isDisabled={actionLoading} variant="tertiary">취소</Button>
					<Button onPress={handleConfirmBlind} isDisabled={actionLoading} variant="primary">
						{actionLoading ? '처리중...' : blindAction === 'blind' ? '블라인드' : '블라인드 해제'}
					</Button>
				</Modal.Footer>
			</Modal.Dialog></Modal.Container></Modal.Backdrop>

			{/* 사용자 상세 정보 모달 */}
			{userDetailModalOpen && (<UserDetailModal open={userDetailModalOpen} onClose={handleCloseUserDetailModal} userId={selectedUserId} userDetail={userDetail ?? EMPTY_USER_DETAIL} loading={loadingUserDetail} error={userDetailError} onRefresh={() => {
                fetchReports();
            }}></UserDetailModal>)}
		</div>);
}
function AdminCommunityContent() {
    const searchParams = useSearchParams();
    const resolveTabIndex = (tab: string | null) => {
        if (tab === 'reports' || tab === '1') {
            return 1;
        }
        return 0;
    };
    const [currentTab, setCurrentTab] = useState(() => resolveTabIndex(searchParams?.get('tab') ?? null));
    useEffect(() => {
        setCurrentTab(resolveTabIndex(searchParams?.get('tab') ?? null));
    }, [searchParams]);
    // 탭 변경 핸들러
    const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
        setCurrentTab(newValue);
    };
    return (<div style={{ padding: 32, maxWidth: '100%', borderRadius: 2, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)', minHeight: 'calc(100vh - 100px)' }}>
			<div style={{ display: 'flex', alignItems: 'center', marginBottom: 32, paddingBottom: 16 }}>
				<ForumIcon style={{ fontSize: 36, marginRight: 16, color: "var(--accent)" }}></ForumIcon>
				<p style={{ fontWeight: 600 }}>
					커뮤니티 관리
				</p>
			</div>

			<div style={{ backgroundColor: '#fff', borderRadius: 2, padding: 0, boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)' }}>
				{/* 탭 네비게이션 */}
				<Tabs style={{ paddingInline: 16 }} selectedKey={currentTab} onSelectionChange={key => handleTabChange({} as never, key as never)}><Tabs.List aria-label="관리 항목">
					<Tabs.Tab id={0}>{<ArticleIcon></ArticleIcon>}{"게시글 관리"}<Tabs.Indicator></Tabs.Indicator></Tabs.Tab>
					<Tabs.Tab id={1}>{<ReportIcon></ReportIcon>}{"신고 관리"}<Tabs.Indicator></Tabs.Indicator></Tabs.Tab>
				</Tabs.List></Tabs>

				{/* 탭 컨텐츠 */}
				<div style={{ padding: 16 }}>
					{currentTab === 0 && <ArticleList></ArticleList>}
					{currentTab === 1 && <ReportList></ReportList>}
				</div>
			</div>
		</div>);
}
export default function AdminCommunity() {
    return <AdminCommunityContent></AdminCommunityContent>;
}
