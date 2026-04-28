// TITLE: - sms 관리 페이지
'use client';

import { useMemo, useState } from 'react';
import type { RecipientCount, RecipientFilter, SmsJobType } from '@/app/services/sms';
import { smsService } from '@/app/services/sms';
import { useBulkSendMutation, useJobStatus } from './hooks/useBulkSendJob';
import { useRecipientCount } from './hooks/useRecipientCount';
import { useRegions, useUniversitiesByRegions } from './hooks/useRegions';
import { MessageComposer } from './components/MessageComposer';
import { RecipientSelector } from './components/RecipientSelector';
import { RecipientModeToggle, RecipientMode } from './components/RecipientModeToggle';
import { UserSearchSelector } from './components/UserSearchSelector';
import { ExcludedUsersCard } from './components/ExcludedUsersCard';
import { SendConfirmModal } from './components/SendConfirmModal';
import { SmsHistoryTable } from './components/SmsHistoryTable';
import { TemplateManager } from './components/TemplateManager';
import { SmsTemplate } from './types';

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
	const { data: universityLookup = [] } = useUniversitiesByRegions(
		currentFilter.regionCodes ?? [],
	);

	const sendMutation = useBulkSendMutation();
	const jobStatus = useJobStatus(activeJobId);
	const isSending = sendMutation.isPending;

	const effectiveFilter: RecipientFilter = useMemo(
		() => (mode === 'userIds' ? { userIds: selectedUserIds } : currentFilter),
		[mode, selectedUserIds, currentFilter],
	);

	const effectiveCountEnabled =
		mode === 'userIds' ? selectedUserIds.length > 0 : true;
	const { data: effectiveCount } = useRecipientCount(effectiveFilter, effectiveCountEnabled);

	const effectiveValidCount =
		mode === 'userIds' ? effectiveCount?.validPhone ?? 0 : currentValidCount;

	const handleFilterChange = (filter: RecipientFilter, validCount: number) => {
		setCurrentFilter(filter);
		setCurrentValidCount(validCount);
	};

	const handleModeChange = (next: RecipientMode) => {
		setMode(next);
		setIdempotencyKey(null);
	};

	const handleOpenConfirm = async () => {
		if (!message.trim()) {
			alert('메시지를 입력하세요.');
			return;
		}
		if (effectiveValidCount <= 0) {
			alert('발송 대상이 없습니다. 조건을 확인하세요.');
			return;
		}
		try {
			const count = await smsService.countRecipients(effectiveFilter);
			setConfirmCount(count);
			setIdempotencyKey(crypto.randomUUID());
			setShowConfirm(true);
		} catch (e) {
			alert('대상자 카운트 조회 실패');
		}
	};

	const handleCloseConfirm = () => {
		setShowConfirm(false);
		setIdempotencyKey(null);
	};

	const handleConfirm = async () => {
		if (!idempotencyKey) return;
		try {
			const res = await sendMutation.mutateAsync({
				req: { filter: effectiveFilter, message, type: smsType },
				idempotencyKey,
			});
			setActiveJobId(res.jobId);
			setShowConfirm(false);
			setIdempotencyKey(null);
			alert(`발송 시작 (jobId: ${res.jobId}, 대상 ${res.expectedCount}명)`);
		} catch (e: any) {
			setIdempotencyKey(null);
			alert(e?.message ?? '발송 실패');
		}
	};

	// === JSX ===
	return (
		<div className='bg-[#F9FAFB] min-h-screen px-4 sm:px-6 md:px-8 lg:px-20 xl:px-25'>
			<div className='grid grid-cols-1 md:grid-cols-8 lg:grid-cols-10 gap-6'>
				<div className='lg:col-span-3'>
					<RecipientModeToggle
						mode={mode}
						onChange={handleModeChange}
						disabled={isSending}
					/>
					{mode === 'filter' ? (
						<RecipientSelector onFilterChange={handleFilterChange} />
					) : (
						<UserSearchSelector
							selectedUserIds={selectedUserIds}
							onSelectionChange={setSelectedUserIds}
							disabled={isSending}
						/>
					)}
					{mode === 'userIds' && (
						<ExcludedUsersCard excluded={effectiveCount?.excludedUsers ?? []} />
					)}
				</div>

				<div className='lg:col-span-7 space-y-6'>
					<TemplateManager onTemplateSelect={setSelectedTemplate} />
					<MessageComposer
						templateId={selectedTemplate?.id}
						templateTitle={selectedTemplate?.title}
						templateContent={selectedTemplate?.content}
						onMessageChange={setMessage}
					/>

					{/* 필터 기반 발송 액션 */}
					<div className='border border-[#D1D5DB] bg-white rounded-lg p-4 sm:p-6'>
						<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
							<div className='flex items-center gap-2'>
								<label className='text-sm text-[#374151]'>발송 유형</label>
								<select
									value={smsType}
									onChange={(e) => setSmsType(e.target.value as SmsJobType)}
									className='border border-[#D1D5DB] rounded-md px-3 py-2 text-sm'
								>
									<option value='SMS'>SMS</option>
									<option value='LMS'>LMS</option>
								</select>
							</div>
							<button
								type='button'
								onClick={handleOpenConfirm}
								disabled={
									!effectiveValidCount ||
									!message.trim() ||
									isSending ||
									(mode === 'userIds' && selectedUserIds.length === 0)
								}
								className='px-4 py-2 rounded-md bg-[#885AEB] text-white text-sm font-medium disabled:opacity-50'
							>
								발송하기 ({effectiveValidCount}명)
							</button>
						</div>

						{jobStatus.data && (
							<div className='mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md text-sm'>
								<div className='flex items-center justify-between mb-1'>
									<span className='font-medium'>작업 ID: {jobStatus.data.jobId}</span>
									<span className='text-xs text-gray-500'>
										{jobStatus.data.status}
									</span>
								</div>
								<div className='w-full bg-gray-200 rounded-full h-2'>
									<div
										className='bg-[#885AEB] h-2 rounded-full transition-all'
										style={{ width: `${jobStatus.data.progress}%` }}
									/>
								</div>
								<div className='mt-1 text-xs text-gray-600'>
									진행률: {jobStatus.data.progress}% — 성공{' '}
									{jobStatus.data.sentCount} / 실패 {jobStatus.data.failedCount} /
									전체 {jobStatus.data.totalCount}
								</div>
							</div>
						)}
					</div>

					<SmsHistoryTable />
				</div>
			</div>

			<SendConfirmModal
				open={showConfirm}
				filter={effectiveFilter}
				count={confirmCount}
				message={message}
				type={smsType}
				regions={regionLookup}
				universities={universityLookup}
				loading={isSending}
				onClose={handleCloseConfirm}
				onConfirm={handleConfirm}
			/>
		</div>
	);
}

export default function SmspageV2() {
	return <SmspageContent />;
}
