// TITLE: - sms 관리 페이지
'use client';
import { Select, ListBox, Button } from '@heroui/react';
import { useMemo, useState } from 'react';
import type { RecipientCount, RecipientFilter, SmsJobType } from '@/app/services/sms';
import { useBulkSendMutation, useJobStatus } from './hooks/useBulkSendJob';
import { useRecipientCount } from './hooks/useRecipientCount';
import { useRegions, useUniversitiesByRegions } from './hooks/useRegions';
import { useToast } from '@/shared/ui/admin/toast';
import { MessageComposer } from './components/MessageComposer';
import { RecipientSelector } from './components/RecipientSelector';
import { RecipientModeToggle, RecipientMode } from './components/RecipientModeToggle';
import { UserSearchSelector } from './components/UserSearchSelector';
import { ExcludedUsersCard } from './components/ExcludedUsersCard';
import { SendConfirmModal } from './components/SendConfirmModal';
import { SmsHistoryTable } from './components/SmsHistoryTable';
import { TemplateManager } from './components/TemplateManager';
import { SmsTemplate } from './types';
import {
    ALIGO_UNIT_COST_KRW,
    euckrByteLength,
    estimateAligoCostKrw,
    isSmsTruncationRisk,
    resolveEffectiveSmsBillingType,
    SMS_BYTE_LIMIT,
    SMS_SAFE_BODY_BYTE_LIMIT,
    WEB_SENDER_PREFIX_BYTES,
} from './utils/euckr-byte-length';
function SmspageContent() {
    // === 상태관리 ===
    const [selectedTemplate, setSelectedTemplate] = useState<SmsTemplate | null>(null);
    const [currentFilter, setCurrentFilter] = useState<RecipientFilter>({});
    const [currentValidCount, setCurrentValidCount] = useState(0);
    const [message, setMessage] = useState<string>('');
    const [smsType, setSmsType] = useState<SmsJobType>('SMS');
    const [showConfirm, setShowConfirm] = useState(false);
    const [activeJobId, setActiveJobId] = useState<string | null>(null);
    const [confirmCount, setConfirmCount] = useState<RecipientCount | null>(null);
    const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);
    const [mode, setMode] = useState<RecipientMode>('filter');
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const { data: regionLookup = [] } = useRegions();
    const { data: universityLookup = [] } = useUniversitiesByRegions(currentFilter.regionCodes ?? []);
    const toast = useToast();
    const sendMutation = useBulkSendMutation();
    const jobStatus = useJobStatus(activeJobId);
    const isSending = sendMutation.isPending;
    const effectiveFilter: RecipientFilter = useMemo(() => (mode === 'userIds' ? { userIds: selectedUserIds } : currentFilter), [mode, selectedUserIds, currentFilter]);
    const effectiveCountEnabled = mode === 'userIds' ? selectedUserIds.length > 0 : true;
    const { data: effectiveCount } = useRecipientCount(effectiveFilter, effectiveCountEnabled);
    const effectiveValidCount = mode === 'userIds' ? effectiveCount?.validPhone ?? 0 : currentValidCount;
    const messageBytes = useMemo(() => euckrByteLength(message), [message]);
    const effectiveBillingType = resolveEffectiveSmsBillingType(smsType, messageBytes);
    const estimatedAligoCost = estimateAligoCostKrw(effectiveValidCount, effectiveBillingType);
    const handleFilterChange = (filter: RecipientFilter, validCount: number) => {
        setCurrentFilter(filter);
        setCurrentValidCount(validCount);
    };
    const handleModeChange = (next: RecipientMode) => {
        setMode(next);
        setIdempotencyKey(null);
    };
    const handleOpenConfirm = () => {
        if (!message.trim()) {
            toast.warning('메시지를 입력하세요.');
            return;
        }
        if (effectiveValidCount <= 0) {
            toast.warning('발송 대상이 없습니다. 조건을 확인하세요.');
            return;
        }
        if (!effectiveCount) {
            toast.info('대상자 카운트 조회 중입니다. 잠시 후 다시 시도하세요.');
            return;
        }
        setConfirmCount(effectiveCount);
        setIdempotencyKey(crypto.randomUUID());
        setShowConfirm(true);
    };
    const handleCloseConfirm = () => {
        setShowConfirm(false);
        setIdempotencyKey(null);
    };
    const handleConfirm = async () => {
        if (!idempotencyKey)
            return;
        try {
            const res = await sendMutation.mutateAsync({
                req: { filter: effectiveFilter, message, type: smsType },
                idempotencyKey,
            });
            setActiveJobId(res.jobId);
            setShowConfirm(false);
            setIdempotencyKey(null);
            toast.success(`발송 시작 (jobId: ${res.jobId}, 대상 ${res.expectedCount}명)`);
        }
        catch (e: any) {
            // 같은 키를 유지한다. 서버에는 접수됐는데 응답만 실패한 경우에도 재시도가 중복 발송되지 않는다.
            toast.error(e?.message ?? '발송 실패');
        }
    };
    // === JSX ===
    return (<div className='bg-[#F9FAFB] min-h-screen px-4 sm:px-6 md:px-8 lg:px-20 xl:px-25'>
			<div className='grid grid-cols-1 md:grid-cols-8 lg:grid-cols-10 gap-6'>
				<div className='lg:col-span-3'>
					<RecipientModeToggle mode={mode} onChange={handleModeChange} disabled={isSending}></RecipientModeToggle>
					{mode === 'filter' ? (<RecipientSelector onFilterChange={handleFilterChange}></RecipientSelector>) : (<UserSearchSelector selectedUserIds={selectedUserIds} onSelectionChange={setSelectedUserIds} disabled={isSending}></UserSearchSelector>)}
					{mode === 'userIds' && (<ExcludedUsersCard excluded={effectiveCount?.excludedUsers ?? []}></ExcludedUsersCard>)}
				</div>

				<div className='lg:col-span-7 space-y-6'>
					<TemplateManager onTemplateSelect={setSelectedTemplate}></TemplateManager>
					<MessageComposer templateId={selectedTemplate?.id} templateTitle={selectedTemplate?.title} templateContent={selectedTemplate?.content} onMessageChange={setMessage}></MessageComposer>

					<div className='border border-[#D1D5DB] bg-white rounded-lg p-4 sm:p-6'>
						<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
							<div className='flex items-center gap-2'>
								<label className='text-sm text-[#374151]'>발송 유형</label>
								<Select value={smsType} onChange={(key) => {
            const value = String(key ?? "");
            setSmsType(value as SmsJobType);
        }} className="min-w-[120px]"><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
									<ListBox.Item id={'SMS'} textValue={"SMS"}>SMS</ListBox.Item>
									<ListBox.Item id={'LMS'} textValue={"LMS"}>LMS</ListBox.Item>
								</ListBox></Select.Popover></Select>
							</div>
							<Button type='button' onPress={handleOpenConfirm} isDisabled={!effectiveValidCount ||
            !message.trim() ||
            isSending ||
            (mode === 'userIds' && selectedUserIds.length === 0)} className='px-4 py-2 rounded-md bg-[#885AEB] text-white text-sm font-medium disabled:opacity-50' variant="secondary">
								발송하기 ({effectiveValidCount}명)
							</Button>
						</div>
						{effectiveValidCount > 0 && (
							<div className='mt-2 text-xs text-gray-600'>
								예상 비용(알리고, VAT별도): ₩{estimatedAligoCost.toLocaleString()} ({effectiveValidCount.toLocaleString()}명 × {ALIGO_UNIT_COST_KRW[effectiveBillingType]}원 {effectiveBillingType})
							</div>
						)}
						{smsType === 'SMS' && messageBytes > SMS_BYTE_LIMIT && (
							<p className='mt-1.5 text-xs text-amber-700'>
								본문이 90바이트를 초과합니다. SMS 발송 시 문자가 잘리거나 LMS({ALIGO_UNIT_COST_KRW.LMS}원/건)로 과금될 수 있습니다.
							</p>
						)}
						{smsType === 'SMS' && isSmsTruncationRisk(messageBytes) && (
							<p className='mt-1.5 text-xs text-amber-700'>
								본문이 {SMS_SAFE_BODY_BYTE_LIMIT}바이트를 초과합니다({messageBytes}바이트). [Web발신]({WEB_SENDER_PREFIX_BYTES}바이트) 포함 시 {messageBytes + WEB_SENDER_PREFIX_BYTES}바이트로 90바이트를 넘어 단말에서 끝부분이 잘릴 수 있으니 {SMS_SAFE_BODY_BYTE_LIMIT}바이트 이하 축약을 권장합니다.
							</p>
						)}
						{smsType === 'LMS' && messageBytes > 0 && messageBytes <= SMS_SAFE_BODY_BYTE_LIMIT && (
							<p className='mt-1.5 text-xs text-emerald-700'>
								{SMS_SAFE_BODY_BYTE_LIMIT}바이트 이하 단문입니다. 발송 유형을 SMS({ALIGO_UNIT_COST_KRW.SMS}원/건)로 바꾸면 비용을 약 68% 절감할 수 있습니다.
							</p>
						)}

						{jobStatus.data && (<div className='mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md text-sm'>
								<div className='flex items-center justify-between mb-1'>
									<span className='font-medium'>작업 ID: {jobStatus.data.jobId}</span>
									<span className='text-xs text-gray-500'>
										{jobStatus.data.status}
									</span>
								</div>
								<div className='w-full bg-gray-200 rounded-full h-2'>
									<div className='bg-[#885AEB] h-2 rounded-full transition-all' style={{ width: `${jobStatus.data.progress}%` }}></div>
								</div>
								<div className='mt-1 text-xs text-gray-600'>
									진행률: {jobStatus.data.progress}% — 성공{' '}
									{jobStatus.data.sentCount} / 실패 {jobStatus.data.failedCount} /
									전체 {jobStatus.data.totalCount}
								</div>
							</div>)}
					</div>

					<SmsHistoryTable></SmsHistoryTable>
				</div>
			</div>

			<SendConfirmModal open={showConfirm} filter={effectiveFilter} count={confirmCount} message={message} type={smsType} regions={regionLookup} universities={universityLookup} loading={isSending} onClose={handleCloseConfirm} onConfirm={handleConfirm}></SendConfirmModal>
		</div>);
}
export default function SmspageV2() {
    return <SmspageContent></SmspageContent>;
}
