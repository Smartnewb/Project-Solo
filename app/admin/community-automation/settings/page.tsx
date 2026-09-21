'use client';

import { useCallback, useEffect, useState } from 'react';
import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	FormControlLabel,
	Switch,
	TextField,
	Typography,
} from '@mui/material';
import type { CommunitySettings, KillSwitchStatus } from '@/app/services/admin/community-automation';
import { communitySettings as settingsApi } from '@/app/services/admin/community-automation';

export default function SettingsPage() {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [killSwitch, setKillSwitch] = useState<KillSwitchStatus | null>(null);
	const [settings, setSettings] = useState<CommunitySettings | null>(null);

	const [killActionLoading, setKillActionLoading] = useState(false);
	const [killConfirmOpen, setKillConfirmOpen] = useState(false);
	const [killConfirmAction, setKillConfirmAction] = useState<'kill' | 'restore'>('kill');

	const [settingsLoading, setSettingsLoading] = useState(false);
	const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
	const [resetLoading, setResetLoading] = useState(false);

	const [form, setForm] = useState<CommunitySettings>({
		dagRunEnabled: true,
		publishEnabled: true,
		activitySimulatorEnabled: true,
		maxDailyPublish: 50,
		reviewRequiredBeforePublish: true,
	});

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const [ks, s] = await Promise.all([
				settingsApi.getKillSwitch(),
				settingsApi.get(),
			]);
			setKillSwitch(ks);
			setSettings(s);
			setForm(s);
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : '불러오기 실패');
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	async function handleKillConfirm() {
		setKillActionLoading(true);
		try {
			if (killConfirmAction === 'kill') {
				await settingsApi.kill();
			} else {
				await settingsApi.restore();
			}
			setKillConfirmOpen(false);
			await load();
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : '킬 스위치 처리 실패');
		} finally {
			setKillActionLoading(false);
		}
	}

	async function handleSettingsSave() {
		setSettingsLoading(true);
		try {
			const updated = await settingsApi.update(form);
			setSettings(updated);
			setForm(updated);
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : '설정 저장 실패');
		} finally {
			setSettingsLoading(false);
		}
	}

	async function handleReset() {
		setResetLoading(true);
		try {
			const defaults = await settingsApi.reset();
			setSettings(defaults);
			setForm(defaults);
			setResetConfirmOpen(false);
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : '초기화 실패');
		} finally {
			setResetLoading(false);
		}
	}

	if (loading) {
		return (
			<Box display="flex" justifyContent="center" py={6}>
				<CircularProgress />
			</Box>
		);
	}

	return (
		<Box maxWidth={600}>
			{error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

			{/* Kill Switch */}
			<Card variant="outlined" sx={{ mb: 3 }}>
				<CardContent>
					<Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
						<Typography variant="h6">긴급 킬 스위치</Typography>
						{killSwitch && (
							<Chip
								label={killSwitch.killed ? '중단됨' : '운영 중'}
								color={killSwitch.killed ? 'error' : 'success'}
							/>
						)}
					</Box>
					<Typography variant="body2" color="text.secondary" mb={2}>
						활성화 시 DAG 생성·발화·Activity Simulator 전체 즉시 차단됩니다.
					</Typography>
					<Box display="flex" gap={2}>
						{killSwitch?.killed ? (
							<Button
								variant="contained"
								color="success"
								onClick={() => { setKillConfirmAction('restore'); setKillConfirmOpen(true); }}
							>
								자동화 재개
							</Button>
						) : (
							<Button
								variant="contained"
								color="error"
								onClick={() => { setKillConfirmAction('kill'); setKillConfirmOpen(true); }}
							>
								긴급 중단
							</Button>
						)}
					</Box>
				</CardContent>
			</Card>

			<Divider sx={{ my: 3 }} />

			{/* Settings Form */}
			<Typography variant="h6" mb={2}>자동화 설정</Typography>

			<Box display="flex" flexDirection="column" gap={2}>
				<FormControlLabel
					control={
						<Switch
							checked={form.dagRunEnabled}
							onChange={(e) => setForm((f) => ({ ...f, dagRunEnabled: e.target.checked }))}
						/>
					}
					label="DAG Run 활성화"
				/>
				<FormControlLabel
					control={
						<Switch
							checked={form.publishEnabled}
							onChange={(e) => setForm((f) => ({ ...f, publishEnabled: e.target.checked }))}
						/>
					}
					label="발화(Publish) 활성화"
				/>
				<FormControlLabel
					control={
						<Switch
							checked={form.activitySimulatorEnabled}
							onChange={(e) => setForm((f) => ({ ...f, activitySimulatorEnabled: e.target.checked }))}
						/>
					}
					label="Activity Simulator 활성화"
				/>
				<FormControlLabel
					control={
						<Switch
							checked={form.reviewRequiredBeforePublish}
							onChange={(e) => setForm((f) => ({ ...f, reviewRequiredBeforePublish: e.target.checked }))}
						/>
					}
					label="발화 전 검수 필요"
				/>
				<TextField
					label="일일 최대 발화 수"
					type="number"
					inputProps={{ min: 1, max: 500 }}
					value={form.maxDailyPublish}
					onChange={(e) =>
						setForm((f) => ({
							...f,
							maxDailyPublish: Math.max(1, Math.min(500, Number(e.target.value))),
						}))
					}
					sx={{ maxWidth: 200 }}
				/>
			</Box>

			<Box display="flex" gap={2} mt={3}>
				<Button
					variant="contained"
					disabled={settingsLoading}
					onClick={handleSettingsSave}
				>
					{settingsLoading ? <CircularProgress size={16} /> : '저장'}
				</Button>
				<Button
					variant="outlined"
					color="warning"
					onClick={() => setResetConfirmOpen(true)}
				>
					기본값으로 초기화
				</Button>
			</Box>

			{/* Kill Confirm Dialog */}
			<Dialog open={killConfirmOpen} onClose={() => setKillConfirmOpen(false)} maxWidth="xs">
				<DialogTitle>
					{killConfirmAction === 'kill' ? '긴급 중단 확인' : '자동화 재개 확인'}
				</DialogTitle>
				<DialogContent>
					{killConfirmAction === 'kill' ? (
						<Typography color="error">
							전체 커뮤니티 자동화를 즉시 중단합니다. DAG 생성, 발화, Activity Simulator가 모두 차단됩니다.
						</Typography>
					) : (
						<Typography>커뮤니티 자동화를 재개합니다.</Typography>
					)}
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setKillConfirmOpen(false)}>취소</Button>
					<Button
						variant="contained"
						color={killConfirmAction === 'kill' ? 'error' : 'success'}
						disabled={killActionLoading}
						onClick={handleKillConfirm}
					>
						{killActionLoading ? <CircularProgress size={16} /> : '확인'}
					</Button>
				</DialogActions>
			</Dialog>

			{/* Reset Confirm Dialog */}
			<Dialog open={resetConfirmOpen} onClose={() => setResetConfirmOpen(false)} maxWidth="xs">
				<DialogTitle>기본값으로 초기화</DialogTitle>
				<DialogContent>
					<Typography>설정을 기본값으로 초기화하시겠습니까?</Typography>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setResetConfirmOpen(false)}>취소</Button>
					<Button variant="contained" color="warning" disabled={resetLoading} onClick={handleReset}>
						{resetLoading ? <CircularProgress size={16} /> : '초기화'}
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
}
