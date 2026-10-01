'use client';
import { ComboBox, Input, Label, ListBox, Chip, Button } from '@heroui/react';
import { useEffect, useMemo } from 'react';
import { ChevronDown, X } from 'lucide-react';
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
    const hasFilter = !!(filter.universityIds?.length ||
        filter.regionCodes?.length ||
        filter.gender);
    const { data: count, isLoading } = useRecipientCount(debouncedFilter, hasFilter);
    useEffect(() => {
        const validCount = count?.validPhone ?? 0;
        onFilterChange(debouncedFilter, validCount);
    }, [count, debouncedFilter, onFilterChange]);
    const selectedRegions = useMemo(() => regionList.filter((r) => (filter.regionCodes ?? []).includes(r.code)), [filter.regionCodes, regionList]);
    const selectedUniversities = useMemo(() => universityList.filter((u) => (filter.universityIds ?? []).includes(u.id)), [filter.universityIds, universityList]);
    return (<div className='border border-[#D1D5DB] bg-white rounded-lg p-4 sm:p-6 mb-6'>
			<h3 className='text-lg font-medium text-[#111827] mb-4'>발송 대상 선택</h3>

            <ComboBox selectionMode="multiple" value={filter.regionCodes ?? []} onChange={keys => update('regionCodes', keys.map(String))} className="mb-4">
                <Label>지역</Label><ComboBox.InputGroup><Input placeholder="지역 선택"/><ComboBox.Trigger aria-label="지역 목록"><ChevronDown size={16}/></ComboBox.Trigger></ComboBox.InputGroup>
                <ComboBox.Popover><ListBox>{regionList.map(region => <ListBox.Item key={region.code} id={region.code} textValue={region.name}>{region.name}</ListBox.Item>)}</ListBox></ComboBox.Popover>
            </ComboBox>
            <div className="mb-4 flex flex-wrap gap-2">{selectedRegions.map(region => <Chip key={region.code}>{region.name}<Button variant="tertiary" isIconOnly aria-label={`${region.name} 선택 해제`} onPress={() => update('regionCodes', (filter.regionCodes ?? []).filter(code => code !== region.code))}><X size={14}/></Button></Chip>)}</div>
            <ComboBox selectionMode="multiple" value={filter.universityIds ?? []} isDisabled={!filter.regionCodes?.length} onChange={keys => update('universityIds', keys.map(String))} className="mb-4">
                <Label>학교</Label><ComboBox.InputGroup><Input placeholder={filter.regionCodes?.length ? '학교 선택' : '먼저 지역을 선택하세요'}/><ComboBox.Trigger aria-label="학교 목록"><ChevronDown size={16}/></ComboBox.Trigger></ComboBox.InputGroup>
                <ComboBox.Popover><ListBox>{universityList.map(university => <ListBox.Item key={university.id} id={university.id} textValue={university.name}>{university.name}</ListBox.Item>)}</ListBox></ComboBox.Popover>
            </ComboBox>
            <div className="mb-4 flex flex-wrap gap-2">{selectedUniversities.map(university => <Chip key={university.id}>{university.name}<Button variant="tertiary" isIconOnly aria-label={`${university.name} 선택 해제`} onPress={() => update('universityIds', (filter.universityIds ?? []).filter(id => id !== university.id))}><X size={14}/></Button></Chip>)}</div>
			{/* 성별 */}
			<div className='mb-6'>
				<label className='block text-sm font-medium text-[#111827] mb-2'>성별</label>
				<div className='flex flex-wrap gap-2'>
					{(['ALL', 'FEMALE', 'MALE'] as const).map((g) => (<Button key={g} type='button' onPress={() => update('gender', g === 'ALL' ? undefined : g)} className={`px-3 py-2 rounded-md transition-colors ${(filter.gender ?? 'ALL') === g
                ? 'bg-[#885AEB] text-white'
                : 'border border-[#D1D5DB] bg-white text-[#374151] hover:bg-gray-50'}`} variant="secondary">
							{g === 'ALL' ? '전체' : g === 'FEMALE' ? '여성' : '남성'}
						</Button>))}
				</div>
			</div>

			{/* 카운트 카드 */}
			<div className='bg-gray-50 border border-gray-200 rounded-md p-4'>
				{!hasFilter && (<p>
						필터를 선택하면 발송 대상 인원이 표시됩니다.
					</p>)}
				{hasFilter && isLoading && (<p>
						계산 중...
					</p>)}
				{hasFilter && count && (<>
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
					</>)}
			</div>
		</div>);
}
