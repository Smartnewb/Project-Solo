'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
	Alert,
	Box,
	Button,
	Chip,
	CircularProgress,
	FormControlLabel,
	MenuItem,
	Paper,
	Switch,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TextField,
	Typography,
} from '@mui/material';
import AdminService from '@/app/services/admin';
import type {
	UtmDashboardSurfaces,
	UtmReconciliationResponse,
	UtmReconciliationRow,
} from '@/app/services/admin';

type DatePreset = '오늘' | '7일' | '30일' | '이번달';

const DATE_PRESETS: DatePreset[] = ['오늘', '7일', '30일', '이번달'];

function getDateRange(preset: DatePreset): { startDate: string; endDate: string } {
	const now = new Date();
	const endDate = now.toISOString().split('T')[0];

	if (preset === '오늘') return { startDate: endDate, endDate };
	if (preset === '7일') {
		const start = new Date(now);
		start.setDate(start.getDate() - 7);
		return { startDate: start.toISOString().split('T')[0], endDate };
	}
	if (preset === '30일') {
		const start = new Date(now);
		start.setDate(start.getDate() - 30);
		return { startDate: start.toISOString().split('T')[0], endDate };
	}

	const start = new Date(now.getFullYear(), now.getMonth(), 1);
	return { startDate: start.toISOString().split('T')[0], endDate };
}

function formatNumber(value: number | null | undefined): string {
	if (value == null) return '-';
	return value.toLocaleString();
}

function formatCurrency(value: number): string {
	return `₩${value.toLocaleString()}`;
}

function coveragePercent(value: number, total: number): string {
	if (total <= 0) return '0%';
	return `${Math.round((value / total) * 100)}%`;
}

function formatDashboardError(error: any): string {
	const message = error.response?.data?.message || error.message || '데이터를 불러오지 못했습니다.';
	if (typeof message === 'string' && message.includes('Cannot GET /api/admin/v2/utm/dashboard')) {
		return '백엔드 배포가 아직 새 UTM 성과 API를 로드하지 않았습니다. 잠시 후 다시 시도하세요.';
	}
	return message;
}

