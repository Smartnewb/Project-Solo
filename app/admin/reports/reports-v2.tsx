"use client";
import { Alert, Checkbox, Description, FieldError, Button, Spinner, Chip, Modal, Tabs, TextField, Label, Input, Select, ListBox } from '@heroui/react';
import { Flag as ReportIcon, MessageCircle as ChatIcon, FileText as DescriptionIcon, Globe as CrossBorderIcon } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from 'next/navigation';
import { Controller } from "react-hook-form";
import { useToast } from "@/shared/ui/admin/toast/toast-context";
import { useConfirm } from "@/shared/ui/admin/confirm-dialog";
import { useAdminForm } from "@/app/admin/hooks/forms";
import { reportStatusSchema, ReportStatusFormValues } from "@/app/admin/hooks/forms/schemas/report.schema";
import AdminService from "@/app/services/admin";
import type { CrossBorderDirection, ReportCountry, ReportHistoryEntry } from '@/app/services/admin';
import { AdminApiError } from '@/shared/lib/http/admin-fetch';
import { safeToLocaleDateString } from '@/app/utils/formatters';
import { sanitizeUrl } from '@/shared/lib/safe-url';
import { ReportCard, UserInfoCard, Field, REPORT_STATUS_CHIP, getDirectionBadgeLabel } from "./report-parts";
import { BlindAvatarSources } from "@/app/admin/users/blind-avatar-sources";
import UserDetailModal, { type UserDetail, } from "@/components/admin/appearance/UserDetailModal";
// Evidence/profile image URLs are user-controlled; refuse javascript:/data: schemes.
function openExternalUrl(url: string) {
    const safe = sanitizeUrl(url, { allowRelative: false });
    if (safe)
        window.open(safe, "_blank", "noopener");
}
interface Reporter {
    id: string;
    name: string;
    email: string;
    phoneNumber: string;
    age: number | null;
    gender: "MALE" | "FEMALE" | null;
    profileImageUrl: string;
    country?: ReportCountry | null;
    universityName?: string | null;
}
interface Reported {
    id: string;
    name: string;
    email: string;
    phoneNumber: string;
    age: number | null;
    gender: "MALE" | "FEMALE" | null;
    profileImageUrl: string;
    country?: ReportCountry | null;
    universityName?: string | null;
}
interface Report {
    id: string;
    type?: "profile" | "article" | "cross_border";
    direction?: "kr_to_jp" | "jp_to_kr" | null;
    sourceSchema?: ReportCountry | null;
    reporter: Reporter;
    reported: Reported;
    reason: string;
    description: string | null;
    translatedDescription?: string | null;
    descriptionLanguage?: string | null;
    evidenceImages: string[];
    severity?: "urgent" | "normal" | null;
    category?: string | null;
    slackDelivered?: boolean;
    reportCount?: number;
    status: "pending" | "reviewing" | "resolved" | "rejected";
    createdAt: string;
    updatedAt: string | null;
    chatRoomId?: string;
    chatRoomCountry?: ReportCountry | null;
    resolvedBy?: string | null;
    resolvedByName?: string | null;
    resolvedAt?: string | null;
}
interface ReportDetail extends Report {
    chatRoomId?: string;
    matchId?: string;
}
interface ChatMessage {
    id: string;
    senderId: string;
    senderName: string;
    content: string;
    translatedContent?: string | null;
    messageType: string;
    mediaUrl?: string;
    createdAt: string;
}
interface ChatHistoryResponse {
    messages: ChatMessage[];
    maleUser?: {
        id: string;
        name: string;
    };
    femaleUser?: {
        id: string;
        name: string;
    };
    pagination?: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
    };
}
type ReportScope = "domestic" | "cross-border";
type ReportStatus = "pending" | "reviewing" | "resolved" | "rejected";
type ReportAction = 'dismissed' | 'warned' | 'suspended' | 'banned' | 'escalated';
const STATUS_OPTIONS: {
    value: ReportStatus;
    label: string;
}[] = [
    { value: "pending", label: "대기중" },
    { value: "reviewing", label: "검토중" },
    { value: "resolved", label: "처리완료" },
    { value: "rejected", label: "반려" },
];
const ACTION_OPTIONS: {
    value: ReportAction;
    label: string;
}[] = [
    { value: 'escalated', label: '검토 승격' },
    { value: 'warned', label: '경고' },
    { value: 'suspended', label: '정지' },
    { value: 'banned', label: '차단' },
    { value: 'dismissed', label: '반려' },
];
// 백엔드는 반려를 'dismissed' 로 내려준다. 화면에는 한글 상태명만 보인다.
function statusLabel(status: string | null | undefined): string {
    if (!status)
        return '-';
    if (status === 'dismissed')
        return '반려';
    return STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status;
}
function getDefaultActionForStatus(status: ReportStatus | 'dismissed'): ReportAction {
    if (status === 'rejected' || status === 'dismissed')
        return 'dismissed';
    if (status === 'resolved')
        return 'warned';
    return 'escalated';
}
function getApiErrorStatus(err: unknown): number | null {
    if (err instanceof AdminApiError) return err.status;
    if (err && typeof err === 'object') {
        const record = err as { status?: unknown; response?: { status?: unknown } };
        if (typeof record.status === 'number') return record.status;
        if (typeof record.response?.status === 'number') return record.response.status;
    }
    return null;
}
// 로딩/오류 중에도 모달을 열어 상태를 보여주기 위한 빈 상세(참조 고정).
const EMPTY_USER_DETAIL = {} as UserDetail;
function ReportsManagementContent() {
    const toast = useToast();
    const confirm = useConfirm();
    const searchParams = useSearchParams();
    const deepLinkedReportId = searchParams?.get('reportId') ?? null;
    const requestedTab = searchParams?.get('tab') ?? searchParams?.get('scope');
    const initialScope: ReportScope =
        requestedTab === 'cross-border' || requestedTab === 'cross_border' ? 'cross-border' : 'domestic';
    const lastOpenedReportIdRef = useRef<string | null>(null);
    const fetchSeqRef = useRef(0);
    const [reportScope, setReportScope] = useState<ReportScope>(initialScope);
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [crossBorderApiPending, setCrossBorderApiPending] = useState(false);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [directionFilter, setDirectionFilter] = useState<CrossBorderDirection>("all");
    const [urgentOnly, setUrgentOnly] = useState(false);
    const [slackUndeliveredOnly, setSlackUndeliveredOnly] = useState(false);
    const [reporterNameFilter, setReporterNameFilter] = useState<string>("");
    const [reportedNameFilter, setReportedNameFilter] = useState<string>("");
    const [selectedReport, setSelectedReport] = useState<ReportDetail | null>(null);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [activeTab, setActiveTab] = useState(0);
    const [chatHistory, setChatHistory] = useState<ChatHistoryResponse | null>(null);
    const [reportHistory, setReportHistory] = useState<ReportHistoryEntry[]>([]);
    const [chatLoading, setChatLoading] = useState(false);
    const [profileImages, setProfileImages] = useState<string[]>([]);
    const [profileImagesLoading, setProfileImagesLoading] = useState(false);
    const [profileImagesError, setProfileImagesError] = useState<string | null>(null);
    const [statusUpdating, setStatusUpdating] = useState(false);
    const [reviewNote, setReviewNote] = useState("");
    const statusForm = useAdminForm<ReportStatusFormValues>({
        schema: reportStatusSchema,
        defaultValues: { status: "pending", action: 'escalated', suspendDays: 7, suspendPermanent: false, approverId: '' },
    });
    const watchedStatus = statusForm.watch('status');
    const watchedAction = statusForm.watch('action');
    // useAdminForm 은 렌더마다 새 객체를 돌려준다. effect/callback 의존성에는 안정적인 setValue 만 쓴다.
    const setStatusFormValue = statusForm.setValue;
    const [userDetailModalOpen, setUserDetailModalOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
    const [userDetailLoading, setUserDetailLoading] = useState(false);
    const [userDetailError, setUserDetailError] = useState<string | null>(null);
    const openReportDetail = useCallback(async (
        reportId: string,
        fallbackReport?: Report,
        scopeOverride?: ReportScope,
    ) => {
        const targetScope: ReportScope =
            scopeOverride ??
            (fallbackReport?.type === 'cross_border' ? 'cross-border' : reportScope);
        setDetailDialogOpen(true);
        setDetailLoading(true);
        setActiveTab(0);
        // 이전 신고에서 입력한 제재 옵션이 다음 신고로 넘어가지 않게 초기화한다.
        setStatusFormValue('suspendDays', 7);
        setStatusFormValue('suspendPermanent', false);
        setStatusFormValue('approverId', '');
        setReviewNote('');
        setChatHistory(null);
        setProfileImages([]);
        setReportHistory([]);
        try {
            let detailResponse: ReportDetail | null = null;
            let nextHistory: ReportHistoryEntry[] = [];

            if (targetScope === 'cross-border' && typeof AdminService.reports.getCrossBorderReportDetail === 'function') {
                const [detailResult, historyResult] = await Promise.allSettled([
                    AdminService.reports.getCrossBorderReportDetail(reportId),
                    typeof AdminService.reports.getCrossBorderReportHistory === 'function'
                        ? AdminService.reports.getCrossBorderReportHistory(reportId)
                        : Promise.resolve([]),
                ]);
                detailResponse = detailResult.status === 'fulfilled' ? detailResult.value : null;
                nextHistory = historyResult.status === 'fulfilled' ? historyResult.value : [];
            } else {
                const [detailResult, historyResult] = await Promise.allSettled([
                    AdminService.reports.getProfileReportDetail(reportId),
                    AdminService.reports.getProfileReportHistory(reportId),
                ]);
                detailResponse = detailResult.status === 'fulfilled' ? detailResult.value : null;
                nextHistory = historyResult.status === 'fulfilled' ? historyResult.value : [];

                // 슬랙 등 ?reportId= 딥링크가 한일 신고를 가리킬 수 있으므로 국내 404 시 한일 상세로 폴백한다.
                if (
                    !detailResponse &&
                    !fallbackReport &&
                    typeof AdminService.reports.getCrossBorderReportDetail === 'function'
                ) {
                    const [crossDetailResult, crossHistoryResult] = await Promise.allSettled([
                        AdminService.reports.getCrossBorderReportDetail(reportId),
                        typeof AdminService.reports.getCrossBorderReportHistory === 'function'
                            ? AdminService.reports.getCrossBorderReportHistory(reportId)
                            : Promise.resolve([]),
                    ]);
                    if (crossDetailResult.status === 'fulfilled' && crossDetailResult.value) {
                        detailResponse = crossDetailResult.value;
                        nextHistory = crossHistoryResult.status === 'fulfilled' ? crossHistoryResult.value : [];
                        setReportScope('cross-border');
                    }
                }
            }

            setReportHistory(nextHistory);
            if (!detailResponse) {
                throw new Error('report detail unavailable');
            }
            const reportDetail: ReportDetail = fallbackReport
                ? {
                    ...fallbackReport,
                    ...detailResponse,
                    reportCount: detailResponse.reportCount ?? fallbackReport.reportCount,
                }
                : detailResponse;
            setSelectedReport(reportDetail);
            setStatusFormValue('status', reportDetail.status);
            setStatusFormValue('action', getDefaultActionForStatus(reportDetail.status));
        }
        catch {
            if (fallbackReport) {
                setSelectedReport(fallbackReport);
                setStatusFormValue('status', fallbackReport.status);
                setStatusFormValue('action', getDefaultActionForStatus(fallbackReport.status));
            }
            else {
                setDetailDialogOpen(false);
                setError('신고 상세 정보를 불러오는데 실패했습니다.');
            }
        }
        finally {
            setDetailLoading(false);
        }
    }, [reportScope, setStatusFormValue]);
    const fetchReports = async () => {
        const seq = ++fetchSeqRef.current;
        try {
            setLoading(true);
            setError(null);
            setCrossBorderApiPending(false);
            const params = new URLSearchParams();
            params.append("page", (page + 1).toString());
            params.append("limit", rowsPerPage.toString());
            if (statusFilter) {
                params.append("status", statusFilter);
            }
            if (urgentOnly) params.append("urgent", "true");
            if (reporterNameFilter.trim()) {
                params.append("reporterName", reporterNameFilter.trim());
            }
            if (reportedNameFilter.trim()) {
                params.append("reportedName", reportedNameFilter.trim());
            }

            if (reportScope === 'cross-border') {
                if (directionFilter !== 'all') {
                    params.append("direction", directionFilter);
                }
                if (typeof AdminService.reports.getCrossBorderReports !== 'function') {
                    setCrossBorderApiPending(true);
                    setReports([]);
                    setTotalCount(0);
                    return;
                }
                const response = await AdminService.reports.getCrossBorderReports(params);
                if (seq !== fetchSeqRef.current) return;
                if (response?.items) {
                    setReports(response.items);
                    setTotalCount(response.meta?.total ?? 0);
                } else {
                    setReports([]);
                    setTotalCount(0);
                }
                return;
            }

            if (slackUndeliveredOnly) params.append("slackUndelivered", "true");
            const response = await AdminService.getProfileReports(params);
            if (seq !== fetchSeqRef.current) return;
            if (response?.items) {
                setReports(response.items);
                setTotalCount(response.meta?.total ?? 0);
            }
            else {
                setReports([]);
                setTotalCount(0);
            }
        }
        catch (err: unknown) {
            if (seq !== fetchSeqRef.current) return;
            const status = getApiErrorStatus(err);
            if (reportScope === 'cross-border' && (status === 404 || status === 501)) {
                setCrossBorderApiPending(true);
                setReports([]);
                setTotalCount(0);
                return;
            }
            setError(
                reportScope === 'cross-border'
                    ? "한일 신고 목록을 불러오는데 실패했습니다."
                    : "신고 목록을 불러오는데 실패했습니다.",
            );
        }
        finally {
            if (seq === fetchSeqRef.current) {
                setLoading(false);
            }
        }
    };
    useEffect(() => {
        void fetchReports();
    }, [reportScope, page, rowsPerPage, statusFilter, directionFilter, urgentOnly, slackUndeliveredOnly, reporterNameFilter, reportedNameFilter]);
    useEffect(() => {
        if (!deepLinkedReportId) {
            lastOpenedReportIdRef.current = null;
            return;
        }
        if (lastOpenedReportIdRef.current === deepLinkedReportId) {
            return;
        }
        lastOpenedReportIdRef.current = deepLinkedReportId;
        void openReportDetail(
            deepLinkedReportId,
            undefined,
            initialScope === 'cross-border' ? 'cross-border' : undefined,
        );
    }, [deepLinkedReportId, initialScope, openReportDetail]);
    useEffect(() => {
        if (!watchedStatus)
            return;
        setStatusFormValue('action', getDefaultActionForStatus(watchedStatus));
    }, [setStatusFormValue, watchedStatus]);
    const handleScopeChange = (nextScope: ReportScope) => {
        if (nextScope === reportScope)
            return;
        setReportScope(nextScope);
        setPage(0);
        setError(null);
        setCrossBorderApiPending(false);
        setReports([]);
        setTotalCount(0);
    };
    const handleChangePage = (_event: unknown, newPage: number) => {
        setPage(newPage);
    };
    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };
    const handleStatusFilterChange = (event: {
        target: {
            value: string;
        };
    }) => {
        setStatusFilter(event.target.value);
        setPage(0);
    };
    const handleReporterNameFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setReporterNameFilter(event.target.value);
        setPage(0);
    };
    const handleReportedNameFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setReportedNameFilter(event.target.value);
        setPage(0);
    };
    const handleViewDetail = async (report: Report) => {
        await openReportDetail(
            report.id,
            report,
            report.type === 'cross_border' || reportScope === 'cross-border' ? 'cross-border' : 'domestic',
        );
    };
    const handleCloseDetailDialog = () => {
        setDetailDialogOpen(false);
        setSelectedReport(null);
        setChatHistory(null);
        setProfileImages([]);
        setReportHistory([]);
        setReviewNote('');
        setActiveTab(0);
    };
    const handleLoadChatHistory = useCallback(async () => {
        if (!selectedReport?.chatRoomId)
            return;
        setChatLoading(true);
        try {
            const chatCountry =
                selectedReport.type === 'cross_border' || reportScope === 'cross-border'
                    ? (selectedReport.chatRoomCountry ?? selectedReport.reporter.country ?? undefined)
                    : undefined;
            const response = chatCountry
                ? await AdminService.reports.getChatHistory(selectedReport.chatRoomId, 1, 50, chatCountry)
                : await AdminService.reports.getChatHistory(selectedReport.chatRoomId);
            setChatHistory(response);
        }
        catch {
            toast.error("채팅 내역을 불러오는데 실패했습니다.");
        }
        finally {
            setChatLoading(false);
        }
    }, [reportScope, selectedReport?.chatRoomCountry, selectedReport?.chatRoomId, selectedReport?.reporter.country, selectedReport?.type]);
    const handleLoadProfileImages = useCallback(async () => {
        if (!selectedReport?.reported?.id)
            return;
        setProfileImagesLoading(true);
        setProfileImagesError(null);
        try {
            const reportedCountry = selectedReport.reported.country ?? undefined;
            const images = reportedCountry
                ? await AdminService.reports.getUserProfileImages(selectedReport.reported.id, reportedCountry)
                : await AdminService.reports.getUserProfileImages(selectedReport.reported.id);
            setProfileImages(images);
        }
        catch {
            setProfileImagesError("프로필 이미지를 불러오는데 실패했습니다.");
        }
        finally {
            setProfileImagesLoading(false);
        }
    }, [selectedReport?.reported?.country, selectedReport?.reported?.id]);
    // 피신고자 사진은 상세를 열면 바로 보여준다 (기존: 특정 사유에서만 탭 → 수동 불러오기).
    useEffect(() => {
        if (detailDialogOpen && selectedReport?.reported?.id) {
            void handleLoadProfileImages();
        }
    }, [detailDialogOpen, selectedReport?.reported?.id, handleLoadProfileImages]);
    const submitReportStatusUpdate = async (params: {
        status: ReportStatus;
        action: ReportAction;
        suspendDays?: 3 | 7 | 14 | 30;
        suspendPermanent?: boolean;
        approverId?: string;
    }) => {
        if (!selectedReport)
            return;
        if (params.action === 'suspended' || params.action === 'banned' || params.action === 'warned') {
            const actionLabel = ACTION_OPTIONS.find((option) => option.value === params.action)?.label ?? params.action;
            const durationText = params.action === 'suspended'
                ? `\n기간: ${params.suspendPermanent ? '영구' : `${params.suspendDays ?? 7}일`}`
                : params.action === 'banned'
                    ? '\n기간: 영구'
                    : '';
            const ok = await confirm({
                title: params.action === 'warned' ? '처리완료(경고) 확인' : '제재 확인',
                message: `${selectedReport.reported.name}님에게 '${actionLabel}' 처리를 합니다.${durationText}`,
                confirmText: '처리',
                severity: params.action === 'warned' ? 'warning' : 'error',
            });
            if (!ok)
                return;
        }
        const isCrossBorder = selectedReport.type === 'cross_border' || reportScope === 'cross-border';
        const trimmedNote = reviewNote.trim();
        setStatusUpdating(true);
        try {
            if (isCrossBorder && typeof AdminService.reports.updateCrossBorderReportStatus === 'function') {
                await AdminService.reports.updateCrossBorderReportStatus(selectedReport.id, params.status, {
                    type: 'cross_border',
                    action: params.action,
                    note: trimmedNote || null,
                    suspendDays: params.suspendDays,
                    suspendPermanent: params.suspendPermanent,
                    approverId: params.approverId,
                });
            } else {
                await AdminService.reports.updateReportStatus(selectedReport.id, params.status, {
                    type: 'profile',
                    action: params.action,
                    ...(trimmedNote ? { note: trimmedNote } : {}),
                    suspendDays: params.suspendDays,
                    suspendPermanent: params.suspendPermanent,
                    approverId: params.approverId,
                });
            }
            toast.success("상태가 변경되었습니다.");
            await openReportDetail(
                selectedReport.id,
                {
                    ...selectedReport,
                    status: params.status,
                },
                isCrossBorder ? 'cross-border' : 'domestic',
            );
            void fetchReports();
        }
        catch {
            toast.error("상태 변경에 실패했습니다.");
        }
        finally {
            setStatusUpdating(false);
        }
    };
    const handleStatusChange = statusForm.handleFormSubmit(async (data) => {
        await submitReportStatusUpdate({
            status: data.status,
            action: data.action,
            suspendDays: data.suspendDays as 3 | 7 | 14 | 30 | undefined,
            suspendPermanent: data.suspendPermanent,
            approverId: data.approverId,
        });
    });
    const handleOpenUserDetailModal = async (userId: string, country?: ReportCountry | null) => {
        try {
            setSelectedUserId(userId);
            setUserDetailModalOpen(true);
            setUserDetailLoading(true);
            setUserDetailError(null);
            setUserDetail(null);
            const data = country
                ? await AdminService.userAppearance.getUserDetails(userId, country)
                : await AdminService.userAppearance.getUserDetails(userId);
            setUserDetail(data);
        }
        catch (err: unknown) {
            const message = err instanceof Error ? err.message : "사용자 정보를 불러오는데 실패했습니다.";
            setUserDetailError(message);
            toast.error(message);
        }
        finally {
            setUserDetailLoading(false);
        }
    };
    const handleCloseUserDetailModal = () => {
        setUserDetailModalOpen(false);
        setSelectedUserId(null);
        setUserDetail(null);
        setUserDetailError(null);
    };
    const formatDate = (dateString: string) => {
        return safeToLocaleDateString(dateString, "ko-KR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
    };
    const getReviewActionLabel = (action: ReportHistoryEntry['action']) => {
        const actionMap: Record<ReportHistoryEntry['action'], string> = {
            dismissed: '반려',
            warned: '경고',
            suspended: '정지',
            banned: '차단',
            escalated: '검토 승격',
        };
        return actionMap[action] || action;
    };
    const renderChatMessages = () => {
        if (!chatHistory)
            return null;
        const { messages, maleUser, femaleUser } = chatHistory;
        const reporterId = selectedReport?.reporter?.id;
        return (<div style={{ maxHeight: 400, overflowY: "auto", padding: 16, backgroundColor: "#f5f5f5", borderRadius: 2 }}>
        {messages.length === 0 ? (<p style={{ textAlign: "center" }}>
            채팅 내역이 없습니다.
          </p>) : (messages.map((msg) => {
                const isReporter = msg.senderId === reporterId;
                const senderLabel = msg.senderId === maleUser?.id ? maleUser?.name : femaleUser?.name;
                return (<div key={msg.id} style={{ display: "flex", justifyContent: isReporter ? "flex-end" : "flex-start", marginBottom: 12 }}>
                <div style={{ maxWidth: "70%", backgroundColor: isReporter ? "#e3f2fd" : "#fff", padding: 12, borderRadius: 2, boxShadow: "0 2px 6px rgb(0 0 0 / 0.12)" }}>
                  <p style={{ display: "block", marginBottom: 4 }}>
                    {senderLabel || msg.senderName}
                  </p>
                  {msg.messageType === "image" && msg.mediaUrl ? (<img src={msg.mediaUrl} alt="채팅 이미지" style={{ maxWidth: "100%", borderRadius: 1 }}/>) : (<p>{msg.content}</p>)}
                  {msg.translatedContent && (<p className="mt-1 border-t border-black/10 pt-1 text-xs text-gray-600">
                      번역: {msg.translatedContent}
                    </p>)}
                  <p style={{ display: "block", marginTop: 4, textAlign: "right" }}>
                    {formatDate(msg.createdAt)}
                  </p>
                </div>
              </div>);
            }))}
      </div>);
    };
    const renderProfileImagesGrid = () => {
        if (profileImagesLoading) {
            return (<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (<div key={i} className="aspect-[3/4] animate-pulse rounded-lg bg-gray-200"></div>))}
        </div>);
        }
        if (profileImagesError) {
            return (<p className="text-sm text-red-600">{profileImagesError}</p>);
        }
        if (profileImages.length === 0) {
            return (<p className="rounded-lg bg-gray-50 p-4 text-center text-sm text-gray-500">등록된 프로필 사진이 없습니다.</p>);
        }
        return (<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {profileImages.map((imageUrl, index) => (<button key={index} type="button" aria-label={`프로필 사진 ${index + 1} 확대`} onClick={() => openExternalUrl(imageUrl)} className="aspect-[3/4] cursor-zoom-in overflow-hidden rounded-lg bg-gray-100">
            <img src={imageUrl} alt={`프로필 이미지 ${index + 1}`} loading="lazy" className="h-full w-full object-cover"/>
          </button>))}
      </div>);
    };
    const renderDetailTabs = () => {
        if (!selectedReport)
            return null;
        const showChatTab = Boolean(selectedReport.chatRoomId);
        return (<>
        {showChatTab && (<Tabs className="mb-4" selectedKey={activeTab} onSelectionChange={newValue => setActiveTab(Number(newValue))}><Tabs.List aria-label="관리 항목">
            <Tabs.Tab id={0}><DescriptionIcon size={16}></DescriptionIcon>기본 정보<Tabs.Indicator></Tabs.Indicator></Tabs.Tab>
            <Tabs.Tab id={1}><ChatIcon size={16}></ChatIcon>채팅 내역<Tabs.Indicator></Tabs.Indicator></Tabs.Tab>
          </Tabs.List></Tabs>)}

        {activeTab === 0 && renderBasicInfo()}

        {showChatTab && activeTab === 1 && (<div>
            {!chatHistory ? (<div className="py-8 text-center">
                <Button onPress={handleLoadChatHistory} isDisabled={chatLoading} variant="primary"><ChatIcon size={16}></ChatIcon>
                  {chatLoading ? (<Spinner size="sm"></Spinner>) : ("채팅 내역 불러오기")}
                </Button>
              </div>) : (renderChatMessages())}
          </div>)}
      </>);
    };
    const renderBasicInfo = () => {
        if (!selectedReport)
            return null;
        const latestReview = reportHistory[0] ?? null;
        const statusChip = REPORT_STATUS_CHIP[selectedReport.status];
        const directionLabel = getDirectionBadgeLabel(selectedReport);
        const isCrossBorder = selectedReport.type === 'cross_border' || reportScope === 'cross-border';
        const lastModified = latestReview?.createdAt ?? selectedReport.resolvedAt ?? selectedReport.updatedAt;
        const hasTranslatedDescription = Boolean(
            selectedReport.translatedDescription &&
                selectedReport.translatedDescription !== selectedReport.description
        );
        const descriptionLangCode =
            selectedReport.descriptionLanguage?.toUpperCase() ||
            (selectedReport.reporter.country === 'jp'
                ? 'JP'
                : selectedReport.reporter.country === 'kr'
                    ? 'KR'
                    : null);
        return (<div className="flex flex-col gap-4">
        <section className="rounded-xl border border-gray-200 p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold">신고 정보</h3>
            {statusChip && <Chip size="sm" className={statusChip.className}>{statusChip.label}</Chip>}
            {directionLabel && <Chip size="sm" className="bg-indigo-50 text-indigo-700">{directionLabel}</Chip>}
            {selectedReport.severity === 'urgent' && <Chip size="sm" className="bg-red-100 text-red-600">긴급</Chip>}
            {(selectedReport.reportCount ?? 0) > 1 && <Chip size="sm" className="bg-orange-100 text-orange-600">누적 {selectedReport.reportCount}건</Chip>}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="신고 ID"><span className="break-all font-mono text-xs">{selectedReport.id}</span></Field>
            <Field label="신고 사유">{selectedReport.reason || "-"}</Field>
            <Field label="신고일시">{formatDate(selectedReport.createdAt)}</Field>
            <Field label="최종 수정일시">{lastModified ? formatDate(lastModified) : "없음"}</Field>
            {isCrossBorder && selectedReport.sourceSchema && (<Field label="저장 스키마"><span className="font-mono text-xs">{selectedReport.sourceSchema}.cross_schema_reports</span></Field>)}
            {isCrossBorder && (selectedReport.resolvedByName || selectedReport.resolvedBy) && (<Field label="처리 관리자">{selectedReport.resolvedByName || selectedReport.resolvedBy}</Field>)}
            {hasTranslatedDescription ? (<div className="flex flex-col gap-2 sm:col-span-2">
                <Field label="상세 설명 (한국어 번역)">
                  <p className="whitespace-pre-wrap rounded-lg border border-indigo-100 bg-indigo-50/70 p-3 text-gray-900">
                    {selectedReport.translatedDescription}
                  </p>
                </Field>
                {selectedReport.description && (<Field label={`상세 설명 원문${descriptionLangCode ? ` (${descriptionLangCode})` : ''}`}>
                    <p className="whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-gray-700">
                      {selectedReport.description}
                    </p>
                  </Field>)}
              </div>) : selectedReport.description && (<div className="sm:col-span-2">
                <Field label="상세 설명">
                  <p className="whitespace-pre-wrap rounded-lg bg-gray-50 p-3">{selectedReport.description}</p>
                  {isCrossBorder && selectedReport.reporter.country === 'jp' && (<p className="mt-1 text-xs text-gray-500">한국어 번역 미제공 (원문 표시)</p>)}
                </Field>
              </div>)}
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-semibold">처리</h3>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="secondary" isDisabled={statusUpdating || selectedReport.status === 'resolved'} onPress={() => void submitReportStatusUpdate({ status: 'resolved', action: 'warned' })}>
                처리완료 (경고)
              </Button>
              <Button size="sm" variant="tertiary" isDisabled={statusUpdating || selectedReport.status === 'rejected'} onPress={() => void submitReportStatusUpdate({ status: 'rejected', action: 'dismissed' })}>
                기각 (반려)
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <Controller name="status" control={statusForm.control} render={({ field }) => (<Select {...field} aria-label={"상태 변경"} className="min-w-[140px]"><Label>상태 변경</Label><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
                  {STATUS_OPTIONS.map((option) => (<ListBox.Item key={option.value} id={option.value} textValue={String(option.label)}>
                      {option.label}
                    </ListBox.Item>))}
                </ListBox></Select.Popover></Select>)}></Controller>
            <Controller name="action" control={statusForm.control} render={({ field }) => (<Select {...field} aria-label={"처리 액션"} className="min-w-[140px]"><Label>처리 액션</Label><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
                  {ACTION_OPTIONS.map((option) => (<ListBox.Item key={option.value} id={option.value} textValue={String(option.label)}>
                      {option.label}
                    </ListBox.Item>))}
                </ListBox></Select.Popover></Select>)}></Controller>
            {watchedAction === 'suspended' && <><Controller name="suspendDays" control={statusForm.control} render={({field}) => <Select className="min-w-[110px]" value={String(field.value ?? 7)} onChange={key => field.onChange(Number(key))} isDisabled={statusForm.watch('suspendPermanent') === true}><Label>정지 기간</Label><Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger><Select.Popover><ListBox>{[3,7,14,30].map(days => <ListBox.Item key={days} id={String(days)} textValue={`${days}일`}>{days}일</ListBox.Item>)}</ListBox></Select.Popover></Select>} /><Controller name="suspendPermanent" control={statusForm.control} render={({field}) => <Checkbox isSelected={field.value === true} onChange={field.onChange}><Checkbox.Content><Checkbox.Control><Checkbox.Indicator /></Checkbox.Control>영구 정지</Checkbox.Content></Checkbox>} /></>}
            <TextField className="min-w-[220px] flex-1">
              <Label>처리 메모 (선택)</Label>
              <Input value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} placeholder="조치 사유 또는 CS 확인 메모" />
            </TextField>
            <Button onPress={() => void handleStatusChange()} isDisabled={statusUpdating ||
                (statusForm.watch("status") === selectedReport.status &&
                    statusForm.watch('action') === getDefaultActionForStatus(selectedReport.status) &&
                    !reviewNote.trim())} variant="primary">
              {statusUpdating ? <Spinner size="sm"></Spinner> : "변경"}
            </Button>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <UserInfoCard title="신고자" user={selectedReport.reporter} email={selectedReport.reporter.email} phoneNumber={selectedReport.reporter.phoneNumber} onOpen={() => handleOpenUserDetailModal(selectedReport.reporter.id, selectedReport.reporter.country)}></UserInfoCard>
          <UserInfoCard title="피신고자" user={selectedReport.reported} email={selectedReport.reported.email} phoneNumber={selectedReport.reported.phoneNumber} onOpen={() => handleOpenUserDetailModal(selectedReport.reported.id, selectedReport.reported.country)}></UserInfoCard>
        </div>

        <section className="rounded-xl border border-gray-200 p-4">
          <h3 className="mb-3 text-base font-semibold">피신고자 사진 정보</h3>
          <p className="mb-2 text-xs font-semibold text-gray-700">PHOTO · 등록한 프로필 사진</p>
          {renderProfileImagesGrid()}
          <p className="mb-2 mt-4 text-xs font-semibold text-gray-700">BLIND · 블라인드 캐릭터와 생성 원본</p>
          <BlindAvatarSources key={`${selectedReport.reported.id}-${selectedReport.reported.country ?? 'default'}`} userId={selectedReport.reported.id} country={selectedReport.reported.country}></BlindAvatarSources>
        </section>

        {selectedReport.evidenceImages.length > 0 && (<section className="rounded-xl border border-gray-200 p-4">
            <h3 className="mb-3 text-base font-semibold">증거 이미지</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {selectedReport.evidenceImages.map((imageUrl, index) => (<button key={index} type="button" aria-label={`증거 이미지 ${index + 1} 확대`} onClick={() => openExternalUrl(imageUrl)} className="aspect-square cursor-zoom-in overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                  <img src={imageUrl} alt={`증거 이미지 ${index + 1}`} loading="lazy" className="h-full w-full object-cover"/>
                </button>))}
            </div>
          </section>)}

        {latestReview && (<section className="rounded-xl border border-gray-200 p-4">
            <h3 className="mb-3 text-base font-semibold">처리 이력</h3>
            <ol className="flex flex-col gap-2">
              {reportHistory.map((historyItem) => (<li key={historyItem.id} className="rounded-lg bg-gray-50 p-3 text-sm">
                  <p className="font-semibold text-gray-900">
                    {getReviewActionLabel(historyItem.action)}
                    <span className="ml-2 text-xs font-normal text-gray-500">{statusLabel(historyItem.previousStatus)} → {statusLabel(historyItem.nextStatus)}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {(historyItem.reviewerName || historyItem.reviewerId || '알 수 없는 처리자')}
                    {historyItem.createdAt ? ` · ${formatDate(historyItem.createdAt)}` : ''}
                  </p>
                  {historyItem.note && (<p className="mt-1 whitespace-pre-wrap text-gray-700">{historyItem.note}</p>)}
                </li>))}
            </ol>
          </section>)}
      </div>);
    };
    return (<div className="p-6">
      <div className="mb-4 flex items-center gap-3">
        <ReportIcon size={32} className="text-[var(--accent)]"></ReportIcon>
        <h1 className="text-xl font-semibold">프로필 신고 관리</h1>
      </div>

      <Tabs
        className="mb-6"
        selectedKey={reportScope}
        onSelectionChange={(key) => {
          const next = String(key);
          if (next === "domestic" || next === "cross-border") {
            handleScopeChange(next);
          }
        }}
      >
        <Tabs.List aria-label="신고 유형">
          <Tabs.Tab id="domestic">
            국내 프로필 신고
            <Tabs.Indicator />
          </Tabs.Tab>
          <Tabs.Tab id="cross-border">
            <CrossBorderIcon size={15} />
            한일(크로스보더) 신고
            <Tabs.Indicator />
          </Tabs.Tab>
        </Tabs.List>
      </Tabs>

      {reportScope === 'cross-border' && (
        <Alert status="accent" className="mb-6">
          <Alert.Content>
            한일 매칭·채팅 크로스보더 신고 통합 큐(<code>kr.cross_schema_reports</code> + <code>jp.cross_schema_reports</code>)입니다. 상단 국가 설정과 무관하게 🇰🇷→🇯🇵 및 🇯🇵→🇰🇷 신고를 모두 조회합니다.
          </Alert.Content>
        </Alert>
      )}

      {crossBorderApiPending && (
        <Alert status="warning" role="status" className="mb-6">
          <Alert.Content>
            한일 신고 어드민 API(<code>/admin/v2/reports/cross-border</code>)가 아직 백엔드에 배포되지 않았습니다. Track 1 API 반영 후 조회·조치가 활성화됩니다.
          </Alert.Content>
        </Alert>
      )}

      {error && (<aside role="alert" className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </aside>)}

      <section className="mb-6 rounded-xl border bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold">필터</h2>
        <div className={`grid grid-cols-1 gap-4 ${reportScope === 'cross-border' ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
          <Select value={statusFilter} aria-label={"상태"} onChange={(key) => {
            const value = String(key ?? "");
            (handleStatusFilterChange)({ target: { value: value }, currentTarget: { value: value } } as never);
        }}><Label>상태</Label><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
                <ListBox.Item id={""} textValue={"전체"}>전체</ListBox.Item>
                <ListBox.Item id={"pending"} textValue={"대기중"}>대기중</ListBox.Item>
                <ListBox.Item id={"reviewing"} textValue={"검토중"}>검토중</ListBox.Item>
                <ListBox.Item id={"resolved"} textValue={"처리완료"}>처리완료</ListBox.Item>
                <ListBox.Item id={"rejected"} textValue={"반려"}>반려</ListBox.Item>
              </ListBox></Select.Popover></Select>
          {reportScope === 'cross-border' && (
            <Select
              value={directionFilter}
              aria-label="신고 방향"
              onChange={(key) => {
                const value = String(key ?? "all") as CrossBorderDirection;
                setDirectionFilter(value);
                setPage(0);
              }}
            >
              <Label>신고 방향</Label>
              <Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger>
              <Select.Popover>
                <ListBox>
                  <ListBox.Item id="all" textValue="전체 방향">전체 방향</ListBox.Item>
                  <ListBox.Item id="kr_to_jp" textValue="🇰🇷 한국 → 🇯🇵 일본">🇰🇷 한국 → 🇯🇵 일본</ListBox.Item>
                  <ListBox.Item id="jp_to_kr" textValue="🇯🇵 일본 → 🇰🇷 한국">🇯🇵 일본 → 🇰🇷 한국</ListBox.Item>
                </ListBox>
              </Select.Popover>
            </Select>
          )}
          <TextField><Label>{"신고자 이름"}</Label><Input value={reporterNameFilter} onChange={handleReporterNameFilterChange} placeholder="신고자 이름 검색"></Input></TextField>
          <TextField><Label>{"피신고자 이름"}</Label><Input value={reportedNameFilter} onChange={handleReportedNameFilterChange} placeholder="피신고자 이름 검색"></Input></TextField>
        </div>
        <div className="mt-4 flex flex-wrap gap-4">
          <Checkbox isSelected={urgentOnly} onChange={checked => { setUrgentOnly(checked); setPage(0); }}><Checkbox.Content><Checkbox.Control><Checkbox.Indicator /></Checkbox.Control>긴급 신고만</Checkbox.Content></Checkbox>
          {reportScope === 'domestic' && (
            <Checkbox isSelected={slackUndeliveredOnly} onChange={checked => { setSlackUndeliveredOnly(checked); setPage(0); }}><Checkbox.Content><Checkbox.Control><Checkbox.Indicator /></Checkbox.Control>슬랙 미전달만</Checkbox.Content></Checkbox>
          )}
        </div>
      </section>

      <section>
        {loading ? (<div className="flex justify-center rounded-xl border bg-white py-12"><Spinner size="sm"></Spinner></div>) : reports.length === 0 ? (<p className="rounded-xl border bg-white py-12 text-center text-sm text-gray-500">
            {reportScope === 'cross-border' ? "한일 신고 내역이 없습니다." : "신고 내역이 없습니다."}
          </p>) : (<div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {reports.map((report) => (<ReportCard key={report.id} report={report} formatDate={formatDate} onOpen={() => void handleViewDetail(report)}></ReportCard>))}
          </div>)}

        <div className="mt-4 flex items-center justify-end gap-3"><div><Select aria-label="페이지당 행 수" value={rowsPerPage} onChange={(key) => {
            const value = String(key ?? "");
            (handleChangeRowsPerPage)({ target: { value: value }, currentTarget: { value: value } } as never);
        }} className="min-w-[120px]"><Label>페이지당 행 수</Label><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox><ListBox.Item id={5} textValue={"5"}>5</ListBox.Item><ListBox.Item id={10} textValue={"10"}>10</ListBox.Item><ListBox.Item id={25} textValue={"25"}>25</ListBox.Item><ListBox.Item id={50} textValue={"50"}>50</ListBox.Item></ListBox></Select.Popover></Select></div><Button variant="secondary" isDisabled={page <= 0} onPress={() => (handleChangePage)(null, page - 1)}>이전</Button><span className="text-sm">{page + 1} 페이지 / {totalCount}개</span><Button variant="secondary" isDisabled={(page + 1) * rowsPerPage >= totalCount} onPress={() => (handleChangePage)(null, page + 1)}>다음</Button></div>
      </section>

      <Modal.Backdrop isOpen={detailDialogOpen} onOpenChange={next => {
            if (!next)
                handleCloseDetailDialog();
        }}><Modal.Container size="lg"><Modal.Dialog style={{ width: '100%', maxWidth: 900, minWidth: 0 }}>
        <Modal.Heading>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ReportIcon></ReportIcon>
            <span className="text-lg font-semibold">
              {selectedReport?.type === 'cross_border' || reportScope === 'cross-border' ? "한일 신고 상세 정보" : "신고 상세 정보"}
            </span>
          </span>
        </Modal.Heading>
        <Modal.Body>
          {detailLoading ? (<div style={{ display: "flex", justifyContent: "center", paddingBlock: 32 }}>
              <Spinner size="sm"></Spinner>
            </div>) : selectedReport ? (<div style={{ marginTop: 16 }}>{renderDetailTabs()}</div>) : null}
        </Modal.Body>
        <Modal.Footer>
          <Button onPress={handleCloseDetailDialog} variant="tertiary">닫기</Button>
        </Modal.Footer>
      </Modal.Dialog></Modal.Container></Modal.Backdrop>

      {userDetailModalOpen && (<UserDetailModal open={userDetailModalOpen} onClose={handleCloseUserDetailModal} userId={selectedUserId} userDetail={userDetail ?? EMPTY_USER_DETAIL} loading={userDetailLoading} error={userDetailError} onRefresh={fetchReports}></UserDetailModal>)}
    </div>);
}
export default function ReportsManagement() {
    return <ReportsManagementContent></ReportsManagementContent>;
}
