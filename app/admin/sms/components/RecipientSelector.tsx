'use client';

import { useEffect, useMemo } from 'react';
import { Autocomplete, Box, Chip, TextField, Typography } from '@mui/material';
import type { RecipientFilter } from '@/app/services/sms';
import { useRecipientCount } from '../hooks/useRecipientCount';
import { useRecipientFilter } from '../hooks/useRecipientFilter';
import { useRegions, useUniversitiesByRegions } from '../hooks/useRegions';

interface Props {
	onFilterChange: (filter: RecipientFilter, validCount: number) => void;
}

export function RecipientSelector({ onFilterChange }: Props) {
	const { filter, debouncedFilter, update } = useRecipientFilter();
	const { data: regionList = [] } = useRegions();
	const { data: universityList = [] } = useUniversitiesByRegions(filter.regionCodes ?? []);

	const hasFilter = !!(
		filter.universityIds?.length ||
		filter.regionCodes?.length ||
		filter.gender
	);
	const { data: count, isLoading } = useRecipientCount(debouncedFilter, hasFilter);

	useEffect(() => {
		const validCount = count?.validPhone ?? 0;
		onFilterChange(debouncedFilter, validCount);
	}, [count, debouncedFilter, onFilterChange]);

	const selectedRegions = useMemo(
		() => regionList.filter((r) => (filter.regionCodes ?? []).includes(r.code)),
		[filter.regionCodes, regionList],
	);
	const selectedUniversities = useMemo(
		() => universityList.filter((u) => (filter.universityIds ?? []).includes(u.id)),
		[filter.universityIds, universityList],
	);

	return (
		<div className='border border-[#D1D5DB] bg-white rounded-lg p-4 sm:p-6 mb-6'>
			<h3 className='text-lg font-medium text-[#111827] mb-4'>발송 대상 선택</h3>

			{/* 지역 multi-select */}
			<Box className='mb-4'>
				<Autocomplete
					multiple
					size='small'
					options={regionList}
					value={selectedRegions}
					getOptionLabel={(o) => o.name}
					isOptionEqualToValue={(a, b) => a.code === b.code}
					onChange={(_, value) =>
						update(
							'regionCodes',
							value.map((v) => v.code),
						)
					}
					renderInput={(params) => (
						<TextField {...params} label='지역' placeholder='지역 선택' />
					)}
					renderTags={(value, getTagProps) =>
						value.map((opt, i) => (
							<Chip {...getTagProps({ index: i })} key={opt.code} label={opt.name} />
						))
					}
				/>
			</Box>

			{/* 학교 multi-select */}
			<Box className='mb-4'>
				<Autocomplete
					multiple
					size='small'
					options={universityList}
					value={selectedUniversities}
					getOptionLabel={(o) => o.name}
					isOptionEqualToValue={(a, b) => a.id === b.id}
					disabled={!filter.regionCodes?.length}
					onChange={(_, value) =>
						update(
							'universityIds',
							value.map((v) => v.id),
						)
					}
					renderInput={(params) => (
						<TextField
							{...params}
							label='학교'
							placeholder={
								filter.regionCodes?.length ? '학교 선택' : '먼저 지역을 선택하세요'
							}
						/>
					)}
					renderTags={(value, getTagProps) =>
						value.map((opt, i) => (
							<Chip {...getTagProps({ index: i })} key={opt.id} label={opt.name} />
						))
					}
				/>
			</Box>

			{/* 성별 */}
			<div className='mb-6'>
				<label className='block text-sm font-medium text-[#111827] mb-2'>성별</label>
				<div className='flex flex-wrap gap-2'>
					{(['ALL', 'FEMALE', 'MALE'] as const).map((g) => (
						<button
							key={g}
							type='button'
							onClick={() => update('gender', g === 'ALL' ? undefined : g)}
							className={`px-3 py-2 rounded-md transition-colors ${
								(filter.gender ?? 'ALL') === g
									? 'bg-[#885AEB] text-white'
									: 'border border-[#D1D5DB] bg-white text-[#374151] hover:bg-gray-50'
							}`}
						>
							{g === 'ALL' ? '전체' : g === 'FEMALE' ? '여성' : '남성'}
						</button>
					))}
				</div>
			</div>

			{/* 카운트 카드 */}
			<div className='bg-gray-50 border border-gray-200 rounded-md p-4'>
				{!hasFilter && (
					<Typography variant='body2' className='text-gray-500 text-center'>
						필터를 선택하면 발송 대상 인원이 표시됩니다.
					</Typography>
				)}
				{hasFilter && isLoading && (
					<Typography variant='body2' className='text-gray-500 text-center'>
						계산 중...
					</Typography>
				)}
				{hasFilter && count && (
					<>
						<div className='grid grid-cols-3 gap-4 text-center'>
							<div>
								<div className='text-xs text-gray-500'>조건 일치</div>
								<div className='text-2xl font-bold text-gray-700'>
									{count.totalMatched.toLocaleString()}
								</div>
							</div>
							<div>
								<div className='text-xs text-gray-500'>마케팅 동의</div>
								<div className='text-2xl font-bold text-[#ff385c]'>
									{count.smsConsented.toLocaleString()}
								</div>
							</div>
							<div>
								<div className='text-xs text-gray-500'>발송 가능</div>
								<div className='text-2xl font-bold text-[#885AEB]'>
									{count.validPhone.toLocaleString()}
								</div>
							</div>
						</div>
						<div className='mt-3 pt-3 border-t border-gray-200 text-sm text-gray-600 text-center'>
							예상 비용 — SMS ₩{count.estimatedCost.sms.toLocaleString()} / LMS ₩
							{count.estimatedCost.lms.toLocaleString()}
						</div>
					</>
				)}
			</div>
		</div>
	);
}