export default function UtmDashboard() {
	const [datePreset, setDatePreset] = useState<DatePreset>('7일');
	const [includeExtraMonitored, setIncludeExtraMonitored] = useState(false);
	const [surfaces, setSurfaces] = useState<UtmDashboardSurfaces | null>(null);
	const [reconciliation, setReconciliation] = useState<UtmReconciliationResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const { startDate, endDate } = useMemo(() => getDateRange(datePreset), [datePreset]);
	const rangeLabel = `${startDate} ~ ${endDate}`;

	const fetchData = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const [surfaceData, reconciliationData] = await Promise.all([
				AdminService.utm.getSurfaces({ startDate, endDate, includeExtraMonitored }),
				AdminService.utm.getReconciliation(startDate, endDate),
			]);
			setSurfaces(surfaceData);
			setReconciliation(reconciliationData);
		} catch (err: any) {
			setError(formatDashboardError(err));
		} finally {
			setLoading(false);
		}
	}, [startDate, endDate, includeExtraMonitored]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	if (loading && !surfaces) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
				<CircularProgress />
			</Box>
		);
	}

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
			{error && (
				<Alert
					severity="error"
					onClose={() => setError(null)}
					action={
						<Button color="inherit" size="small" onClick={fetchData}>
							다시 불러오기
						</Button>
					}
				>
					{error}
				</Alert>
			)}

			<Paper variant="outlined" sx={{ p: 3 }}>
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'space-between',
						gap: 2,
						flexWrap: 'wrap',
						alignItems: 'flex-start',
					}}
				>
					<Box>
						<Typography variant="h6" fontWeight={700}>
							Meta 오프라인 리드 성과 대시보드
						</Typography>
						<Typography variant="body2" color="textSecondary" sx={{ mt: 0.75 }}>
							{rangeLabel} 기준으로 Meta 집행 지표, 웹 UTM 트래픽, 앱 가입 cohort를 따로 봅니다.
						</Typography>
					</Box>
					<Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
						<Chip size="small" color="primary" label="core monitored 기본" />
						<Chip size="small" variant="outlined" label="festival-region 별도" />
						<Chip size="small" variant="outlined" label="signup row reconciliation" />
					</Box>
				</Box>
			</Paper>

			<Paper variant="outlined" sx={{ p: 2 }}>
				<Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
					<TextField
						select
						label="기간"
						value={datePreset}
						onChange={(e) => setDatePreset(e.target.value as DatePreset)}
						size="small"
						sx={{ minWidth: 120 }}
					>
						{DATE_PRESETS.map((preset) => (
							<MenuItem key={preset} value={preset}>
								{preset}
							</MenuItem>
						))}
					</TextField>
					<FormControlLabel
						control={
							<Switch
								checked={includeExtraMonitored}
								onChange={(e) => setIncludeExtraMonitored(e.target.checked)}
							/>
						}
						label="festival-region extra monitored 포함"
					/>
					<Typography variant="caption" color="textSecondary">
						기본 CAC/signup은 core monitored UTM만 사용합니다.
					</Typography>
					{loading && <CircularProgress size={18} />}
				</Box>
			</Paper>

			{surfaces && (
				<>
					<Box
						sx={{
							display: 'grid',
							gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
							gap: 2,
						}}
					>
						<HeadlineStat
							label="Core signups"
							value={formatNumber(surfaces.appSignupCohort.coreSignups)}
							helper="headline CAC/signup 기본 분모"
						/>
						<HeadlineStat
							label="DB signups"
							value={formatNumber(surfaces.appSignupCohort.dbSignups)}
							helper={includeExtraMonitored ? 'extra 포함' : 'extra 제외'}
						/>
						<HeadlineStat
							label="Revenue"
							value={formatCurrency(surfaces.appSignupCohort.revenue)}
							helper={`${formatNumber(surfaces.appSignupCohort.payments)} payments`}
						/>
						<HeadlineStat
							label="Payment event coverage"
							value={`${surfaces.appSignupCohort.coverage.paymentEventId}%`}
							helper="신규 결제 event_id 수집률"
						/>
					</Box>

					<Box
						sx={{
							display: 'grid',
							gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, 1fr)' },
							gap: 2,
						}}
					>
						<SurfacePanel
							title="Meta delivery/actions"
							subtitle="Meta 지표는 DB cohort와 다른 출처입니다."
							rows={[
								['Spend', formatNumber(surfaces.metaDeliveryActions.spend)],
								['Impressions', formatNumber(surfaces.metaDeliveryActions.impressions)],
								['Link clicks', formatNumber(surfaces.metaDeliveryActions.linkClicks)],
								['Meta registrations', formatNumber(surfaces.metaDeliveryActions.metaRegistrations)],
								['Meta purchases', formatNumber(surfaces.metaDeliveryActions.metaPurchases)],
							]}
							footer={`${surfaces.metaDeliveryActions.source} · ${surfaces.metaDeliveryActions.status}`}
						/>
						<SurfacePanel
							title="Web UTM traffic"
							subtitle="방문/리다이렉트와 내부/봇/반복 트래픽을 분리합니다."
							rows={[
								['Total', formatNumber(surfaces.webUtmTraffic.total)],
								['Redirect / page visit', `${formatNumber(surfaces.webUtmTraffic.redirect)} / ${formatNumber(surfaces.webUtmTraffic.pageVisit)}`],
								['Setup / internal / bot / external', `${formatNumber(surfaces.webUtmTraffic.setup)} / ${formatNumber(surfaces.webUtmTraffic.internal)} / ${formatNumber(surfaces.webUtmTraffic.bot)} / ${formatNumber(surfaces.webUtmTraffic.external)}`],
								['Repeat / unique touch', `${formatNumber(surfaces.webUtmTraffic.repeat)} / ${formatNumber(surfaces.webUtmTraffic.uniqueTouch)}`],
								['Core / extra monitored', `${formatNumber(surfaces.webUtmTraffic.monitoredCore)} / ${formatNumber(surfaces.webUtmTraffic.extraMonitored)}`],
							]}
						/>
						<SurfacePanel
							title="App-attributed signup cohort"
							subtitle="DB signup/payment/revenue 기준 cohort입니다."
							rows={[
								['DB signups', formatNumber(surfaces.appSignupCohort.dbSignups)],
								['Approved', formatNumber(surfaces.appSignupCohort.approved)],
								['Purchasers / payments', `${formatNumber(surfaces.appSignupCohort.purchasers)} / ${formatNumber(surfaces.appSignupCohort.payments)}`],
								['Revenue', formatCurrency(surfaces.appSignupCohort.revenue)],
								['Coverage', `attribution ${surfaces.appSignupCohort.coverage.attributionId}% · payment event ${surfaces.appSignupCohort.coverage.paymentEventId}%`],
							]}
							footer={`core ${surfaces.appSignupCohort.coreSignups.toLocaleString()} · extra ${surfaces.appSignupCohort.extraSignups.toLocaleString()}`}
						/>
					</Box>

					<Paper variant="outlined" sx={{ p: 3 }}>
						<Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
							Extra monitored
						</Typography>
						<Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
							festival-region UTM은 기본 headline CAC/signup에서 제외하고, 토글을 켰을 때만
							App cohort 합산에 포함합니다.
						</Typography>
						<Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
							<Chip label={`core signups ${surfaces.appSignupCohort.coreSignups.toLocaleString()}`} />
							<Chip label={`extra signups ${surfaces.appSignupCohort.extraSignups.toLocaleString()}`} />
							<Chip
								color={includeExtraMonitored ? 'primary' : 'default'}
								label={includeExtraMonitored ? 'extra included' : 'extra excluded'}
							/>
						</Box>
					</Paper>
				</>
			)}

			{reconciliation && <ReconciliationSection data={reconciliation} />}
		</Box>
	);
}

