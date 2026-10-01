'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
	Alert,
	Box,
	Button,
	CircularProgress,
	Paper,
	Stack,
	Typography,
} from '@mui/material';
import { Globe, RefreshCw, ShieldCheck } from 'lucide-react';
import { jpIdentity } from '@/app/services/admin';
import type { JpIdentitySubmission } from '@/app/services/admin';
import { AdminApiError, getAdminErrorMessage } from '@/shared/lib/http/admin-fetch';
import { useAdminSession } from '@/shared/contexts/admin-session-context';
import { AdminCountrySelectorModal } from '@/shared/ui/admin/admin-country-selector';
import { useConfirm } from '@/shared/ui/admin/confirm-dialog';
import { useToast } from '@/shared/ui/admin/toast';
import { JpIdentityCard } from './components/JpIdentityCard';
import { JpIdentityRejectDialog } from './components/JpIdentityRejectDialog';
import { formatJpDocumentType } from './utils';

const COUNTRY_NOTICE = '일본(JP)으로 국가를 전환한 뒤 이용하세요';

export default function JpIdentityReviewPage() {
	const { session } = useAdminSession();
	const isJp = session?.selectedCountry === 'jp';
	const toast = useToast();
	const confirm = useConfirm();

	const latestLoad = useRef(0);
	const [items, setItems] = useState<readonly JpIdentitySubmission[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [processingId, setProcessingId] = useState<string | null>(null);
	const [refreshingId, setRefreshingId] = useState<string | null>(null);
	const [rejectTarget, setRejectTarget] = useState<JpIdentitySubmission | null>(null);
	const [countryModalOpen, setCountryModalOpen] = useState(false);

	const load = useCallback(async () => {
		const requestId = ++latestLoad.current;
		setLoading(true);
		setError(null);
		try {
			const data = await jpIdentity.getPending();
			if (requestId !== latestLoad.current) return;
			setItems(data);
		} catch (loadError) {
			if (requestId !== latestLoad.current) return;
			setError(getAdminErrorMessage(loadError, '대기 중인 신분증 목록을 불러오지 못했습니다.'));
			setItems([]);
		} finally {
			if (requestId === latestLoad.current) setLoading(false);
		}
	}, []);

	useEffect(() => {
		if (!isJp) {
			latestLoad.current += 1;
			setItems([]);
			setLoading(false);
			setError(null);
			return;
		}
		load();
	}, [isJp, load]);

	const replaceItem = (next: JpIdentitySubmission) => {
		setItems((current) => current.map((item) => (item.id === next.id ? next : item)));
	};

	/** 404/409 는 목록이 이미 바뀌었다는 뜻이라 메시지 후 재조회. */
	const handleActionError = async (actionError: unknown, fallback: string) => {
		if (actionError instanceof AdminApiError && actionError.status === 409) {
			toast.warning('이미 처리된 신청입니다. 목록을 새로고침합니다.');
			await load();
			return;
		}
		if (actionError instanceof AdminApiError && actionError.status === 404) {
			toast.warning('신청을 찾을 수 없습니다. 목록을 새로고침합니다.');
			await load();
			return;
		}
		toast.error(getAdminErrorMessage(actionError, fallback));
	};

	const handleApprove = async (item: JpIdentitySubmission) => {
		if (!isJp || processingId) return;
		const name = item.account?.name ?? item.extracted.name ?? item.userId;
		const ok = await confirm({
			title: '신분증 승인',
			message: `${name} 님의 ${formatJpDocumentType(item.documentType)} 제출을 승인할까요? 승인 후에는 되돌릴 수 없습니다.`,
			confirmText: '승인',
		});
		if (!ok) return;
		setProcessingId(item.id);
		try {
			const result = await jpIdentity.approve(item.id);
			toast.success(result.message || '승인 처리했습니다.');
			await load();
		} catch (actionError) {
			await handleActionError(actionError, '승인에 실패했습니다.');
		} finally {
			setProcessingId(null);
		}
	};

	const handleRejectConfirm = async (reason: string) => {
		if (!isJp || !rejectTarget) return;
		if (!reason) {
			toast.error('거절 사유를 입력해주세요.');
			return;
		}
		setProcessingId(rejectTarget.id);
		try {
			const result = await jpIdentity.reject(rejectTarget.id, reason);
			toast.success(result.message || '거절 처리했습니다.');
			setRejectTarget(null);
			await load();
		} catch (actionError) {
			await handleActionError(actionError, '거절에 실패했습니다.');
		} finally {
			setProcessingId(null);
		}
	};

	const handleRefreshImage = async (item: JpIdentitySubmission) => {
		if (!isJp || refreshingId) return;
		setRefreshingId(item.id);
		try {
			const fresh = await jpIdentity.getById(item.id);
			replaceItem(fresh);
		} catch (refreshError) {
			toast.error(getAdminErrorMessage(refreshError, '이미지를 다시 불러오지 못했습니다.'));
		} finally {
			setRefreshingId(null);
		}
	};

	return (
		<Box>
			<Stack
				direction={{ xs: 'column', lg: 'row' }}
				justifyContent="space-between"
				alignItems={{ xs: 'flex-start', lg: 'center' }}
				spacing={1.5}
				sx={{ mb: 2 }}
			>
				<Stack direction="row" spacing={1} alignItems="center">
					<ShieldCheck size={26} />
					<Box>
						<Typography variant="h4" component="h1" fontWeight={800}>
							일본 신분증 심사
						</Typography>
						<Typography variant="body2" color="text.secondary">
							일본 유저의 연령 확인 서류를 검토해 승인/거절합니다. 대기·수동 심사 건만 표시됩니다.
							{isJp && !loading && !error ? <Box component="span" sx={{ whiteSpace: 'nowrap' }}>{` · 대기 ${items.length.toLocaleString()}건`}</Box> : ''}
						</Typography>
					</Box>
				</Stack>
				{isJp && (
					<Button
						size="small"
						variant="outlined"
						startIcon={<RefreshCw size={16} />}
						sx={{ flexShrink: 0, whiteSpace: 'nowrap' }}
						onClick={load}
						disabled={loading || processingId !== null}
					>
						새로고침
					</Button>
				)}
			</Stack>

			{!isJp ? (
				<Paper variant="outlined" sx={{ p: 3 }}>
					<Stack spacing={1.5} alignItems="flex-start">
						<Alert severity="warning" sx={{ width: '100%' }}>
							{COUNTRY_NOTICE}
						</Alert>
						<Typography variant="body2" color="text.secondary">
							이 화면은 일본(jp) 데이터만 조회합니다. 현재 선택된 국가:{' '}
							<strong>{(session?.selectedCountry ?? 'kr').toUpperCase()}</strong>
						</Typography>
						<Button
							variant="contained"
							startIcon={<Globe size={16} />}
							onClick={() => setCountryModalOpen(true)}
						>
							국가 전환
						</Button>
					</Stack>
				</Paper>
			) : loading ? (
				<Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
					<CircularProgress />
				</Box>
			) : error ? (
				<Alert
					severity="error"
					action={
						<Button color="inherit" size="small" onClick={load}>
							재시도
						</Button>
					}
				>
					{error}
				</Alert>
			) : items.length === 0 ? (
				<Paper variant="outlined" sx={{ p: 6, textAlign: 'center' }}>
					<Typography color="text.secondary">대기 중인 신분증이 없습니다</Typography>
				</Paper>
			) : (
				<Stack spacing={2} component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
					{items.map((item) => (
						<Box component="li" key={item.id}>
							<JpIdentityCard
								item={item}
								busy={processingId !== null}
								refreshing={refreshingId === item.id}
								onApprove={handleApprove}
								onReject={setRejectTarget}
								onRefreshImage={handleRefreshImage}
							/>
						</Box>
					))}
				</Stack>
			)}

			<JpIdentityRejectDialog
				target={rejectTarget}
				busy={processingId !== null}
				onClose={() => setRejectTarget(null)}
				onConfirm={handleRejectConfirm}
			/>

			<AdminCountrySelectorModal open={countryModalOpen} onClose={() => setCountryModalOpen(false)} />
		</Box>
	);
}
