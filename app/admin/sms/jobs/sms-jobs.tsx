// TITLE: - SMS 대량 발송 이력 조회 (읽기 전용)
'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type {
	RecipientFilter,
	SmsJobListItem,
	SmsJobStatus,
} from '@/app/services/sms';
import { getAdminErrorMessage } from '@/shared/lib/http/admin-fetch';
import { useSmsJobFailures, useSmsJobs } from '../hooks/useSmsJobs';

const PAGE_LIMIT = 20;
const FAILURES_PAGE_LIMIT = 20;

const STATUS_OPTIONS: Array<{ value: '' | SmsJobStatus; label: string }> = [
	{ value: '', label: '전체 상태' },
	{ value: 'QUEUED', label: '대기중' },
	{ value: 'RUNNING', label: '발송중' },
	{ value: 'COMPLETED', label: '완료' },
	{ value: 'FAILED', label: '실패' },
];

const STATUS_LABEL: Record<SmsJobStatus, string> = {
	QUEUED: '대기중',
	RUNNING: '발송중',
	COMPLETED: '완료',
	FAILED: '실패',
};

const STATUS_STYLE: Record<SmsJobStatus, string> = {
	QUEUED: 'text-[#1F2937] bg-[#F3F4F6] border border-[#D1D5DB]',
	RUNNING: 'text-white bg-[#3B82F6]',
	COMPLETED: 'text-white bg-[#885AEB]',
	FAILED: 'text-white bg-red-500',
};

// UTC ISO 문자열 → KST 'YYYY-MM-DD HH:mm'
function formatKstDateTime(iso: string | null): string {
	if (!iso) return '-';
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return iso;
	return date.toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' }).slice(0, 16);
}

function summarizeFilter(filter: RecipientFilter): string {
	if (filter.userIds?.length) return `지정 유저 ${filter.userIds.length}명`;
	const parts: string[] = [];
	if (filter.regionCodes?.length) parts.push(`지역 ${filter.regionCodes.length}개`);
	if (filter.universityIds?.length) parts.push(`학교 ${filter.universityIds.length}개`);
	if (filter.gender) parts.push(filter.gender === 'MALE' ? '남성' : '여성');
	if (filter.excludeUserIds?.length) parts.push(`제외 ${filter.excludeUserIds.length}명`);
	return parts.length ? parts.join(' · ') : '전체 대상';
}

