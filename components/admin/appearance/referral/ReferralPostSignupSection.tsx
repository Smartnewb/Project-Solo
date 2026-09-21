'use client';

import { useEffect, useRef, useState } from 'react';
import { Alert, Box, Button, Paper, TextField, Typography } from '@mui/material';
import { referrals, type ReferralMode, type ReferralPreview } from '@/app/services/admin/referrals';
import { getAdminErrorMessage } from '@/shared/lib/http/admin-fetch';
import { useConfirm } from '@/shared/ui/admin/confirm-dialog';

type Props = { userId: string; createdAt?: string; onCompleted?: () => void };

export function ReferralPostSignupSection({ userId, createdAt, onCompleted }: Props) {
	const confirm = useConfirm();
	const [code, setCode] = useState('');
	const [reason, setReason] = useState('');
	const [preview, setPreview] = useState<ReferralPreview | null>(null);
	const [previewedCode, setPreviewedCode] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [key, setKey] = useState<string | null>(null);
	const requestVersion = useRef(0);
	const executionToken = useRef<symbol | null>(null);

	useEffect(() => {
		requestVersion.current += 1;
		setCode('');
		setReason('');
		setPreview(null);
		setPreviewedCode(null);
		setLoading(false);
		setError(null);
		setKey(null);
		executionToken.current = null;
	}, [userId]);

	const lookup = async () => {
		const version = ++requestVersion.current;
		const lookupCode = code.trim().toUpperCase();
		try {
			setLoading(true); setError(null);
			const result = await referrals.preview(userId, lookupCode);
			if (version === requestVersion.current) {
				setPreview(result);
				setPreviewedCode(lookupCode);
			}
		} catch (err) {
			if (version === requestVersion.current) {
				setPreview(null);
				setPreviewedCode(null);
				setError(getAdminErrorMessage(err, '추천 관계를 확인하지 못했습니다.'));
			}
		} finally {
			if (version === requestVersion.current) setLoading(false);
		}
	};

	const execute = async (mode: ReferralMode) => {
		if (!previewedCode) { setError('초대코드를 다시 조회해 주세요.'); return; }
		if (mode === 'MANUAL_COMPENSATED' && !reason.trim()) { setError('수동 보상 처리 사유를 입력해 주세요.'); return; }
		if (executionToken.current) return;
		const token = Symbol('referral-execution');
		executionToken.current = token;
		if (!(await confirm({ message: mode === 'STANDARD' ? '추천 관계를 연결하고 양측 보상을 지급할까요?' : '기존 수동 보상으로 관계만 연결할까요?' }))) {
			if (executionToken.current === token) executionToken.current = null;
			return;
		}
		const version = requestVersion.current;
		try {
			setLoading(true); setError(null);
			const idempotencyKey = key ?? crypto.randomUUID();
			setKey(idempotencyKey);
			const result = await referrals.connect(userId, { referralCode: previewedCode, mode, reason: reason.trim() || undefined }, idempotencyKey);
			if (version === requestVersion.current) {
				setPreview(result);
				onCompleted?.();
			}
		} catch (err) {
			if (version === requestVersion.current) {
				setError(getAdminErrorMessage(err, '추천 관계 연결에 실패했습니다.'));
			}
		} finally {
			if (executionToken.current === token) executionToken.current = null;
			if (version === requestVersion.current) setLoading(false);
		}
	};

	return <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
		<Typography variant="subtitle1">가입 후 초대코드 연결</Typography>
		<Typography variant="caption" color="text.secondary">가입일: {createdAt ?? '-'}. 서버가 7일·실사용자·중복 보상 정책을 최종 검증합니다.</Typography>
		<Box sx={{ display: 'flex', gap: 1, mt: 1 }}><TextField size="small" label="초대코드" value={code} onChange={(event) => { requestVersion.current += 1; executionToken.current = null; setCode(event.target.value); setReason(''); setPreview(null); setPreviewedCode(null); setError(null); setKey(null); setLoading(false); }} /><Button disabled={loading || !code.trim()} onClick={lookup}>조회</Button></Box>
		{error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
		{preview && <Box sx={{ mt: 1 }}>
			<Typography variant="body2">상태: {preview.state}{preview.reason ? ` (${preview.reason})` : ''}</Typography>
			<Typography variant="body2">초대한 사람: {preview.inviter ? `${preview.inviter.name} · ${preview.inviter.phoneSuffix}` : '없음'}</Typography>
			{preview.invitation && <Typography variant="caption">초대 ID: {preview.invitation.id} · 보상: {preview.invitation.rewardMode}/{preview.invitation.rewardStatus}</Typography>}
			{preview.allowedActions.includes('MANUAL_COMPENSATED') && <TextField size="small" fullWidth sx={{ mt: 1 }} label="수동 보상 처리 사유" value={reason} onChange={(event) => setReason(event.target.value)} />}
			<Box sx={{ display: 'flex', gap: 1, mt: 1 }}>{preview.allowedActions.includes('STANDARD') && <Button variant="contained" disabled={loading} onClick={() => execute('STANDARD')}>연결 및 보상</Button>}{preview.allowedActions.includes('MANUAL_COMPENSATED') && <Button variant="outlined" disabled={loading} onClick={() => execute('MANUAL_COMPENSATED')}>관계만 연결</Button>}</Box>
		</Box>}
	</Paper>;
}