function HeadlineStat({ label, value, helper }: { label: string; value: string; helper: string }) {
	return (
		<Paper variant="outlined" sx={{ p: 2 }}>
			<Typography variant="caption" color="textSecondary">
				{label}
			</Typography>
			<Typography variant="h5" fontWeight={800} sx={{ mt: 0.5 }}>
				{value}
			</Typography>
			<Typography variant="caption" color="textSecondary">
				{helper}
			</Typography>
		</Paper>
	);
}

function SurfacePanel({
	title,
	subtitle,
	rows,
	footer,
}: {
	title: string;
	subtitle: string;
	rows: Array<[string, string]>;
	footer?: string;
}) {
	return (
		<Paper variant="outlined" sx={{ p: 2.5 }}>
			<Typography variant="subtitle1" fontWeight={700}>
				{title}
			</Typography>
			<Typography variant="caption" color="textSecondary">
				{subtitle}
			</Typography>
			<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, mt: 2 }}>
				{rows.map(([label, value]) => (
					<Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
						<Typography variant="body2" color="textSecondary">
							{label}
						</Typography>
						<Typography variant="body2" fontWeight={700} align="right">
							{value}
						</Typography>
					</Box>
				))}
			</Box>
			{footer && (
				<Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 2 }}>
					{footer}
				</Typography>
			)}
		</Paper>
	);
}

