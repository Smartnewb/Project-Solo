'use client';
import { Button, Chip, Modal } from '@heroui/react';
import type { RecipientCount, RecipientFilter } from '@/app/services/sms';
import {
    ALIGO_UNIT_COST_KRW,
    euckrByteLength,
    estimateAligoCostKrw,
    isSmsTruncationRisk,
    resolveEffectiveSmsBillingType,
    SMS_BYTE_LIMIT,
    SMS_SAFE_BODY_BYTE_LIMIT,
    WEB_SENDER_PREFIX_BYTES,
} from '../utils/euckr-byte-length';
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
    const byteLength = euckrByteLength(message);
    const effectiveBillingType = resolveEffectiveSmsBillingType(type, byteLength);
    const truncationRisk = isSmsTruncationRisk(byteLength);
    const validCount = count?.validPhone ?? 0;
    const estimatedAligoCost = estimateAligoCostKrw(validCount, effectiveBillingType);
    const excludedCount = count?.excludedUsers?.length ?? 0;
    return (<Modal.Backdrop isOpen={open} isDismissable={!loading} isKeyboardDismissDisabled={!!loading} onOpenChange={next => {
            if (!next && !loading)
                onClose();
        }}><Modal.Container size="lg"><Modal.Dialog style={{ width: '100%', maxWidth: 600, minWidth: 0 }}>
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
							발송 대상: {validCount.toLocaleString()}명
						</p>
						<Chip size="sm">{type}</Chip>
					</div>
					<div className='space-y-1 text-sm text-gray-600'>
						<div>
							본문 길이: {byteLength.toLocaleString()}바이트 (SMS 안전 {SMS_SAFE_BODY_BYTE_LIMIT}바이트 / 한도 {SMS_BYTE_LIMIT}바이트)
						</div>
						<div>
							예상 비용(알리고, VAT별도): ₩{estimatedAligoCost.toLocaleString()} (건당{' '}
							{ALIGO_UNIT_COST_KRW[effectiveBillingType]}원 · {effectiveBillingType})
						</div>
					</div>

					<hr></hr>

					<div>
						<p className='text-gray-500 mb-1'>
							메시지 미리보기
						</p>
						<div className='border border-gray-200 rounded-md p-3 bg-gray-50 whitespace-pre-wrap text-sm'>
							{message}
						</div>
					</div>

					{type === 'SMS' && truncationRisk && (
						<div className='bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-amber-800'>
							본문이 {SMS_SAFE_BODY_BYTE_LIMIT}바이트를 초과합니다({byteLength.toLocaleString()}바이트). 통신사 [Web발신]({WEB_SENDER_PREFIX_BYTES}바이트) 포함 시 {(byteLength + WEB_SENDER_PREFIX_BYTES).toLocaleString()}바이트로 90바이트를 넘어 단말에서 끝부분이 잘릴 수 있으므로 80바이트 이하 단축을 권장합니다.
						</div>
					)}

					{effectiveBillingType === 'LMS' && (
						<div className='bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-amber-800 space-y-1'>
							{type === 'SMS' && byteLength > SMS_BYTE_LIMIT && (
								<div>
									선택한 발송 유형은 SMS이지만 본문이 {SMS_BYTE_LIMIT}바이트({byteLength.toLocaleString()}바이트)를 초과해 문자가 잘리거나 LMS로 과금될 수 있습니다.
								</div>
							)}
							<div>
								LMS는 알리고 기준 건당 {ALIGO_UNIT_COST_KRW.LMS}원(SMS {ALIGO_UNIT_COST_KRW.SMS}원의 약 3.1배)이 과금됩니다. 필수 안내가 아니라면 80바이트 이하 SMS 단축을 권장합니다.
							</div>
						</div>
					)}

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