function StatusBadge({ status }: { status: SmsJobStatus }) {
	return (
		<span
			className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${STATUS_STYLE[status] ?? STATUS_STYLE.QUEUED}`}
		>
			{STATUS_LABEL[status] ?? status}
		</span>
	);
}

// MARK: - 실패 사유 모달
function JobDetailModal({ job, onClose }: { job: SmsJobListItem; onClose: () => void }) {
	const [page, setPage] = useState(1);
	const { data, isLoading, error } = useSmsJobFailures(job.id, page, FAILURES_PAGE_LIMIT);

	const failures = data?.data ?? [];
	const meta = data?.meta;

	return (
		<div
			className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'
			role='dialog'
			aria-modal='true'
			aria-label='대량 발송 잡 상세'
		>
			<div className='bg-white rounded-lg w-full max-w-3xl max-h-[85vh] flex flex-col'>
				{/* 헤더 */}
				<div className='flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB]'>
					<div>
						<h3 className='text-base font-medium text-[#111827]'>발송 잡 상세</h3>
						<p className='text-xs text-[#6B7280] mt-0.5'>{job.id}</p>
					</div>
					<button
						type='button'
						onClick={onClose}
						aria-label='닫기'
						className='p-1.5 rounded-md text-[#6B7280] hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#885AEB]'
					>
						<X size={18} />
					</button>
				</div>

				<div className='overflow-y-auto px-5 py-4 space-y-4'>
					{/* 잡 요약 */}
					<div className='grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm'>
						<div>
							<div className='text-xs text-[#6B7280]'>발송 일시</div>
							<div className='text-[#111827]'>{formatKstDateTime(job.createdAt)}</div>
						</div>
						<div>
							<div className='text-xs text-[#6B7280]'>상태</div>
							<StatusBadge status={job.status} />
						</div>
						<div>
							<div className='text-xs text-[#6B7280]'>대상 / 성공 / 실패</div>
							<div className='text-[#111827]'>
								{job.totalCount} / {job.sentCount} /{' '}
								<span className={job.failedCount > 0 ? 'text-red-600 font-medium' : ''}>
									{job.failedCount}
								</span>
							</div>
						</div>
						<div>
							<div className='text-xs text-[#6B7280]'>대상 조건</div>
							<div className='text-[#111827]'>{summarizeFilter(job.filter)}</div>
						</div>
						<div>
							<div className='text-xs text-[#6B7280]'>유형</div>
							<div className='text-[#111827]'>{job.type}</div>
						</div>
						<div>
							<div className='text-xs text-[#6B7280]'>요청자</div>
							<div className='text-[#111827] break-all'>{job.createdBy}</div>
						</div>
						<div>
							<div className='text-xs text-[#6B7280]'>시작</div>
							<div className='text-[#111827]'>{formatKstDateTime(job.startedAt)}</div>
						</div>
						<div>
							<div className='text-xs text-[#6B7280]'>종료</div>
							<div className='text-[#111827]'>{formatKstDateTime(job.completedAt)}</div>
						</div>
					</div>

					{/* 메시지 전문 */}
					<div>
						<div className='text-xs text-[#6B7280] mb-1'>메시지</div>
						<pre className='whitespace-pre-wrap break-words text-sm text-[#111827] bg-[#F9FAFB] border border-[#E5E7EB] rounded-md p-3'>
							{job.message}
						</pre>
					</div>

					{/* 실패 목록 */}
					<div>
						<div className='flex items-center justify-between mb-2'>
							<h4 className='text-sm font-medium text-[#111827]'>
								실패 사유 목록{meta ? ` (총 ${meta.total}건)` : ''}
							</h4>
							{meta && meta.totalPages > 1 && (
								<div className='flex items-center gap-2 text-sm'>
									<button
										type='button'
										onClick={() => setPage((p) => Math.max(1, p - 1))}
										disabled={page <= 1}
										aria-label='이전 페이지'
										className='p-1 rounded border border-[#D1D5DB] disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#885AEB]'
									>
										<ChevronLeft size={16} />
									</button>
									<span className='text-xs text-[#6B7280]'>
										{page} / {meta.totalPages}
									</span>
									<button
										type='button'
										onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
										disabled={page >= meta.totalPages}
										aria-label='다음 페이지'
										className='p-1 rounded border border-[#D1D5DB] disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#885AEB]'
									>
										<ChevronRight size={16} />
									</button>
								</div>
							)}
						</div>

						{isLoading ? (
							<div className='flex justify-center py-8'>
								<div className='animate-spin rounded-full h-6 w-6 border-b-2 border-[#885AEB]' />
							</div>
						) : error ? (
							<p className='text-sm text-red-600 py-4'>
								{getAdminErrorMessage(error, '실패 목록을 불러오지 못했습니다.')}
							</p>
						) : failures.length === 0 ? (
							<p className='text-sm text-[#6B7280] py-4'>실패 건이 없습니다.</p>
						) : (
							<div className='overflow-x-auto border border-[#E5E7EB] rounded-md'>
								<table className='w-full text-sm'>
									<thead>
										<tr className='bg-[#F9FAFB] text-left text-xs text-[#6B7280]'>
											<th className='px-3 py-2 font-medium'>시각</th>
											<th className='px-3 py-2 font-medium'>전화번호</th>
											<th className='px-3 py-2 font-medium'>유저 ID</th>
											<th className='px-3 py-2 font-medium'>실패 사유</th>
										</tr>
									</thead>
									<tbody>
										{failures.map((failure) => (
											<tr key={failure.id} className='border-t border-[#F3F4F6]'>
												<td className='px-3 py-2 whitespace-nowrap text-[#374151]'>
													{formatKstDateTime(failure.createdAt)}
												</td>
												<td className='px-3 py-2 whitespace-nowrap text-[#374151]'>
													{failure.phoneNumber ?? '-'}
												</td>
												<td className='px-3 py-2 text-[#6B7280] break-all'>
													{failure.userId ?? '-'}
												</td>
												<td className='px-3 py-2 text-red-600'>
													{failure.errorMessage ?? '-'}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

// MARK: - 대량 발송 이력 화면
function SmsJobsContent() {
	const [page, setPage] = useState(1);
	const [status, setStatus] = useState<'' | SmsJobStatus>('');
	const [startDate, setStartDate] = useState('');
	const [endDate, setEndDate] = useState('');
	const [selectedJob, setSelectedJob] = useState<SmsJobListItem | null>(null);

	const { data, isLoading, error } = useSmsJobs({
		page,
		limit: PAGE_LIMIT,
		status: status || undefined,
		startDate: startDate || undefined,
		endDate: endDate || undefined,
	});

	const jobs = data?.data ?? [];
	const meta = data?.meta;

	const resetToFirstPage = () => setPage(1);

	return (
		<div className='bg-[#F9FAFB] min-h-screen px-4 sm:px-6 md:px-8 lg:px-20 xl:px-25 py-6'>
			<div className='mb-4'>
				<h2 className='text-lg font-medium text-[#111827]'>대량 발송 이력</h2>
				<p className='text-sm text-[#6B7280]'>
					필터 기반 대량 SMS 발송 잡 이력입니다. 잡을 클릭하면 실패 사유를 확인할 수
					있습니다. (조회 전용)
				</p>
			</div>

			{/* MARK: - 필터 */}
			<div className='bg-white border border-[#D1D5DB] rounded-lg p-4 mb-4 flex flex-wrap items-end gap-3'>
				<div>
					<label htmlFor='sms-jobs-start-date' className='block text-xs text-[#6B7280] mb-1'>
						시작일
					</label>
					<input
						id='sms-jobs-start-date'
						type='date'
						value={startDate}
						onChange={(e) => {
							setStartDate(e.target.value);
							resetToFirstPage();
						}}
						className='border border-[#D1D5DB] rounded-md px-3 py-2 text-sm'
					/>
				</div>
				<div>
					<label htmlFor='sms-jobs-end-date' className='block text-xs text-[#6B7280] mb-1'>
						종료일
					</label>
					<input
						id='sms-jobs-end-date'
						type='date'
						value={endDate}
						onChange={(e) => {
							setEndDate(e.target.value);
							resetToFirstPage();
						}}
						className='border border-[#D1D5DB] rounded-md px-3 py-2 text-sm'
					/>
				</div>
				<div>
					<label htmlFor='sms-jobs-status' className='block text-xs text-[#6B7280] mb-1'>
						상태
					</label>
					<select
						id='sms-jobs-status'
						value={status}
						onChange={(e) => {
							setStatus(e.target.value as '' | SmsJobStatus);
							resetToFirstPage();
						}}
						className='border border-[#D1D5DB] rounded-md px-3 py-2 text-sm'
					>
						{STATUS_OPTIONS.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
				</div>
				{(startDate || endDate || status) && (
					<button
						type='button'
						onClick={() => {
							setStartDate('');
							setEndDate('');
							setStatus('');
							resetToFirstPage();
						}}
						className='px-3 py-2 rounded-md border border-[#D1D5DB] text-sm text-[#374151] hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#885AEB]'
					>
						필터 초기화
					</button>
				)}
			</div>

			{/* MARK: - 잡 목록 */}
			<div className='bg-white border border-[#D1D5DB] rounded-lg overflow-hidden'>
				{isLoading ? (
					<div className='flex justify-center items-center py-16'>
						<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-[#885AEB]' />
					</div>
				) : error ? (
					<p className='text-sm text-red-600 text-center py-12'>
						{getAdminErrorMessage(error, '이력을 불러오지 못했습니다.')}
					</p>
				) : jobs.length === 0 ? (
					<p className='text-sm text-[#6B7280] text-center py-12'>발송 이력이 없습니다.</p>
				) : (
					<div className='overflow-x-auto'>
						<table className='w-full text-sm'>
							<thead>
								<tr className='bg-[#F9FAFB] text-left text-xs text-[#6B7280] border-b border-[#E5E7EB]'>
									<th className='px-4 py-3 font-medium whitespace-nowrap'>발송 일시</th>
									<th className='px-4 py-3 font-medium'>메시지</th>
									<th className='px-4 py-3 font-medium whitespace-nowrap'>유형</th>
									<th className='px-4 py-3 font-medium text-right whitespace-nowrap'>대상</th>
									<th className='px-4 py-3 font-medium text-right whitespace-nowrap'>성공</th>
									<th className='px-4 py-3 font-medium text-right whitespace-nowrap'>실패</th>
									<th className='px-4 py-3 font-medium whitespace-nowrap'>상태</th>
								</tr>
							</thead>
							<tbody>
								{jobs.map((job) => (
									<tr
										key={job.id}
										onClick={() => setSelectedJob(job)}
										onKeyDown={(e) => {
											if (e.key === 'Enter' || e.key === ' ') {
												e.preventDefault();
												setSelectedJob(job);
											}
										}}
										tabIndex={0}
										role='button'
										aria-label={`${formatKstDateTime(job.createdAt)} 발송 잡 상세 보기`}
										className='border-b border-[#F3F4F6] cursor-pointer hover:bg-[#F9FAFB] focus:outline-none focus-visible:bg-[#F3F0FC]'
									>
										<td className='px-4 py-3 whitespace-nowrap text-[#374151]'>
											{formatKstDateTime(job.createdAt)}
										</td>
										<td className='px-4 py-3 max-w-[320px]'>
											<div className='truncate text-[#111827]'>{job.message}</div>
											<div className='text-xs text-[#6B7280]'>{summarizeFilter(job.filter)}</div>
										</td>
										<td className='px-4 py-3 whitespace-nowrap text-[#374151]'>{job.type}</td>
										<td className='px-4 py-3 text-right text-[#374151]'>{job.totalCount}</td>
										<td className='px-4 py-3 text-right text-[#374151]'>{job.sentCount}</td>
										<td
											className={`px-4 py-3 text-right ${job.failedCount > 0 ? 'text-red-600 font-medium' : 'text-[#374151]'}`}
										>
											{job.failedCount}
										</td>
										<td className='px-4 py-3'>
											<StatusBadge status={job.status} />
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}

				{/* MARK: - 페이지네이션 */}
				{meta && meta.total > 0 && (
					<div className='flex items-center justify-between px-4 py-3 border-t border-[#E5E7EB] text-sm'>
						<span className='text-xs text-[#6B7280]'>총 {meta.total}건</span>
						<div className='flex items-center gap-2'>
							<button
								type='button'
								onClick={() => setPage((p) => Math.max(1, p - 1))}
								disabled={page <= 1}
								aria-label='이전 페이지'
								className='p-1.5 rounded border border-[#D1D5DB] disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#885AEB]'
							>
								<ChevronLeft size={16} />
							</button>
							<span className='text-xs text-[#6B7280]'>
								{meta.page} / {Math.max(1, meta.totalPages)}
							</span>
							<button
								type='button'
								onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
								disabled={page >= meta.totalPages}
								aria-label='다음 페이지'
								className='p-1.5 rounded border border-[#D1D5DB] disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#885AEB]'
							>
								<ChevronRight size={16} />
							</button>
						</div>
					</div>
				)}
			</div>

			{selectedJob && <JobDetailModal job={selectedJob} onClose={() => setSelectedJob(null)} />}
		</div>
	);
}

export default function SmsJobsScreen() {
	return <SmsJobsContent />;
}
