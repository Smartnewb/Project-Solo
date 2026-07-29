'use client';

import { useCallback, useEffect, useState } from 'react';
import {
	Alert,
	Box,
	Chip,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TextField,
	Typography,
} from '@mui/material';
import { formatDateTimeKR } from '@/app/utils/formatters';
import { AdminLoading } from '@/shared/ui/admin/loading';
import { getAdminErrorMessage } from '@/shared/lib/http/admin-fetch';
import AdminService from '@/app/services/admin';
import type { GemPriceChangeRow } from '@/app/services/admin';
import { ScopeChip } from './shared';

/** 감사 로그의 before/after 는 임의 JSON 이라 관심 필드만 뽑아 한 줄로 보여준다. */
function summarize(value: unknown): string {
	if (value === null || value === undefined) return '(신규)';
	if (typeof value !== 'object') return String(value);
	const v = value as Record<string, unknown>;
	const parts: string[] = [];
	if (v.price !== undefined) parts.push(`정가 ${v.price}`);
	if (v.discountAmount !== undefined) parts.push(`할인 -${v.discountAmount}`);
	if (v.value !== undefined) parts.push(`값 ${v.value}`);
	if (v.isActive !== undefined) parts.push(v.isActive ? '활성' : '비활성');
	if (v.canceledAt) parts.push('취소됨');
	return parts.length > 0 ? parts.join(' · ') : JSON.stringify(v);
}

interface Props {
	/** 다른 탭에서 변경이 일어나면 값이 바뀌어 재조회를 유발한다. */
	refreshKey: number;
}

export default function ChangesTab({ refreshKey }: Props) {
	const [changes, setChanges] = useState<GemPriceChangeRow[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [featureFilter, setFeatureFilter] = useState('');
	// 입력 중에는 조회하지 않는다 — 타이핑 한 글자마다 API 를 때리지 않기 위해.
	const [debouncedFilter, setDebouncedFilter] = useState('');

	useEffect(() => {
		const timer = setTimeout(() => setDebouncedFilter(featureFilter.trim()), 300);
		return () => clearTimeout(timer);
	}, [featureFilter]);

	const load = useCallback(async () => {
		setLoading(true);
		try {
			setChanges(await AdminService.gemPricing.listChanges(debouncedFilter || undefined));
			setError(null);
		} catch (e) {
			setError(getAdminErrorMessage(e, '변경 이력을 불러오지 못했습니다'));
		} finally {
			setLoading(false);
		}
	}, [debouncedFilter]);

	useEffect(() => {
		void load();
	}, [load, refreshKey]);

	return (
		<Box>
			{error && (
				<Alert severity="error" sx={{ mb: 2 }}>
					{error}
				</Alert>
			)}

			<Alert severity="info" sx={{ mb: 2 }}>
				오설정을 되돌리는 정상 경로는 배포 롤백이 아니라 여기 남은 <b>이전 값</b>으로 다시
				저장하는 것입니다.
			</Alert>

			<Paper sx={{ p: 2, mb: 2 }}>
				<TextField
					size="small"
					label="액션으로 필터"
					placeholder="예: CHAT_START"
					value={featureFilter}
					onChange={(e) => setFeatureFilter(e.target.value.toUpperCase())}
					sx={{ minWidth: 280 }}
				/>
			</Paper>

			{loading ? (
				<AdminLoading />
			) : (
				<TableContainer component={Paper}>
					<Table size="small">
						<TableHead>
							<TableRow sx={{ bgcolor: 'grey.100' }}>
								<TableCell sx={{ fontWeight: 700, width: 150 }}>시각</TableCell>
								<TableCell sx={{ fontWeight: 700, width: 90 }}>대상</TableCell>
								<TableCell sx={{ fontWeight: 700 }}>액션</TableCell>
								<TableCell sx={{ fontWeight: 700, width: 140 }}>스코프</TableCell>
								<TableCell sx={{ fontWeight: 700, width: 240 }}>이전 → 이후</TableCell>
								<TableCell sx={{ fontWeight: 700 }}>사유</TableCell>
								<TableCell sx={{ fontWeight: 700, width: 140 }}>변경자</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{changes.length === 0 ? (
								<TableRow>
									<TableCell colSpan={7} align="center" sx={{ py: 6 }}>
										<Typography color="text.secondary">변경 이력이 없습니다</Typography>
									</TableCell>
								</TableRow>
							) : (
								changes.map((row) => (
									<TableRow key={row.id} hover>
										<TableCell>
											<Typography variant="body2" color="text.secondary">
												{formatDateTimeKR(row.createdAt)}
											</Typography>
										</TableCell>
										<TableCell>
											<Chip
												size="small"
												label={row.targetType === 'DISCOUNT' ? '할인' : '정가'}
												color={row.targetType === 'DISCOUNT' ? 'secondary' : 'primary'}
												variant="outlined"
											/>
										</TableCell>
										<TableCell>
											<code>{row.featureType}</code>
										</TableCell>
										<TableCell>
											<ScopeChip countryCode={row.countryCode} gender={row.gender} />
										</TableCell>
										<TableCell>
											<Typography variant="body2">
												{summarize(row.beforeValue)} → <b>{summarize(row.afterValue)}</b>
											</Typography>
										</TableCell>
										<TableCell>
											<Typography variant="body2" color="text.secondary">
												{row.memo || '-'}
											</Typography>
										</TableCell>
										<TableCell>
											<Typography variant="caption" color="text.secondary">
												{row.changedBy}
											</Typography>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</TableContainer>
			)}
		</Box>
	);
}
