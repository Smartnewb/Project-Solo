'use client';

import {
	Box,
	Button,
	Chip,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	Typography,
} from '@mui/material';
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

export function SendConfirmModal({
	open,
	filter,
	count,
	message,
	type,
	regions,
	universities,
	loading,
	onClose,
	onConfirm,
}: Props) {
	const selectedRegionNames =
		(filter.regionCodes ?? [])
			.map((c) => regions.find((r) => r.code === c)?.name ?? c)
			.join(', ') || '전체';
	const selectedUnivNames =
		(filter.universityIds ?? [])
			.map((id) => universities.find((u) => u.id === id)?.name ?? id)
			.join(', ') || '전체';
	const cost = count ? (type === 'LMS' ? count.estimatedCost.lms : count.estimatedCost.sms) : 0;

	return (
		<Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
			<DialogTitle>발송 확인</DialogTitle>
			<DialogContent dividers>
				<Box className='space-y-3'>
					<div>
						<Typography variant='subtitle2' className='text-gray-500 mb-1'>
							발송 조건
						</Typography>
						<Box className='space-y-1 text-sm'>
							<div>학교: {selectedUnivNames}</div>
							<div>지역: {selectedRegionNames}</div>
							<div>성별: {filter.gender ?? '전체'}</div>
						</Box>
					</div>

					<Divider />

					<div className='flex items-center justify-between'>
						<Typography variant='subtitle1' className='font-bold'>
							발송 대상: {count?.validPhone.toLocaleString() ?? 0}명
						</Typography>
						<Chip label={type} color='primary' size='small' />
					</div>
					<div className='text-sm text-gray-600'>예상 비용: ₩{cost.toLocaleString()}</div>

					<Divider />

					<div>
						<Typography variant='subtitle2' className='text-gray-500 mb-1'>
							메시지 미리보기
						</Typography>
						<Box className='border border-gray-200 rounded-md p-3 bg-gray-50 whitespace-pre-wrap text-sm'>
							{message}
						</Box>
					</div>

					<Box className='bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700'>
						발송 후 취소할 수 없습니다.
					</Box>
				</Box>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose} disabled={loading}>
					취소
				</Button>
				<Button
					onClick={onConfirm}
					variant='contained'
					color='primary'
					disabled={loading || !count?.validPhone}
				>
					{loading ? '발송 중...' : '지금 발송'}
				</Button>
			</DialogActions>
		</Dialog>
	);
}
