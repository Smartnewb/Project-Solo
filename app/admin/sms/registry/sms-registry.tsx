// TITLE: - SMS 문자 명부 (레지스트리 조회, 읽기 전용)
'use client';

import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import type {
	SmsLegalClass,
	SmsRegistryCategory,
	SmsRegistryEntry,
} from '@/app/services/sms';
import { useSmsRegistry } from '../hooks/useSmsRegistry';

const CATEGORY_OPTIONS: Array<{ value: '' | SmsRegistryCategory; label: string }> = [
	{ value: '', label: '전체 카테고리' },
	{ value: 'auth', label: 'auth' },
	{ value: 'transactional', label: 'transactional' },
	{ value: 'retention', label: 'retention' },
	{ value: 'marketing', label: 'marketing' },
	{ value: 'admin', label: 'admin' },
];

const LEGAL_STYLE: Record<SmsLegalClass, string> = {
	informational: 'bg-sky-50 text-sky-800 border-sky-200',
	advertising: 'bg-amber-50 text-amber-900 border-amber-200',
};

const LEGAL_LABEL: Record<SmsLegalClass, string> = {
	informational: '정보성',
	advertising: '광고성',
};

const QUIET_LABEL: Record<string, string> = {
	allow: '허용',
	block: '차단',
	defer: '연기',
};

