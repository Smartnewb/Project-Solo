"use client";
import { Checkbox, Description, FieldError, Button, Spinner, Chip, Modal, Tabs, TextField, Label, Input, Select, ListBox } from '@heroui/react';
import { Eye as VisibilityIcon, Flag as ReportIcon, MessageCircle as ChatIcon, Image as PhotoIcon, FileText as DescriptionIcon } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from 'next/navigation';
import { Controller } from "react-hook-form";
import { useToast } from "@/shared/ui/admin/toast/toast-context";
import { useConfirm } from "@/shared/ui/admin/confirm-dialog";
import { useAdminForm } from "@/app/admin/hooks/forms";
import { reportStatusSchema, ReportStatusFormValues } from "@/app/admin/hooks/forms/schemas/report.schema";
import AdminService from "@/app/services/admin";
import type { ReportHistoryEntry } from '@/app/services/admin';
import { safeToLocaleDateString } from '@/app/utils/formatters';
import { sanitizeUrl } from '@/shared/lib/safe-url';
import { ReportAvatar } from "./report-avatar";
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
}
interface Reported {
    id: string;
    name: string;
    email: string;
    phoneNumber: string;
    age: number | null;
    gender: "MALE" | "FEMALE" | null;
    profileImageUrl: string;
}
interface Report {
    id: string;
    reporter: Reporter;
    reported: Reported;
    reason: string;
    description: string | null;
    evidenceImages: string[];
    severity?: "urgent" | "normal" | null;
    category?: string | null;
    slackDelivered?: boolean;
    reportCount?: number;
    status: "pending" | "reviewing" | "resolved" | "rejected";
    createdAt: string;
    updatedAt: string | null;
    chatRoomId?: string;
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
    messageType: string;
    mediaUrl?: string;
    createdAt: string;
}
interface ChatHistoryResponse {
    messages: ChatMessage[];
    maleUser: {
        id: string;
        name: string;
    };
    femaleUser: {
        id: string;
        name: string;
    };
    pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
    };
}
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
function getDefaultActionForStatus(status: ReportStatus | 'dismissed'): ReportAction {
    if (status === 'rejected' || status === 'dismissed')
        return 'dismissed';
    if (status === 'resolved')
        return 'warned';
    return 'escalated';
}
// 로딩/오류 중에도 모달을 열어 상태를 보여주기 위한 빈 상세(참조 고정).
const EMPTY_USER_DETAIL = {} as UserDetail;
const REASONS_REQUIRING_PROFILE_IMAGES = ["허위 프로필", "부적절한 사진"];
function ReportsManagementContent() {
    const toast = useToast();
    const confirm = useConfirm();
    const searchParams = useSearchParams();
    const deepLinkedReportId = searchParams?.get('reportId') ?? null;
    const lastOpenedReportIdRef = useRef<string | null>(null);
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [statusFilter, setStatusFilter] = useState<string>("");
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
    const [statusUpdating, setStatusUpdating] = useState(false);
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
    const openReportDetail = useCallback(async (reportId: string, fallbackReport?: Report) => {
        setDetailDialogOpen(true);
        setDetailLoading(true);
        setActiveTab(0);
        // 이전 신고에서 입력한 제재 옵션이 다음 신고로 넘어가지 않게 초기화한다.
        setStatusFormValue('suspendDays', 7);
        setStatusFormValue('suspendPermanent', false);
        setStatusFormValue('approverId', '');
        setChatHistory(null);
        setProfileImages([]);
        setReportHistory([]);
        try {
            const [detailResult, historyResult] = await Promise.allSettled([
                AdminService.reports.getProfileReportDetail(reportId),
                AdminService.reports.getProfileReportHistory(reportId),
            ]);
            const detailResponse = detailResult.status === 'fulfilled' ? detailResult.value : null;
            const nextHistory = historyResult.status === 'fulfilled' ? historyResult.value : [];
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
                : (detailResponse as ReportDetail);
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
    }, [setStatusFormValue]);
    const fetchReports = async () => {
        try {
            setLoading(true);
            setError(null);
            const params = new URLSearchParams();
            params.append("page", (page + 1).toString());
            params.append("limit", rowsPerPage.toString());
            if (statusFilter) {
                params.append("status", statusFilter);
            }
            if (urgentOnly) params.append("urgent", "true");
            if (slackUndeliveredOnly) params.append("slackUndelivered", "true");
            if (reporterNameFilter.trim()) {
                params.append("reporterName", reporterNameFilter.trim());
            }
            if (reportedNameFilter.trim()) {
                params.append("reportedName", reportedNameFilter.trim());
            }
            const response = await AdminService.getProfileReports(params);
            if (response?.items) {
                setReports(response.items);
                setTotalCount(response.meta?.total ?? 0);
            }
            else {
                setReports([]);
                setTotalCount(0);
            }
        }
        catch {
            setError("신고 목록을 불러오는데 실패했습니다.");
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchReports();
    }, [page, rowsPerPage, statusFilter, urgentOnly, slackUndeliveredOnly, reporterNameFilter, reportedNameFilter]);
    useEffect(() => {
        if (!deepLinkedReportId) {
            lastOpenedReportIdRef.current = null;
            return;
        }
        if (lastOpenedReportIdRef.current === deepLinkedReportId) {
            return;
        }
        lastOpenedReportIdRef.current = deepLinkedReportId;
        void openReportDetail(deepLinkedReportId);
    }, [deepLinkedReportId, openReportDetail]);
    useEffect(() => {
        if (!watchedStatus)
            return;
        setStatusFormValue('action', getDefaultActionForStatus(watchedStatus));
    }, [setStatusFormValue, watchedStatus]);
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
        await openReportDetail(report.id, report);
    };
    const handleCloseDetailDialog = () => {
        setDetailDialogOpen(false);
        setSelectedReport(null);
        setChatHistory(null);
        setProfileImages([]);
        setReportHistory([]);
        setActiveTab(0);
    };
    const handleLoadChatHistory = useCallback(async () => {
        if (!selectedReport?.chatRoomId)
            return;
        setChatLoading(true);
        try {
            const response = await AdminService.reports.getChatHistory(selectedReport.chatRoomId);
            setChatHistory(response);
        }
        catch {
            toast.error("채팅 내역을 불러오는데 실패했습니다.");
        }
        finally {
            setChatLoading(false);
        }
    }, [selectedReport?.chatRoomId]);
    const handleLoadProfileImages = useCallback(async () => {
        if (!selectedReport?.reported?.id)
            return;
        setProfileImagesLoading(true);
        try {
            const images = await AdminService.reports.getUserProfileImages(selectedReport.reported.id);
            setProfileImages(images);
        }
        catch {
            toast.error("프로필 이미지를 불러오는데 실패했습니다.");
        }
        finally {
            setProfileImagesLoading(false);
        }
    }, [selectedReport?.reported?.id]);
    const handleStatusChange = statusForm.handleFormSubmit(async (data) => {
        if (!selectedReport)
            return;
        if (data.action === 'suspended' || data.action === 'banned') {
            const actionLabel = ACTION_OPTIONS.find((option) => option.value === data.action)?.label ?? data.action;
            const duration = data.action === 'suspended'
                ? (data.suspendPermanent ? '영구' : `${data.suspendDays}일`)
                : '영구';
            const ok = await confirm({
                title: '제재 확인',
                message: `${selectedReport.reported.name}님에게 '${actionLabel}' 처리를 합니다.\n기간: ${duration}`,
                confirmText: '처리',
                severity: 'error',
            });
            if (!ok)
                return;
        }
        setStatusUpdating(true);
        try {
            await AdminService.reports.updateReportStatus(selectedReport.id, data.status, { type: 'profile', action: data.action, suspendDays: data.suspendDays as 3 | 7 | 14 | 30 | undefined, suspendPermanent: data.suspendPermanent, approverId: data.approverId });
            toast.success("상태가 변경되었습니다.");
            await openReportDetail(selectedReport.id, {
                ...selectedReport,
                status: data.status,
            });
            fetchReports();
        }
        catch {
            toast.error("상태 변경에 실패했습니다.");
        }
        finally {
            setStatusUpdating(false);
        }
    });
    const handleOpenUserDetailModal = async (userId: string) => {
        try {
            setSelectedUserId(userId);
            setUserDetailModalOpen(true);
            setUserDetailLoading(true);
            setUserDetailError(null);
            setUserDetail(null);
            const data = await AdminService.userAppearance.getUserDetails(userId);
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
    const getStatusChip = (status: string) => {
        const statusMap = {
            pending: { label: "대기중", color: "warning" as const },
            reviewing: { label: "검토중", color: "info" as const },
            resolved: { label: "처리완료", color: "success" as const },
            rejected: { label: "반려", color: "error" as const },
            dismissed: { label: "반려", color: "error" as const },
        };
        const statusInfo = statusMap[status as keyof typeof statusMap] || {
            label: status,
            color: "default" as const,
        };
        return (<Chip size="sm">{statusInfo.label}</Chip>);
    };
    const getGenderText = (gender: string | null) => {
        return gender === "MALE" ? "남성" : gender === "FEMALE" ? "여성" : "성별 —";
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
    const formatReasonDisplay = (report: Report) => {
        if (report.reason === "기타" && report.description) {
            const truncatedDesc = report.description.length > 20
                ? `${report.description.slice(0, 20)}...`
                : report.description;
            return `기타(${truncatedDesc})`;
        }
        return report.reason;
    };
    const requiresProfileImages = (reason: string) => REASONS_REQUIRING_PROFILE_IMAGES.includes(reason);
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
            return (<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (<div key={i} className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="h-32 w-24 animate-pulse rounded-lg bg-gray-200" style={{ borderRadius: 1 }}></div>
            </div>))}
        </div>);
        }
        if (profileImages.length === 0) {
            return (<p style={{ textAlign: "center" }}>
          프로필 이미지가 없습니다.
        </p>);
        }
        return (<div className="grid grid-cols-2 gap-3">
        {profileImages.map((imageUrl, index) => (<div key={index}>
            <Button variant="tertiary" aria-label="이미지 확대" onPress={() => openExternalUrl(imageUrl)}><img src={imageUrl} alt={`프로필 이미지 ${index + 1}`}  style={{ width: "100%", height: 200, objectFit: "cover", borderRadius: 1, cursor: "pointer" }}/></Button>
          </div>))}
      </div>);
    };
    const renderDetailTabs = () => {
        if (!selectedReport)
            return null;
        const showChatTab = Boolean(selectedReport.chatRoomId);
        const showProfileImagesTab = requiresProfileImages(selectedReport.reason);
        const tabs = [{ label: "기본 정보", icon: <DescriptionIcon></DescriptionIcon> }];
        if (showChatTab) {
            tabs.push({ label: "채팅 내역", icon: <ChatIcon></ChatIcon> });
        }
        if (showProfileImagesTab) {
            tabs.push({ label: "피신고자 프로필 이미지", icon: <PhotoIcon></PhotoIcon> });
        }
        const hasTabs = tabs.length > 1;
        return (<>
        {hasTabs && (<Tabs style={{ marginBottom: 16 }} selectedKey={activeTab} onSelectionChange={newValue => setActiveTab(Number(newValue))}><Tabs.List aria-label="관리 항목">
            {tabs.map((tab, index) => (<Tabs.Tab key={index} id={index}>{tab.icon}{tab.label}<Tabs.Indicator></Tabs.Indicator></Tabs.Tab>))}
          </Tabs.List></Tabs>)}

        {activeTab === 0 && renderBasicInfo()}

        {showChatTab && activeTab === 1 && (<div>
            {!chatHistory ? (<div style={{ textAlign: "center", paddingBlock: 32 }}>
                <Button onPress={handleLoadChatHistory} isDisabled={chatLoading} variant="primary">{<ChatIcon></ChatIcon>}
                  {chatLoading ? (<Spinner size="sm"></Spinner>) : ("채팅 내역 불러오기")}
                </Button>
              </div>) : (renderChatMessages())}
          </div>)}

        {showProfileImagesTab && activeTab === (showChatTab ? 2 : 1) && (<div>
            {profileImages.length === 0 && !profileImagesLoading ? (<div style={{ textAlign: "center", paddingBlock: 32 }}>
                <Button onPress={handleLoadProfileImages} isDisabled={profileImagesLoading} variant="primary">{<PhotoIcon></PhotoIcon>}
                  {profileImagesLoading ? (<Spinner size="sm"></Spinner>) : ("프로필 이미지 불러오기")}
                </Button>
              </div>) : (renderProfileImagesGrid())}
          </div>)}
      </>);
    };
    const renderBasicInfo = () => {
        if (!selectedReport)
            return null;
        const latestReview = reportHistory[0] ?? null;
        return (<div>
        <div className="rounded-xl border p-4" style={{ marginBottom: 24 }}>
          <div className="p-4">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <h2 className="text-lg font-semibold">신고 정보</h2>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <Controller name="status" control={statusForm.control} render={({ field }) => (<div style={{ minWidth: 140 }}>
                      <Select {...field} aria-label={"상태 변경"} className="min-w-[120px]"><Label>상태 변경</Label><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
                        {STATUS_OPTIONS.map((option) => (<ListBox.Item key={option.value} id={option.value} textValue={String(option.label)}>
                            {option.label}
                          </ListBox.Item>))}
                      </ListBox></Select.Popover></Select>
                    </div>)}></Controller>
                <Controller name="action" control={statusForm.control} render={({ field }) => (<div style={{ minWidth: 140 }}>
                      <Select {...field} aria-label={"처리 액션"} className="min-w-[120px]"><Label>처리 액션</Label><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
                        {ACTION_OPTIONS.map((option) => (<ListBox.Item key={option.value} id={option.value} textValue={String(option.label)}>
                            {option.label}
                          </ListBox.Item>))}
                      </ListBox></Select.Popover></Select>
                    </div>)}></Controller>
                {watchedAction === 'suspended' && <><Controller name="suspendDays" control={statusForm.control} render={({field}) => <Select value={String(field.value ?? 7)} onChange={key => field.onChange(Number(key))} isDisabled={statusForm.watch('suspendPermanent') === true}><Label>정지 기간</Label><Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger><Select.Popover><ListBox>{[3,7,14,30].map(days => <ListBox.Item key={days} id={String(days)} textValue={`${days}일`}>{days}일</ListBox.Item>)}</ListBox></Select.Popover></Select>} /><Controller name="suspendPermanent" control={statusForm.control} render={({field}) => <Checkbox isSelected={field.value === true} onChange={field.onChange}><Checkbox.Content><Checkbox.Control><Checkbox.Indicator /></Checkbox.Control>영구 정지</Checkbox.Content></Checkbox>} /></>}
                {watchedAction === 'banned' && <Controller name="approverId" control={statusForm.control} render={({field,fieldState}) => <TextField isInvalid={!!fieldState.error}><Label>승인자 관리자 ID (2인 승인)</Label><Input {...field} value={field.value ?? ''} placeholder="다른 관리자의 user id" /><Description>영구 차단은 본인 외 다른 관리자 승인이 필요합니다</Description><FieldError>{fieldState.error?.message}</FieldError></TextField>} />}
                <Button onPress={() => void handleStatusChange()} isDisabled={statusUpdating ||
                (statusForm.watch("status") === selectedReport.status &&
                    statusForm.watch('action') === getDefaultActionForStatus(selectedReport.status))} variant="primary">
                  {statusUpdating ? <Spinner size="sm"></Spinner> : "변경"}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="min-w-0">
                <p>
                  신고 ID
                </p>
                <p>
                  {selectedReport.id}
                </p>
              </div>
              <div className="min-w-0">
                <p>
                  현재 상태
                </p>
                <div style={{ marginTop: 4 }}>
                  {getStatusChip(selectedReport.status)}
                </div>
              </div>
              <div className="min-w-0">
                <p>
                  신고일시
                </p>
                <p>
                  {formatDate(selectedReport.createdAt)}
                </p>
              </div>
              <div className="min-w-0">
                <p>
                  최종 수정일시
                </p>
                <p>
                  {latestReview?.createdAt
                ? formatDate(latestReview.createdAt)
                : selectedReport.updatedAt
                    ? formatDate(selectedReport.updatedAt)
                    : "없음"}
                </p>
              </div>
              <div className="min-w-0">
                <p>
                  신고 사유
                </p>
                <p>{selectedReport.reason}</p>
              </div>
              {selectedReport.description && (<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <p>
                    상세 설명
                  </p>
                  <p style={{ whiteSpace: "pre-wrap", backgroundColor: "#f5f5f5", padding: 12, borderRadius: 1, marginTop: 4 }}>
                    {selectedReport.description}
                  </p>
                </div>)}
            </div>
          </div>
        </div>

        {latestReview && (<div className="rounded-xl border p-4" style={{ marginBottom: 24 }}>
            <div className="p-4">
              <h2 className="text-lg font-semibold">
                처리 이력
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2" style={{ marginBottom: reportHistory.length > 1 ? 2 : 0 }}>
                <div className="min-w-0">
                  <p>
                    최근 처리자
                  </p>
                  <p>
                    {latestReview.reviewerName || latestReview.reviewerId || '-'}
                  </p>
                </div>
                <div className="min-w-0">
                  <p>
                    최근 처리 시각
                  </p>
                  <p>
                    {latestReview.createdAt ? formatDate(latestReview.createdAt) : '-'}
                  </p>
                </div>
                <div className="min-w-0">
                  <p>
                    최근 처리 결과
                  </p>
                  <p>
                    {getReviewActionLabel(latestReview.action)}
                  </p>
                </div>
                <div className="min-w-0">
                  <p>
                    상태 변경
                  </p>
                  <p>
                    {latestReview.previousStatus} → {latestReview.nextStatus}
                  </p>
                </div>
                {latestReview.note && (<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <p>
                      처리 메모
                    </p>
                    <p style={{ whiteSpace: "pre-wrap", backgroundColor: "#f5f5f5", padding: 12, borderRadius: 1, marginTop: 4 }}>
                      {latestReview.note}
                    </p>
                  </div>)}
              </div>

              {reportHistory.length > 1 && (<div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {reportHistory.map((historyItem) => (<div key={historyItem.id} style={{ border: '1px solid #e0e0e0', borderRadius: 1, padding: 12 }}>
                      <p style={{ fontWeight: 600 }}>
                        {getReviewActionLabel(historyItem.action)}
                      </p>
                      <p style={{ display: 'block', marginTop: 4 }}>
                        {(historyItem.reviewerName || historyItem.reviewerId || '알 수 없는 처리자')}
                        {historyItem.createdAt ? ` · ${formatDate(historyItem.createdAt)}` : ''}
                      </p>
                      {historyItem.note && (<p style={{ marginTop: 8 }}>
                          {historyItem.note}
                        </p>)}
                    </div>))}
                </div>)}
            </div>
          </div>)}

        <Button variant="tertiary" aria-label="사용자 상세" onPress={() => handleOpenUserDetailModal(selectedReport.reporter.id)} className="rounded-xl border p-4" style={{ marginBottom: 24, cursor: "pointer", transition: "box-shadow 0.2s" }}>
          <div className="p-4">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 className="text-lg font-semibold">
                신고자 정보
              </h2>
              <p>
                클릭하여 상세 보기
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="min-w-0">
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <ReportAvatar src={selectedReport.reporter.profileImageUrl}></ReportAvatar>
                </div>
              </div>
              <div className="min-w-0">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="min-w-0">
                    <p>
                      이름
                    </p>
                    <p>
                      {selectedReport.reporter.name}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p>
                      이메일
                    </p>
                    <p>
                      {selectedReport.reporter.email || "-"}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p>
                      전화번호
                    </p>
                    <p>
                      {selectedReport.reporter.phoneNumber || "-"}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p>
                      나이/성별
                    </p>
                    <p>
                      {selectedReport.reporter.age
                ? `${selectedReport.reporter.age}세`
                : "-"}{" "}
                      / {getGenderText(selectedReport.reporter.gender)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Button>

        <Button variant="tertiary" aria-label="사용자 상세" onPress={() => handleOpenUserDetailModal(selectedReport.reported.id)} className="rounded-xl border p-4" style={{ marginBottom: 24, cursor: "pointer", transition: "box-shadow 0.2s" }}>
          <div className="p-4">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 className="text-lg font-semibold">
                피신고자 정보
              </h2>
              <p>
                클릭하여 상세 보기
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="min-w-0">
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <ReportAvatar src={selectedReport.reported.profileImageUrl}></ReportAvatar>
                </div>
              </div>
              <div className="min-w-0">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="min-w-0">
                    <p>
                      이름
                    </p>
                    <p>
                      {selectedReport.reported.name}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p>
                      이메일
                    </p>
                    <p>
                      {selectedReport.reported.email || "-"}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p>
                      전화번호
                    </p>
                    <p>
                      {selectedReport.reported.phoneNumber || "-"}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p>
                      나이/성별
                    </p>
                    <p>
                      {selectedReport.reported.age
                ? `${selectedReport.reported.age}세`
                : "-"}{" "}
                      / {getGenderText(selectedReport.reported.gender)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Button>

        {selectedReport.evidenceImages &&
                selectedReport.evidenceImages.length > 0 && (<div className="rounded-xl border p-4">
              <div className="p-4">
                <h2 className="text-lg font-semibold">
                  증거 이미지
                </h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {selectedReport.evidenceImages.map((imageUrl, index) => (<div key={index} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Button variant="tertiary" aria-label="이미지 확대" onPress={() => openExternalUrl(imageUrl)}><img src={imageUrl} alt={`증거 이미지 ${index + 1}`}  style={{ width: "100%", height: 200, objectFit: "cover", borderRadius: 1, border: "1px solid #e0e0e0", cursor: "pointer" }}/></Button>
                    </div>))}
                </div>
              </div>
            </div>)}
      </div>);
    };
    return (<div style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
        <ReportIcon style={{ fontSize: 36, marginRight: 16, color: "var(--accent)" }}></ReportIcon>
        <p style={{ fontWeight: 600 }}>
          프로필 신고 관리
        </p>
      </div>

      {error && (<aside role="alert" className="rounded-lg border p-3" style={{ marginBottom: 24 }}>
          {error}
        </aside>)}

      <section style={{ padding: 16, marginBottom: 24 }} className="rounded-xl border bg-white p-4">
        <h2 className="text-lg font-semibold">
          필터
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="min-w-0">
            <div>
              <Select value={statusFilter} aria-label={"상태"} onChange={(key) => {
            const value = String(key ?? "");
            (handleStatusFilterChange)({ target: { value: value }, currentTarget: { value: value } } as never);
        }} className="min-w-[120px]"><Label>상태</Label><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
                <ListBox.Item id={""} textValue={"\uC804\uCCB4"}>전체</ListBox.Item>
                <ListBox.Item id={"pending"} textValue={"\uB300\uAE30\uC911"}>대기중</ListBox.Item>
                <ListBox.Item id={"reviewing"} textValue={"\uAC80\uD1A0\uC911"}>검토중</ListBox.Item>
                <ListBox.Item id={"resolved"} textValue={"\uCC98\uB9AC\uC644\uB8CC"}>처리완료</ListBox.Item>
                <ListBox.Item id={"rejected"} textValue={"\uBC18\uB824"}>반려</ListBox.Item>
              </ListBox></Select.Popover></Select>
            </div>
          </div>
          <div className="min-w-0">
            <TextField className="mb-4"><Label>{"신고자 이름"}</Label><Input value={reporterNameFilter} onChange={handleReporterNameFilterChange} placeholder="신고자 이름 검색"></Input></TextField>
          </div>
          <div className="min-w-0">
            <TextField className="mb-4"><Label>{"피신고자 이름"}</Label><Input value={reportedNameFilter} onChange={handleReportedNameFilterChange} placeholder="피신고자 이름 검색"></Input></TextField>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-3"><Checkbox isSelected={urgentOnly} onChange={checked => { setUrgentOnly(checked); setPage(0); }}><Checkbox.Content><Checkbox.Control><Checkbox.Indicator /></Checkbox.Control>긴급 신고만</Checkbox.Content></Checkbox><Checkbox isSelected={slackUndeliveredOnly} onChange={checked => { setSlackUndeliveredOnly(checked); setPage(0); }}><Checkbox.Content><Checkbox.Control><Checkbox.Indicator /></Checkbox.Control>슬랙 미전달만</Checkbox.Content></Checkbox></div>
      <section className="rounded-xl border bg-white p-4">
        <div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr className="border-b">
                <th scope="col" className="border-b px-4 py-3">신고 ID</th>
                <th scope="col" className="border-b px-4 py-3">신고자</th>
                <th scope="col" className="border-b px-4 py-3">피신고자</th>
                <th scope="col" className="border-b px-4 py-3">신고 사유</th>
                <th scope="col" className="border-b px-4 py-3">상태</th>
                <th scope="col" className="border-b px-4 py-3">신고일시</th>
                <th scope="col" className="border-b px-4 py-3">액션</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (<tr className="border-b">
                  <td colSpan={7} className="border-b px-4 py-3">
                    <Spinner size="sm"></Spinner>
                  </td>
                </tr>) : reports.length === 0 ? (<tr className="border-b">
                  <td colSpan={7} className="border-b px-4 py-3">
                    신고 내역이 없습니다.
                  </td>
                </tr>) : (reports.map((report) => (<tr key={report.id} className={`border-b ${report.severity === 'urgent' ? 'bg-red-50' : ''}`}>
                    <td className="border-b px-4 py-3">
                      <p>
                        {report.id.slice(0, 8)}...{report.severity === 'urgent' && <Chip size="sm">긴급</Chip>}{report.slackDelivered === false && <span title="슬랙 미전달 — 신고는 접수됐지만 CS 알림 전송에 실패했습니다" aria-label="슬랙 미전달">알림 실패</span>}
                      </p>
                    </td>
                    <td className="border-b px-4 py-3">
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <ReportAvatar src={report.reporter.profileImageUrl}></ReportAvatar>
                        <div>
                          <p>
                            {report.reporter.name}
                          </p>
                          <p>
                            {getGenderText(report.reporter.gender)},{" "}
                            {report.reporter.age != null ? `${report.reporter.age}세` : "나이 —"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="border-b px-4 py-3">
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <ReportAvatar src={report.reported.profileImageUrl}></ReportAvatar>
                        <div>
                          <p>
                            {report.reported.name}{(report.reportCount ?? 0) > 1 && <Chip size="sm">누적 {report.reportCount}건</Chip>}
                          </p>
                          <p>
                            {getGenderText(report.reported.gender)},{" "}
                            {report.reported.age != null ? `${report.reported.age}세` : "나이 —"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="border-b px-4 py-3">
                      <p>
                        {formatReasonDisplay(report)}
                      </p>
                    </td>
                    <td className="border-b px-4 py-3">{getStatusChip(report.status)}</td>
                    <td className="border-b px-4 py-3">
                      <p>
                        {formatDate(report.createdAt)}
                      </p>
                    </td>
                    <td className="border-b px-4 py-3">
	                      <Button onPress={() => handleViewDetail(report)} aria-label={`${report.reported.name} 신고 상세 보기`} variant="tertiary" isIconOnly={true}>
                        <VisibilityIcon></VisibilityIcon>
                      </Button>
                    </td>
                  </tr>)))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-end gap-3 border-t p-4"><div><Select aria-label="페이지당 행 수" value={rowsPerPage} onChange={(key) => {
            const value = String(key ?? "");
            (handleChangeRowsPerPage)({ target: { value: value }, currentTarget: { value: value } } as never);
        }} className="min-w-[120px]"><Label>페이지당 행 수</Label><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox><ListBox.Item id={5} textValue={"5"}>5</ListBox.Item><ListBox.Item id={10} textValue={"10"}>10</ListBox.Item><ListBox.Item id={25} textValue={"25"}>25</ListBox.Item><ListBox.Item id={50} textValue={"50"}>50</ListBox.Item></ListBox></Select.Popover></Select></div><Button variant="secondary" isDisabled={page <= 0} onPress={() => (handleChangePage)(null, page - 1)}>이전</Button><span>{page + 1} 페이지 / {totalCount}개</span><Button variant="secondary" isDisabled={(page + 1) * rowsPerPage >= totalCount} onPress={() => (handleChangePage)(null, page + 1)}>다음</Button></div>
      </section>

      <Modal.Backdrop isOpen={detailDialogOpen} onOpenChange={next => {
            if (!next)
                handleCloseDetailDialog();
        }}><Modal.Container size="lg"><Modal.Dialog style={{ width: '100%', maxWidth: 900, minWidth: 0 }}>
        <Modal.Heading>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ReportIcon></ReportIcon>
            <span className="text-lg font-semibold">신고 상세 정보</span>
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
