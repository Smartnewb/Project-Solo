'use client';
import { Button, Chip, Modal } from '@heroui/react';
import type { RecipientCount, RecipientFilter } from '@/app/services/sms';
interface RegionLookup {
    code: string;
    name: string;
}
interface UniversityLookup {
    id: string;
    name: string;
}
interface Props {
    open: boolean;
    filter: RecipientFilter;
    count: RecipientCount | null;
    message: string;
    type: 'SMS' | 'LMS';
    regions: RegionLookup[];
    universities: UniversityLookup[];
    loading?: boolean;
    onClose: () => void;
    onConfirm: () => void;
}
export function SendConfirmModal({ open, filter, count, message, type, regions, universities, loading, onClose, onConfirm, }: Props) {
    const isUserIdsMode = !!filter.userIds?.length;
    const selectedRegionNames = (filter.regionCodes ?? [])
        .map((c) => regions.find((r) => r.code === c)?.name ?? c)
        .join(', ') || '전체';
    const selectedUnivNames = (filter.universityIds ?? [])
        .map((id) => universities.find((u) => u.id === id)?.name ?? id)
        .join(', ') || '전체';
    const cost = count ? (type === 'LMS' ? count.estimatedCost.lms : count.estimatedCost.sms) : 0;
    const excludedCount = count?.excludedUsers?.length ?? 0;
    return (<Modal.Backdrop isOpen={open} onOpenChange={next => {
            if (!next)
                onClose();
        }}><Modal.Container size="lg"><Modal.Dialog>
			<Modal.Heading>발송 확인</Modal.Heading>
			<Modal.Body>
				<div className='space-y-3'>
					<div>
						<p className='text-gray-500 mb-1'>
							발송 조건
						</p>
						{isUserIdsMode ? (<div className='space-y-1 text-sm'>
								<div>선택한 사용자: {filter.userIds!.length.toLocaleString()}명</div>
								<div>
									발송 가능: {count?.validPhone.toLocaleString() ?? 0}명 / 제외:{' '}
									{excludedCount.toLocaleString()}명
								</div>
							</div>) : (<div className='space-y-1 text-sm'>
								<div>학교: {selectedUnivNames}</div>
								<div>지역: {selectedRegionNames}</div>
								<div>성별: {filter.gender ?? '전체'}</div>
							</div>)}
					</div>

					<hr></hr>

					<div className='flex items-center justify-between'>
						<p className='font-bold'>
							발송 대상: {count?.validPhone.toLocaleString() ?? 0}명
						</p>
						<Chip size="sm">{type}</Chip>
					</div>
					<div className='text-sm text-gray-600'>예상 비용: ₩{cost.toLocaleString()}</div>

					<hr></hr>

					<div>
						<p className='text-gray-500 mb-1'>
							메시지 미리보기
						</p>
						<div className='border border-gray-200 rounded-md p-3 bg-gray-50 whitespace-pre-wrap text-sm'>
							{message}
						</div>
					</div>

					<div className='bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700'>
						발송 후 취소할 수 없습니다.
					</div>
				</div>
			</Modal.Body>
			<Modal.Footer>
				<Button onPress={onClose} isDisabled={loading} variant="tertiary">
					취소
				</Button>
				<Button onPress={onConfirm} isDisabled={loading || !count?.validPhone} variant="primary">
					{loading ? '발송 중...' : '지금 발송'}
				</Button>
			</Modal.Footer>
		</Modal.Dialog></Modal.Container></Modal.Backdrop>);
}