function LegalBadge({ legalClass }: { legalClass: SmsLegalClass }) {
	return (
		<span
			className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${LEGAL_STYLE[legalClass]}`}
		>
			{LEGAL_LABEL[legalClass]}
		</span>
	);
}

function PreviewModal({
	entry,
	onClose,
}: {
	entry: SmsRegistryEntry;
	onClose: () => void;
}) {
	const ko = entry.template.ko;
	const ja = entry.template.ja;

	return (
		<div
			className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'
			role='dialog'
			aria-modal='true'
			aria-label='문안 미리보기'
		>
			<div className='bg-white rounded-lg w-full max-w-2xl max-h-[85vh] flex flex-col'>
				<div className='flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB]'>
					<div>
						<h3 className='text-base font-medium text-[#111827]'>{entry.smsType}</h3>
						<p className='text-xs text-[#6B7280] mt-0.5'>
							{entry.category} · {LEGAL_LABEL[entry.legalClass]} · {entry.msgType}
						</p>
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

				<div className='overflow-y-auto px-5 py-4 space-y-4 text-sm'>
					<div className='grid grid-cols-2 sm:grid-cols-3 gap-3'>
						<div>
							<div className='text-xs text-[#6B7280]'>수신 대상</div>
							<div className='text-[#111827]'>{entry.recipient}</div>
						</div>
						<div>
							<div className='text-xs text-[#6B7280]'>성별</div>
							<div className='text-[#111827]'>{entry.gender}</div>
						</div>
						<div>
							<div className='text-xs text-[#6B7280]'>copyType</div>
							<div className='text-[#111827]'>{entry.copyType}</div>
						</div>
						<div>
							<div className='text-xs text-[#6B7280]'>야간 정책</div>
							<div className='text-[#111827]'>
								{QUIET_LABEL[entry.policy.quietHours] ?? entry.policy.quietHours}
							</div>
						</div>
						<div>
							<div className='text-xs text-[#6B7280]'>동의 필요</div>
							<div className='text-[#111827]'>
								{entry.policy.consentRequired ? '예' : '아니오'}
							</div>
						</div>
						<div>
							<div className='text-xs text-[#6B7280]'>캠페인 링크</div>
							<div className='text-[#111827] break-all'>
								{entry.link?.campaign ?? '-'}
							</div>
						</div>
					</div>

					{entry.evidence.length > 0 && (
						<div>
							<div className='text-xs text-[#6B7280] mb-1'>evidence</div>
							<div className='flex flex-wrap gap-1'>
								{entry.evidence.map((field) => (
									<span
										key={field}
										className='rounded bg-gray-100 px-2 py-0.5 text-xs text-[#374151]'
									>
										{field}
									</span>
								))}
							</div>
						</div>
					)}

					{ko && (
						<div>
							<div className='flex items-center justify-between mb-1'>
								<div className='text-xs font-medium text-[#6B7280]'>KO 미리보기</div>
								<div className='text-xs text-[#6B7280]'>
									{ko.byteLength}B · {ko.effectiveMsgType}
									{ko.exceedsSmsLimit ? ' · SMS 한도 초과' : ''}
								</div>
							</div>
							<pre className='whitespace-pre-wrap rounded-md border border-[#E5E7EB] bg-[#F9FAFB] p-3 text-sm text-[#111827] font-sans'>
								{ko.preview}
							</pre>
						</div>
					)}

					{ja && (
						<div>
							<div className='flex items-center justify-between mb-1'>
								<div className='text-xs font-medium text-[#6B7280]'>JA 미리보기</div>
								<div className='text-xs text-[#6B7280]'>
									{ja.byteLength}B · {ja.effectiveMsgType}
								</div>
							</div>
							<pre className='whitespace-pre-wrap rounded-md border border-[#E5E7EB] bg-[#F9FAFB] p-3 text-sm text-[#111827] font-sans'>
								{ja.preview}
							</pre>
						</div>
					)}

					<p className='text-xs text-[#9CA3AF]'>
						조회 전용입니다. 이 화면에서 발송·수정할 수 없습니다.
					</p>
				</div>
			</div>
		</div>
	);
}

function SmsRegistryContent() {
	const { data, isLoading, error } = useSmsRegistry();
	const [category, setCategory] = useState<'' | SmsRegistryCategory>('');
	const [legalClass, setLegalClass] = useState<'' | SmsLegalClass>('');
	const [selected, setSelected] = useState<SmsRegistryEntry | null>(null);

	const rows = useMemo(() => {
		const defs = data?.definitions ?? {};
		return Object.values(defs)
			.filter((entry) => (category ? entry.category === category : true))
			.filter((entry) => (legalClass ? entry.legalClass === legalClass : true))
			.sort((a, b) => a.smsType.localeCompare(b.smsType));
	}, [data, category, legalClass]);

	return (
		<div className='bg-[#F9FAFB] min-h-screen px-4 sm:px-6 md:px-8 lg:px-20 xl:px-25 py-6'>
			<div className='mb-4'>
				<h2 className='text-lg font-medium text-[#111827]'>문자 명부</h2>
				<p className='text-sm text-[#6B7280]'>
					코드 레지스트리에 등록된 SMS 종류·정책·문안 미리보기입니다. (조회 전용)
				</p>
				{data && (
					<p className='text-xs text-[#9CA3AF] mt-1'>
						version {data.version} · 총 {data.stats.total}종
						{data.stats.byLegalClass.informational != null &&
							` · 정보성 ${data.stats.byLegalClass.informational}`}
						{data.stats.byLegalClass.advertising != null &&
							` · 광고성 ${data.stats.byLegalClass.advertising}`}
					</p>
				)}
			</div>

			<div className='bg-white border border-[#D1D5DB] rounded-lg p-4 mb-4 flex flex-wrap items-end gap-3'>
				<div>
					<label htmlFor='sms-registry-category' className='block text-xs text-[#6B7280] mb-1'>
						카테고리
					</label>
					<select
						id='sms-registry-category'
						value={category}
						onChange={(e) => setCategory(e.target.value as '' | SmsRegistryCategory)}
						className='border border-[#D1D5DB] rounded-md px-3 py-2 text-sm min-w-[160px]'
					>
						{CATEGORY_OPTIONS.map((opt) => (
							<option key={opt.value || 'all'} value={opt.value}>
								{opt.label}
							</option>
						))}
					</select>
				</div>
				<div>
					<label
						htmlFor='sms-registry-legal-class'
						className='block text-xs text-[#6B7280] mb-1'
					>
						법적 분류
					</label>
					<select
						id='sms-registry-legal-class'
						value={legalClass}
						onChange={(e) => setLegalClass(e.target.value as '' | SmsLegalClass)}
						className='border border-[#D1D5DB] rounded-md px-3 py-2 text-sm min-w-[140px]'
					>
						<option value=''>전체</option>
						<option value='informational'>정보성</option>
						<option value='advertising'>광고성</option>
					</select>
				</div>
			</div>

			{isLoading && (
				<div className='bg-white border border-[#D1D5DB] rounded-lg p-8 text-center text-sm text-[#6B7280]'>
					불러오는 중…
				</div>
			)}

			{error && (
				<div className='bg-white border border-red-200 rounded-lg p-4 text-sm text-red-700'>
					문자 명부를 불러오지 못했습니다.{' '}
					{error instanceof Error ? error.message : String(error)}
				</div>
			)}

			{!isLoading && !error && (
				<div className='bg-white border border-[#D1D5DB] rounded-lg overflow-hidden'>
					{rows.length === 0 ? (
						<div className='p-8 text-center text-sm text-[#6B7280]'>
							조건에 맞는 문자 종류가 없습니다.
						</div>
					) : (
						<div className='overflow-x-auto'>
							<table className='min-w-full text-sm'>
								<thead className='bg-[#F3F4F6] text-left text-xs text-[#6B7280]'>
									<tr>
										<th className='px-4 py-3 font-medium'>smsType</th>
										<th className='px-4 py-3 font-medium'>법적 분류</th>
										<th className='px-4 py-3 font-medium'>카테고리</th>
										<th className='px-4 py-3 font-medium'>야간</th>
										<th className='px-4 py-3 font-medium'>동의</th>
										<th className='px-4 py-3 font-medium'>타입</th>
										<th className='px-4 py-3 font-medium'>바이트</th>
										<th className='px-4 py-3 font-medium'>미리보기</th>
									</tr>
								</thead>
								<tbody className='divide-y divide-[#E5E7EB]'>
									{rows.map((entry) => {
										const ko = entry.template.ko;
										const rowTint =
											entry.legalClass === 'advertising'
												? 'bg-amber-50/40'
												: '';
										return (
											<tr
												key={entry.smsType}
												className={`hover:bg-gray-50 ${rowTint}`}
											>
												<td className='px-4 py-3 font-mono text-xs text-[#111827]'>
													{entry.smsType}
												</td>
												<td className='px-4 py-3'>
													<LegalBadge legalClass={entry.legalClass} />
												</td>
												<td className='px-4 py-3 text-[#374151]'>
													{entry.category}
												</td>
												<td className='px-4 py-3 text-[#374151]'>
													{QUIET_LABEL[entry.policy.quietHours] ??
														entry.policy.quietHours}
												</td>
												<td className='px-4 py-3 text-[#374151]'>
													{entry.policy.consentRequired ? '필요' : '-'}
												</td>
												<td className='px-4 py-3 text-[#374151]'>
													{entry.msgType}
												</td>
												<td className='px-4 py-3 text-[#374151]'>
													{ko ? (
														<span
															className={
																ko.exceedsSmsLimit
																	? 'text-amber-700 font-medium'
																	: ''
															}
														>
															{ko.byteLength}B
														</span>
													) : (
														'-'
													)}
												</td>
												<td className='px-4 py-3'>
													<button
														type='button'
														onClick={() => setSelected(entry)}
														className='text-[#885AEB] hover:underline text-sm'
													>
														문안 보기
													</button>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					)}
				</div>
			)}

			{selected && <PreviewModal entry={selected} onClose={() => setSelected(null)} />}
		</div>
	);
}

export default function SmsRegistryScreen() {
	return <SmsRegistryContent />;
}