function ReconciliationSection({ data }: { data: UtmReconciliationResponse }) {
	const coverage = data.coverage;
	return (
		<Paper variant="outlined" sx={{ p: 3 }}>
			<Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
				Reconciliation
			</Typography>
			<Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
				signup row 기준으로 attribution/payment/CAPI coverage를 확인합니다. iOS는 Android와 같은
				post-install referrer가 없어 payment_event_id와 CAPI event 수신으로 gap을 별도 확인합니다.
			</Typography>
			<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(6, 1fr)' }, gap: 2, mb: 3 }}>
				<CoverageStat label="Total" value={coverage.total.toLocaleString()} />
				<CoverageStat
					label="Attribution"
					value={coveragePercent(coverage.withAttributionId, coverage.total)}
				/>
				<CoverageStat
					label="Signup event"
					value={coveragePercent(coverage.withSignupEventId, coverage.total)}
				/>
				<CoverageStat label="Payment" value={coverage.withPayment.toLocaleString()} />
				<CoverageStat
					label="Payment event"
					value={coveragePercent(coverage.withPaymentEventId, coverage.total)}
				/>
				<CoverageStat
					label="Meta CAPI"
					value={coveragePercent(coverage.withMetaCapiEvent, coverage.total)}
				/>
			</Box>
			<BreakdownChips title="Platform" rows={data.breakdown.platform} />
			<BreakdownChips title="App version" rows={data.breakdown.appVersion} />
			<BreakdownChips title="Pre/Post fix" rows={data.breakdown.preFixPostFix} />
			<ReconciliationTable rows={data.rows} />
		</Paper>
	);
}

function CoverageStat({ label, value }: { label: string; value: string }) {
	return (
		<Box>
			<Typography variant="caption" color="textSecondary">
				{label}
			</Typography>
			<Typography variant="h6" fontWeight={700}>
				{value}
			</Typography>
		</Box>
	);
}

function BreakdownChips({ title, rows }: { title: string; rows: Array<{ key: string; count: number }> }) {
	return (
		<Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', mb: 1.5 }}>
			<Typography variant="caption" color="textSecondary" sx={{ minWidth: 80 }}>
				{title}
			</Typography>
			{rows.slice(0, 8).map((row) => (
				<Chip key={`${title}-${row.key}`} size="small" label={`${row.key}: ${row.count}`} />
			))}
		</Box>
	);
}

function ReconciliationTable({ rows }: { rows: UtmReconciliationRow[] }) {
	return (
		<TableContainer sx={{ mt: 2, maxHeight: 520 }}>
			<Table size="small" stickyHeader>
				<TableHead>
					<TableRow>
						<TableCell>User</TableCell>
						<TableCell>Platform</TableCell>
						<TableCell>App version</TableCell>
						<TableCell>Pre/Post</TableCell>
						<TableCell>UTM</TableCell>
						<TableCell>Signup event</TableCell>
						<TableCell>Payment event</TableCell>
						<TableCell>Meta CAPI</TableCell>
						<TableCell>fbclid/fbc/fbp</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{rows.slice(0, 100).map((row) => (
						<TableRow key={row.id} hover>
							<TableCell>{row.userId}</TableCell>
							<TableCell>{row.platform}</TableCell>
							<TableCell>{row.appVersion}</TableCell>
							<TableCell>{row.preFixPostFix}</TableCell>
							<TableCell>
								<Typography variant="caption">
									{row.utmSource ?? '-'} / {row.utmCampaign ?? '-'}
								</Typography>
							</TableCell>
							<TableCell>{row.signupEventId ?? '-'}</TableCell>
							<TableCell>{row.paymentEventId ?? '-'}</TableCell>
							<TableCell>
								<Chip
									size="small"
									color={row.metaCapi.eventsReceived > 0 ? 'success' : 'default'}
									label={row.metaCapi.status}
								/>
								{row.metaCapi.error && (
									<Typography variant="caption" color="error" sx={{ display: 'block' }}>
										{row.metaCapi.error}
									</Typography>
								)}
							</TableCell>
							<TableCell>
								<Typography variant="caption">
									{[row.fbclid, row.fbc, row.fbp].filter(Boolean).length}/3
								</Typography>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</TableContainer>
	);
}
