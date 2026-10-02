'use client';
import { Button, Spinner, Chip, Modal, TextField, Label, Input, Select, ListBox, Checkbox } from '@heroui/react';
import { RefreshCw as RefreshIcon, Search as SearchIcon, CircleCheck as CheckCircleIcon, CircleX as CancelIcon, Play as PlayArrowIcon, Eye as VisibilityIcon, TriangleAlert as WarningIcon } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import { scheduledMatchingService } from '../service';
import { useToast } from '@/shared/ui/admin/toast';
import { safeToLocaleString } from '@/app/utils/formatters';
import type { ManualMatchType, MatchPriority, MatchingStatus, ManualMatching as ManualMatchingType, ManualMatchingRequest, ValidateMatchingResponse, ManualMatchingListParams, } from '../types';
const MATCH_TYPE_OPTIONS: {
    value: ManualMatchType;
    label: string;
}[] = [
    { value: 'cs_support', label: 'CS 대응' },
    { value: 'test', label: '테스트' },
    { value: 'promotion', label: '프로모션' },
    { value: 'recovery', label: '매칭 복구' },
    { value: 'vip', label: 'VIP 특별 매칭' },
    { value: 'other', label: '기타' },
];
const PRIORITY_OPTIONS: {
    value: MatchPriority;
    label: string;
}[] = [
    { value: 'low', label: '낮음' },
    { value: 'normal', label: '보통' },
    { value: 'high', label: '높음' },
    { value: 'urgent', label: '긴급' },
];
const STATUS_OPTIONS: {
    value: MatchingStatus;
    label: string;
    color: 'default' | 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
}[] = [
    { value: 'scheduled', label: '예약됨', color: 'info' },
    { value: 'processing', label: '처리 중', color: 'warning' },
    { value: 'completed', label: '완료', color: 'success' },
    { value: 'failed', label: '실패', color: 'error' },
    { value: 'cancelled', label: '취소됨', color: 'default' },
];
const getStatusChip = (status: MatchingStatus) => {
    const option = STATUS_OPTIONS.find((o) => o.value === status);
    return (<Chip size="sm">{option?.label || status}</Chip>);
};
const getMatchTypeLabel = (type: ManualMatchType) => {
    return MATCH_TYPE_OPTIONS.find((o) => o.value === type)?.label || type;
};
const formatDateTime = (dateString: string) => {
    return safeToLocaleString(dateString);
};
export default function ManualMatching() {
    const toast = useToast();
    // Form state
    const [userId1, setUserId1] = useState('');
    const [userId2, setUserId2] = useState('');
    const [scheduledAt, setScheduledAt] = useState('');
    const [matchType, setMatchType] = useState<ManualMatchType>('cs_support');
    const [reason, setReason] = useState('');
    const [priority, setPriority] = useState<MatchPriority>('normal');
    const [notifyUsers, setNotifyUsers] = useState(true);
    const [skipValidation, setSkipValidation] = useState(false);
    // Validation state
    const [validationResult, setValidationResult] = useState<ValidateMatchingResponse | null>(null);
    const [validating, setValidating] = useState(false);
    // List state
    const [matchings, setMatchings] = useState<ManualMatchingType[]>([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [total, setTotal] = useState(0);
    const [statusFilter, setStatusFilter] = useState<MatchingStatus | ''>('');
    const [typeFilter, setTypeFilter] = useState<ManualMatchType | ''>('');
    // UI state
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [detailDialog, setDetailDialog] = useState<ManualMatchingType | null>(null);
    const [cancelDialog, setCancelDialog] = useState<ManualMatchingType | null>(null);
    const [executeDialog, setExecuteDialog] = useState<ManualMatchingType | null>(null);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelling, setCancelling] = useState(false);
    const [executing, setExecuting] = useState(false);
    const matchingTargetLabel = (m: ManualMatchingType) => m.users.map((u) => u.name).join(' · ');
    const closeCancelDialog = () => {
        setCancelDialog(null);
        setCancelReason('');
    };
    const openCancelDialog = (m: ManualMatchingType) => {
        setCancelReason('');
        setCancelDialog(m);
    };
    // Fetch list
    const fetchMatchings = useCallback(async () => {
        try {
            setLoading(true);
            const params: ManualMatchingListParams = {
                page: page + 1,
                limit: rowsPerPage,
            };
            if (statusFilter)
                params.status = statusFilter;
            if (typeFilter)
                params.matchType = typeFilter;
            const response = await scheduledMatchingService.getManualMatchingList(params);
            setMatchings(response.data);
            setTotal(response.pagination.total);
        }
        catch {
            setError('수동 매칭 목록을 불러오는데 실패했습니다.');
        }
        finally {
            setLoading(false);
        }
    }, [page, rowsPerPage, statusFilter, typeFilter]);
    useEffect(() => {
        fetchMatchings();
    }, [fetchMatchings]);
    // Validate users
    const handleValidate = async () => {
        if (!userId1.trim() || !userId2.trim()) {
            setError('두 유저의 ID를 모두 입력해주세요.');
            return;
        }
        try {
            setValidating(true);
            setError(null);
            setValidationResult(null);
            const result = await scheduledMatchingService.validateManualMatching([
                userId1.trim(),
                userId2.trim(),
            ]);
            setValidationResult(result);
            if (!result.isValid) {
                setError(result.blockedReasons.join(', '));
            }
        }
        catch {
            setError('유저 검증에 실패했습니다.');
        }
        finally {
            setValidating(false);
        }
    };
    // Create manual matching
    const handleCreate = async () => {
        if (!userId1.trim() || !userId2.trim()) {
            setError('두 유저의 ID를 모두 입력해주세요.');
            return;
        }
        if (!scheduledAt) {
            setError('매칭 예정 시간을 입력해주세요.');
            return;
        }
        if (!reason.trim()) {
            setError('매칭 사유를 입력해주세요.');
            return;
        }
        try {
            setCreating(true);
            setError(null);
            setSuccess(null);
            const request: ManualMatchingRequest = {
                userIds: [userId1.trim(), userId2.trim()],
                scheduledAt: new Date(scheduledAt).toISOString(),
                matchType,
                reason: reason.trim(),
                priority,
                notifyUsers,
                skipValidation,
            };
            await scheduledMatchingService.createManualMatching(request);
            setSuccess('수동 매칭이 생성되었습니다.');
            // Reset form
            setUserId1('');
            setUserId2('');
            setScheduledAt('');
            setReason('');
            setValidationResult(null);
            // Refresh list
            fetchMatchings();
        }
        catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : '수동 매칭 생성에 실패했습니다.';
            setError(errorMessage);
        }
        finally {
            setCreating(false);
        }
    };
    // Cancel matching
    const handleCancel = async () => {
        if (!cancelDialog || !cancelReason.trim() || cancelling)
            return;
        try {
            setCancelling(true);
            await scheduledMatchingService.cancelManualMatching(cancelDialog.id, cancelReason.trim());
            setSuccess('매칭이 취소되었습니다.');
            closeCancelDialog();
            fetchMatchings();
        }
        catch {
            setError('매칭 취소에 실패했습니다.');
            toast.error('매칭 취소에 실패했습니다.');
        }
        finally {
            setCancelling(false);
        }
    };
    // Execute matching immediately
    const handleExecute = async () => {
        if (!executeDialog || executing)
            return;
        try {
            setExecuting(true);
            await scheduledMatchingService.executeManualMatching(executeDialog.id);
            setSuccess('매칭이 실행되었습니다.');
            setExecuteDialog(null);
            fetchMatchings();
        }
        catch {
            setError('매칭 실행에 실패했습니다.');
            toast.error('매칭 실행에 실패했습니다.');
        }
        finally {
            setExecuting(false);
        }
    };
    // Get default scheduled time (1 hour from now)
    const getDefaultScheduledTime = () => {
        const date = new Date();
        date.setHours(date.getHours() + 1);
        date.setMinutes(0);
        date.setSeconds(0);
        return date.toISOString().slice(0, 16);
    };
    return (<div>
      <h2 className="text-lg font-semibold">
        수동 매칭
      </h2>

      {error && (<aside role="alert" className="rounded-lg border p-3" style={{ marginBottom: 16 }}>
          {error}
        </aside>)}

      {success && (<aside role="alert" className="rounded-lg border p-3" style={{ marginBottom: 16 }}>
          {success}
        </aside>)}

      {/* Create Form */}
      <section style={{ padding: 24, marginBottom: 24 }} className="rounded-xl border bg-white p-4">
        <p>
          새 수동 매칭 생성
        </p>

        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <TextField className="mb-4"><Label>{"유저 1 ID"}</Label><Input value={userId1} onChange={(e) => setUserId1(e.target.value)} placeholder="UUID 입력"></Input></TextField>
          <TextField className="mb-4"><Label>{"유저 2 ID"}</Label><Input value={userId2} onChange={(e) => setUserId2(e.target.value)} placeholder="UUID 입력"></Input></TextField>
          <Button onPress={handleValidate} isDisabled={validating || !userId1.trim() || !userId2.trim()} variant="tertiary">
            {validating ? <Spinner size="sm"></Spinner> : <SearchIcon style={{ fontSize: 16, marginRight: 4 }}></SearchIcon>}
            검증
          </Button>
        </div>

        {validationResult && (<aside role="alert" className="rounded-lg border p-3" style={{ marginBottom: 16 }}>
            <div>
              <p>
                {validationResult.isValid ? '매칭 가능' : '매칭 불가'}
              </p>
              {validationResult.users.map((u) => (<div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <p>
                    {u.name} ({u.matchingStatus})
                  </p>
                  {u.warnings.map((w, i) => (<Chip key={`${u.id}-${i}`} size="sm">{w}</Chip>))}
                </div>))}
              {validationResult.blockedReasons.length > 0 && (<p>
                  {validationResult.blockedReasons.join(', ')}
                </p>)}
            </div>
          </aside>)}

        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <TextField className="mb-4"><Label>{"매칭 예정 시간"}</Label><Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} {...{ min: getDefaultScheduledTime() }}></Input></TextField>
          <div style={{ width: 150 }}>
            <label>매칭 유형</label>
            <Select value={matchType} aria-label={"매칭 유형"} onChange={(key) => {
            const value = String(key ?? "");
            setMatchType(value as ManualMatchType);
        }} className="min-w-[120px]"><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
              {MATCH_TYPE_OPTIONS.map((opt) => (<ListBox.Item key={opt.value} id={opt.value} textValue={String(opt.label)}>
                  {opt.label}
                </ListBox.Item>))}
            </ListBox></Select.Popover></Select>
          </div>
          <div style={{ width: 120 }}>
            <label>우선순위</label>
            <Select value={priority} aria-label={"우선순위"} onChange={(key) => {
            const value = String(key ?? "");
            setPriority(value as MatchPriority);
        }} className="min-w-[120px]"><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
              {PRIORITY_OPTIONS.map((opt) => (<ListBox.Item key={opt.value} id={opt.value} textValue={String(opt.label)}>
                  {opt.label}
                </ListBox.Item>))}
            </ListBox></Select.Popover></Select>
          </div>
        </div>

        <TextField isRequired={true} className="mb-4"><Label>{"매칭 사유"}</Label><Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="예: CS 티켓 #12345 - 매칭 누락 보상" required></Input></TextField>

        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <Checkbox isSelected={notifyUsers} onChange={checked => setNotifyUsers(checked)} className="inline-flex items-center gap-2 mr-4"><Checkbox.Content><Checkbox.Control><Checkbox.Indicator></Checkbox.Indicator></Checkbox.Control>{"유저에게 알림 발송"}</Checkbox.Content></Checkbox>
          <Checkbox isSelected={skipValidation} onChange={checked => setSkipValidation(checked)} className="inline-flex items-center gap-2 mr-4"><Checkbox.Content><Checkbox.Control><Checkbox.Indicator></Checkbox.Indicator></Checkbox.Control>{<div>
                유효성 검사 스킵
                <span title="주의: 매칭 빈도, 선호도, 대학 제한 등의 검사를 건너뜁니다">
                  <WarningIcon></WarningIcon>
                </span>
              </div>}</Checkbox.Content></Checkbox>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onPress={handleCreate} isDisabled={creating} variant="tertiary">
            {creating ? <Spinner size="sm" style={{ marginRight: 8 }}></Spinner> : null}
            매칭 생성
          </Button>
        </div>
      </section>

      {/* List */}
      <section style={{ padding: 24 }} className="rounded-xl border bg-white p-4">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <p>
            수동 매칭 목록
          </p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ width: 120 }}>
              <label>상태</label>
              <Select value={statusFilter} aria-label={"상태"} onChange={(key) => {
            const value = String(key ?? "");
            setStatusFilter(value as MatchingStatus | '');
            setPage(0);
        }} className="min-w-[120px]"><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
                <ListBox.Item id={""} textValue={"\uC804\uCCB4"}>전체</ListBox.Item>
                {STATUS_OPTIONS.map((opt) => (<ListBox.Item key={opt.value} id={opt.value} textValue={String(opt.label)}>
                    {opt.label}
                  </ListBox.Item>))}
              </ListBox></Select.Popover></Select>
            </div>
            <div style={{ width: 120 }}>
              <label>유형</label>
              <Select value={typeFilter} aria-label={"유형"} onChange={(key) => {
            const value = String(key ?? "");
            setTypeFilter(value as ManualMatchType | '');
            setPage(0);
        }} className="min-w-[120px]"><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
                <ListBox.Item id={""} textValue={"\uC804\uCCB4"}>전체</ListBox.Item>
                {MATCH_TYPE_OPTIONS.map((opt) => (<ListBox.Item key={opt.value} id={opt.value} textValue={String(opt.label)}>
                    {opt.label}
                  </ListBox.Item>))}
              </ListBox></Select.Popover></Select>
            </div>
            <span title={"새로고침"}>
              <Button onPress={fetchMatchings} aria-label="수동 매칭 목록 새로고침" variant="tertiary" isIconOnly={true}>
                <RefreshIcon></RefreshIcon>
              </Button>
            </span>
          </div>
        </div>

        <div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr className="border-b">
                <th scope="col" className="border-b px-4 py-3">상태</th>
                <th scope="col" className="border-b px-4 py-3">유형</th>
                <th scope="col" className="border-b px-4 py-3">유저</th>
                <th scope="col" className="border-b px-4 py-3">예정 시간</th>
                <th scope="col" className="border-b px-4 py-3">사유</th>
                <th scope="col" className="border-b px-4 py-3">생성자</th>
                <th scope="col" className="border-b px-4 py-3">생성일</th>
                <th scope="col" className="border-b px-4 py-3">액션</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (<tr className="border-b">
                  <td colSpan={8} style={{ paddingBlock: 32 }} className="border-b px-4 py-3">
                    <Spinner size="sm"></Spinner>
                  </td>
                </tr>) : matchings.length === 0 ? (<tr className="border-b">
                  <td colSpan={8} style={{ paddingBlock: 32 }} className="border-b px-4 py-3">
                    <p>
                      조건에 맞는 수동 매칭이 없습니다.
                    </p>
                    <p style={{ marginTop: 4 }}>
                      국가나 유형 필터를 변경해 다시 확인하세요.
                    </p>
                  </td>
                </tr>) : (matchings.map((matching) => (<tr key={matching.id} className="border-b">
                    <td className="border-b px-4 py-3">{getStatusChip(matching.status)}</td>
                    <td className="border-b px-4 py-3">{getMatchTypeLabel(matching.matchType)}</td>
                    <td className="border-b px-4 py-3">
                      {matching.users.map((u) => (<Chip key={u.id} size="sm">{`${u.name} (${u.gender === 'MALE' ? '남' : '여'})`}</Chip>))}
                    </td>
                    <td className="border-b px-4 py-3">{formatDateTime(matching.scheduledAt)}</td>
                    <td className="border-b px-4 py-3">
                      <span title={matching.reason}>
                        <p style={{ maxWidth: 150, overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {matching.reason}
                        </p>
                      </span>
                    </td>
                    <td className="border-b px-4 py-3">{matching.createdBy.name}</td>
                    <td className="border-b px-4 py-3">{formatDateTime(matching.createdAt)}</td>
                    <td className="border-b px-4 py-3">
                      <span title={"상세보기"}>
                        <Button onPress={() => setDetailDialog(matching)} aria-label="수동 매칭 상세 보기" variant="tertiary" isIconOnly={true}>
                          <VisibilityIcon style={{ fontSize: 18 }}></VisibilityIcon>
                        </Button>
                      </span>
                      {matching.status === 'scheduled' && (<>
                          <span title={"즉시 실행"}>
                            <Button onPress={() => setExecuteDialog(matching)} aria-label="수동 매칭 즉시 실행" variant="tertiary" isIconOnly={true}>
                              <PlayArrowIcon style={{ fontSize: 18 }}></PlayArrowIcon>
                            </Button>
                          </span>
                          <span title={"취소"}>
                            <Button onPress={() => openCancelDialog(matching)} aria-label="수동 매칭 취소" variant="tertiary" isIconOnly={true}>
                              <CancelIcon style={{ fontSize: 18 }}></CancelIcon>
                            </Button>
                          </span>
                        </>)}
                    </td>
                  </tr>)))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-end gap-3 border-t p-4"><div><Select aria-label="페이지당 행 수" value={rowsPerPage} onChange={(key) => {
            const value = String(key ?? "");
            setRowsPerPage(parseInt(value, 10));
            setPage(0);
        }} className="min-w-[120px]"><Label>페이지당 행 수</Label><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox><ListBox.Item id={10} textValue={"10"}>10</ListBox.Item><ListBox.Item id={20} textValue={"20"}>20</ListBox.Item><ListBox.Item id={50} textValue={"50"}>50</ListBox.Item></ListBox></Select.Popover></Select></div><Button variant="secondary" isDisabled={page <= 0} onPress={() => ((_, newPage) => setPage(newPage))(null, page - 1)}>이전</Button><span>{page + 1} 페이지 / {total}개</span><Button variant="secondary" isDisabled={(page + 1) * rowsPerPage >= total} onPress={() => ((_, newPage) => setPage(newPage))(null, page + 1)}>다음</Button></div>
      </section>

      {/* Detail Dialog */}
      <Modal.Backdrop isOpen={!!detailDialog} onOpenChange={next => {
            if (!next)
                (() => setDetailDialog(null))();
        }}><Modal.Container size="lg"><Modal.Dialog style={{ width: '100%', maxWidth: 600, minWidth: 0 }}>
        {detailDialog && (<>
            <Modal.Heading>수동 매칭 상세</Modal.Heading>
            <Modal.Body>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <p>
                    ID
                  </p>
                  <p>{detailDialog.id}</p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <p>
                    상태
                  </p>
                  {getStatusChip(detailDialog.status)}
                </div>
                <hr></hr>
                <p>매칭 유저</p>
                {detailDialog.users.map((u) => (<div key={u.id} style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <Chip size="sm">{u.gender === 'MALE' ? '남' : '여'}</Chip>
                    <div>
                      <p>{u.name}</p>
                      <p>
                        {u.university}
                      </p>
                    </div>
                  </div>))}
                <hr></hr>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <p>
                    유형
                  </p>
                  <p>{getMatchTypeLabel(detailDialog.matchType)}</p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <p>
                    사유
                  </p>
                  <p>{detailDialog.reason}</p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <p>
                    예정 시간
                  </p>
                  <p>{formatDateTime(detailDialog.scheduledAt)}</p>
                </div>
                {detailDialog.executedAt && (<div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <p>
                      실행 시간
                    </p>
                    <p>{formatDateTime(detailDialog.executedAt)}</p>
                  </div>)}
                <hr></hr>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <p>
                    생성자
                  </p>
                  <p>
                    {detailDialog.createdBy.name} ({detailDialog.createdBy.email})
                  </p>
                </div>
                {detailDialog.cancelledAt && (<>
                    <hr></hr>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <p>
                        취소 시간
                      </p>
                      <p>{formatDateTime(detailDialog.cancelledAt)}</p>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <p>
                        취소 사유
                      </p>
                      <p>{detailDialog.cancelReason}</p>
                    </div>
                  </>)}
                {detailDialog.logs && detailDialog.logs.length > 0 && (<>
                    <hr></hr>
                    <p>로그</p>
                    {detailDialog.logs.map((log, i) => (<div key={i} style={{ paddingLeft: 8 }}>
                        <p>
                          {formatDateTime(log.timestamp)} - {log.actor}
                        </p>
                        <p>{log.details}</p>
                      </div>))}
                  </>)}
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button onPress={() => setDetailDialog(null)} variant="tertiary">
                닫기
              </Button>
            </Modal.Footer>
          </>)}
      </Modal.Dialog></Modal.Container></Modal.Backdrop>

      {/* Execute Dialog */}
      <Modal.Backdrop isOpen={!!executeDialog} isDismissable={!executing} isKeyboardDismissDisabled={executing} onOpenChange={next => {
            if (!next && !executing)
                (() => setExecuteDialog(null))();
        }}><Modal.Container size="lg"><Modal.Dialog style={{ width: '100%', maxWidth: 444, minWidth: 0 }}>
        <Modal.Heading>수동 매칭 즉시 실행</Modal.Heading>
        <Modal.Body>
          <p>
            {executeDialog ? `${matchingTargetLabel(executeDialog)} 매칭(예약 ${formatDateTime(executeDialog.scheduledAt)})을 지금 실행합니다. ` : ''}실행 후에는 매칭 상태가 변경됩니다.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button onPress={() => setExecuteDialog(null)} isDisabled={executing} variant="tertiary">
            닫기
          </Button>
          <Button onPress={handleExecute} isDisabled={executing} variant="primary">
            즉시 실행
          </Button>
        </Modal.Footer>
      </Modal.Dialog></Modal.Container></Modal.Backdrop>

      {/* Cancel Dialog */}
      <Modal.Backdrop isOpen={!!cancelDialog} isDismissable={!cancelling} isKeyboardDismissDisabled={cancelling} onOpenChange={next => {
            if (!next && !cancelling)
                closeCancelDialog();
        }}><Modal.Container size="lg"><Modal.Dialog style={{ width: '100%', maxWidth: 444, minWidth: 0 }}>
        <Modal.Heading>매칭 취소</Modal.Heading>
        <Modal.Body>
          <p style={{ marginBottom: 16 }}>
            {cancelDialog ? `${matchingTargetLabel(cancelDialog)} 매칭을 취소하시겠습니까?` : '이 매칭을 취소하시겠습니까?'}
          </p>
          <TextField isRequired={true} className="mb-4"><Label>{"취소 사유"}</Label><Input value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} required placeholder="취소 사유를 입력하세요"></Input></TextField>
        </Modal.Body>
        <Modal.Footer>
          <Button onPress={closeCancelDialog} isDisabled={cancelling} variant="tertiary">
            닫기
          </Button>
          <Button onPress={handleCancel} isDisabled={!cancelReason.trim() || cancelling} variant="danger">
            취소 확인
          </Button>
        </Modal.Footer>
      </Modal.Dialog></Modal.Container></Modal.Backdrop>
    </div>);
}
