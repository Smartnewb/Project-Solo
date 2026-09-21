'use client';

import { useCallback, useEffect, useState } from 'react';
import {
	Alert,
	Box,
	Button,
	Checkbox,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControlLabel,
	Paper,
	Stack,
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
import { getAdminErrorMessage, isAdminConflictError } from '@/shared/lib/http/admin-fetch';
import AdminService from '@/app/services/admin';
import type { GemRefundPolicyRow } from '@/app/services/admin';
import { neededConfirm } from './shared';

interface Props {
	onChanged: () => void;
}

export default function RefundPoliciesTab({ onChanged }: Props) {
	const [policies, setPolicies] = useState<GemRefundPolicyRow[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [editTarget, setEditTarget] = useState<GemRefundPolicyRow | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		try {
			setPolicies(await AdminService.gemPricing.listRefundPolicies());
			setError(null);
		} catch (e) {
			setError(getAdminErrorMessage(e, '환급 정책을 불러오지 못했습니다'));
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void load();
	}, [load]);

	if (loading) {
		return <AdminLoading />;
	}

	return (
		<Box>
			{error && (
				<Alert severity="error" sx={{ mb: 2 }}>
					{error}
				</Alert>
			)}

			<Alert severity="info" sx={{ mb: 2 }}>
				환급 <b>금액</b>은 여기서 정하지 않습니다 — 환급은 항상 <b>차감 당시 실제로 빠져나간
				개수</b>만큼 돌려줍니다(가격 인상·할인 종료 후에도 동일). 이 탭은 &ldquo;어떤 조건까지
				환급을 허용할지&rdquo;의 임계값만 조정합니다.
			</Alert>

			<TableContainer component={Paper}>
				<Table size="small">
					<TableHead>
						<TableRow sx={{ bgcolor: 'grey.100' }}>
							<TableCell sx={{ fontWeight: 700 }}>정책</TableCell>
							<TableCell align="right" sx={{ fontWeight: 700, width: 100 }}>
								현재 값
							</TableCell>
							<TableCell sx={{ fontWeight: 700 }}>설명</TableCell>
							<TableCell sx={{ fontWeight: 700, width: 150 }}>수정 시각</TableCell>
							<TableCell align="right" sx={{ fontWeight: 700, width: 90 }} />
						</TableRow>
					</TableHead>
					<TableBody>
						{policies.length === 0 ? (
							<TableRow>
								<TableCell colSpan={5} align="center" sx={{ py: 6 }}>
									<Typography color="text.secondary">등록된 환급 정책이 없습니다</Typography>
								</TableCell>
							</TableRow>
						) : (
							policies.map((row) => (
								<TableRow key={row.policyKey} hover>
									<TableCell>
										<Typography variant="body2" fontWeight={600}>
											{row.label}
										</Typography>
										<Typography variant="caption" color="text.secondary">
											<code>{row.policyKey}</code>
										</Typography>
									</TableCell>
									<TableCell align="right" sx={{ fontWeight: 700 }}>
										{row.value}
									</TableCell>
									<TableCell>
										<Typography variant="body2" color="text.secondary">
											{row.description || '-'}
										</Typography>
									</TableCell>
									<TableCell>
										<Typography variant="body2" color="text.secondary">
											{formatDateTimeKR(row.updatedAt)}
										</Typography>
									</TableCell>
									<TableCell align="right">
										<Button size="small" onClick={() => setEditTarget(row)}>
											수정
										</Button>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</TableContainer>

			{editTarget && (
				<EditPolicyDialog
					row={editTarget}
					onClose={() => setEditTarget(null)}
					onSaved={() => {
						setEditTarget(null);
						void load();
						onChanged();
					}}
				/>
			)}
		</Box>
	);
}

function EditPolicyDialog({
	row,
	onClose,
	onSaved,
}: {
	row: GemRefundPolicyRow;
	onClose: () => void;
	onSaved: () => void;
}) {
	const [value, setValue] = useState(String(row.value));
	const [memo, setMemo] = useState('');
	const [confirmLarge, setConfirmLarge] = useState(false);
	const [needConfirmLarge, setNeedConfirmLarge] = useState(false);
	const [conflict, setConflict] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);

	const valueNum = Number(value);
	const valid =
		memo.trim() && value !== '' && Number.isInteger(valueNum) && valueNum >= 0 && valueNum !== row.value;

	const submit = async () => {
		setSaving(true);
		setError(null);
		try {
			await AdminService.gemPricing.updateRefundPolicy(row.policyKey, {
				value: valueNum,
				memo: memo.trim(),
				version: row.version,
				confirmLargeChange: confirmLarge || undefined,
			});
			onSaved();
		} catch (e) {
			const msg = getAdminErrorMessage(e, '환급 정책 수정 실패');
			if (neededConfirm(msg) === 'confirmLargeChange') setNeedConfirmLarge(true);
			// 409 — version 이 낡았다. 재조회 없이는 저장 불가.
			if (isAdminConflictError(e)) setConflict(true);
			setError(msg);
		} finally {
			setSaving(false);
		}
	};

	return (
		<Dialog open fullWidth maxWidth="sm" onClose={onClose}>
			<DialogTitle>{row.label} 수정</DialogTitle>
			<DialogContent>
				<Stack spacing={2} sx={{ mt: 1 }}>
					{error && (
						<Alert severity={conflict ? 'warning' : 'error'}>
							{error}
							{conflict && ' 창을 닫고 목록을 새로고침한 뒤 다시 시도하세요.'}
						</Alert>
					)}
					<Typography variant="body2" color="text.secondary">
						<code>{row.policyKey}</code> · 현재 {row.value} · version {row.version}
					</Typography>
					{row.description && <Typography variant="body2">{row.description}</Typography>}
					<TextField
						size="small"
						label="새 임계값"
						type="number"
						value={value}
						onChange={(e) => setValue(e.target.value)}
						inputProps={{ min: 0 }}
					/>
					<TextField
						size="small"
						label="변경 사유 (필수)"
						value={memo}
						onChange={(e) => setMemo(e.target.value)}
						multiline
						minRows={2}
					/>
					{needConfirmLarge && (
						<FormControlLabel
							control={
								<Checkbox
									checked={confirmLarge}
									onChange={(e) => setConfirmLarge(e.target.checked)}
								/>
							}
							label="기존값 대비 2배 이상 변경임을 확인합니다 (환급 대상 폭이 통째로 달라집니다)"
						/>
					)}
				</Stack>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose}>취소</Button>
				<Button
					variant="contained"
					disabled={!valid || saving || conflict || (needConfirmLarge && !confirmLarge)}
					onClick={submit}
				>
					저장
				</Button>
			</DialogActions>
		</Dialog>
	);
}
