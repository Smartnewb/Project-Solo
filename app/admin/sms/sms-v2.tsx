// TITLE: - sms 관리 페이지
'use client';

import { useEffect, useMemo, useState } from 'react';
import type { RecipientCount, RecipientFilter } from '@/app/services/sms';
import { smsService } from '@/app/services/sms';
import { universities as universitiesService } from '@/app/services/admin/system';
import { useBulkSendMutation, useJobStatus } from './hooks/useBulkSendJob';
import { MessageComposer } from './components/MessageComposer';
import { RecipientSelector } from './components/RecipientSelector';
import { SendConfirmModal } from './components/SendConfirmModal';
import { SmsHistoryTable } from './components/SmsHistoryTable';
import { TemplateManager } from './components/TemplateManager';
import { SmsTemplate } from './types';

interface RegionLookup {
	code: string;
	name: string;
}
interface UniversityLookup {
	id: string;
	name: string;
}

function generateIdempotencyKey(): string {
	if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
		return crypto.randomUUID();
	}
	return `sms-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function SmspageContent() {
	// === 상태관리 ===
	const [selectedTemplate, setSelectedTemplate] = useState<SmsTemplate | null>(null);
	const [currentFilter, setCurrentFilter] = useState<RecipientFilter>({});
	const [currentValidCount, setCurrentValidCount] = useState(0);
	const [message, setMessage] = useState<string>('');
	const [smsType, setSmsType] = useState<'SMS' | 'LMS'>('SMS');
	const [showConfirm, setShowConfirm] = useState(false);
	const [activeJobId, setActiveJobId] = useState<string | null>(null);
	const [confirmCount, setConfirmCount] = useState<RecipientCount | null>(null);
	const [regionLookup, setRegionLookup] = useState<RegionLookup[]>([]);
	const [universityLookup, setUniversityLookup] = useState<UniversityLookup[]>([]);

	const idempotencyKey = useMemo(
		() => generateIdempotencyKey(),
		// 필터/메시지 변경 시 새 키
		[currentFilter, message, smsType],
	);

	const sendMutation = useBulkSendMutation();
	const jobStatus = useJobStatus(activeJobId);

	// 지역/학교 lookup (확인 모달에서 라벨 표시)
	useEffect(() => {
		universitiesService.meta
			.getRegions()
			.then((regions: any[]) =>
				setRegionLookup(
					regions.map((r) => ({
						code: r.code,
						name: r.nameLocal ?? r.name ?? r.code,
					})),
				),
			)
			.catch(() => setRegionLookup([]));
	}, []);

	useEffect(() => {
		const codes = currentFilter.regionCodes ?? [];
		if (!codes.length) {
			setUniversityLookup([]);
			return;
		}
		Promise.all(
			codes.map((code) =>
				universitiesService.getList({ region: code, limit: 200, isActive: true } as any),
			),
		)
			.then((results: any[]) => {
				const all = results.flatMap((r) => r?.items ?? []);
				setUniversityLookup(
					all.map((u: any) => ({ id: u.id, name: u.name })),
				);
			})
			.catch(() => setUniversityLookup([]));
	}, [currentFilter.regionCodes]);

	const handleFilterChange = (filter: RecipientFilter, validCount: number) => {
		setCurrentFilter(filter);
		setCurrentValidCount(validCount);
	};

	const handleOpenConfirm = async () => {
		if (!message.trim()) {
			alert('메시지를 입력하세요.');
			return;
		}
		if (currentValidCount <= 0) {
			alert('발송 대상이 없습니다. 필터 조건을 확인하세요.');
			return;
		}
		try {
			const count = await smsService.countRecipients(currentFilter);
			setConfirmCount(count);
			setShowConfirm(true);
		} catch (e) {
			alert('대상자 카운트 조회 실패');
		}
	};

	const handleConfirm = async () => {
		try {
			const res = await sendMutation.mutateAsync({
				req: { filter: currentFilter, message, type: smsType },
				idempotencyKey,
			});
			setActiveJobId(res.jobId);
			setShowConfirm(false);
			alert(`발송 시작 (jobId: ${res.jobId}, 대상 ${res.expectedCount}명)`);
		} catch (e: any) {
			alert(e?.message ?? '발송 실패');
		}
	};

	// === JSX ===
	return (
		<div className='bg-[#F9FAFB] min-h-screen px-4 sm:px-6 md:px-8 lg:px-20 xl:px-25'>
			<div className='grid grid-cols-1 md:grid-cols-8 lg:grid-cols-10 gap-6'>
				<div className='lg:col-span-3'>
					<RecipientSelector onFilterChange={handleFilterChange} />
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
									onChange={(e) => setSmsType(e.target.value as 'SMS' | 'LMS')}
									className='border border-[#D1D5DB] rounded-md px-3 py-2 text-sm'
								>
									<option value='SMS'>SMS</option>
									<option value='LMS'>LMS</option>
								</select>
							</div>
							<button
								type='button'
								onClick={handleOpenConfirm}
								disabled={!currentValidCount || !message.trim() || sendMutation.isPending}
								className='px-4 py-2 rounded-md bg-[#885AEB] text-white text-sm font-medium disabled:opacity-50'
							>
								필터 발송하기 ({currentValidCount}명)
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
				filter={currentFilter}
				count={confirmCount}
				message={message}
				type={smsType}
				regions={regionLookup}
				universities={universityLookup}
				loading={sendMutation.isPending}
				onClose={() => setShowConfirm(false)}
				onConfirm={handleConfirm}
			/>
		</div>
	);
}

export default function SmspageV2() {
	return <SmspageContent />;
}
