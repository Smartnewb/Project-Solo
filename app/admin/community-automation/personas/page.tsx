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
	FormControl,
	Grid,
	InputLabel,
	MenuItem,
	Paper,
	Select,
	Slider,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography,
} from '@mui/material';
import type {
	GhostPersonaInfo,
	PersonaDiversityReport,
	CommunityTraits,
	ReactionSpeed,
	ActivityCurve,
} from '@/app/services/admin/community-automation';
import { personas as personasApi } from '@/app/services/admin/community-automation';

export default function PersonasPage() {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [items, setItems] = useState<GhostPersonaInfo[]>([]);
	const [diversity, setDiversity] = useState<PersonaDiversityReport | null>(null);

	const [traitTarget, setTraitTarget] = useState<string | null>(null);
	const [traitForm, setTraitForm] = useState<CommunityTraits>({});
	const [traitLoading, setTraitLoading] = useState(false);

	const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
	const [deleteLoading, setDeleteLoading] = useState(false);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const [list, div] = await Promise.all([
				personasApi.list(),
				personasApi.diversity(),
			]);
			setItems(list);
			setDiversity(div);
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : '불러오기 실패');
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	function openTraitDialog(persona: GhostPersonaInfo) {
		setTraitTarget(persona.id);
		setTraitForm({ ...persona.communityTraits });
	}

	async function handleTraitSave() {
		if (!traitTarget) return;
		setTraitLoading(true);
		try {
			await personasApi.setTraits(traitTarget, traitForm);
			setTraitTarget(null);
			await load();
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : '트레이트 저장 실패');
		} finally {
			setTraitLoading(false);
		}
	}

	async function handleTraitDelete() {
		if (!deleteTarget) return;
		setDeleteLoading(true);
		try {
			await personasApi.deleteTraits(deleteTarget);
			setDeleteTarget(null);
			await load();
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : '트레이트 삭제 실패');
		} finally {
			setDeleteLoading(false);
		}
	}

	return (
		<Box>
			{error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

			{loading ? (
				<Box display="flex" justifyContent="center" py={6}>
					<CircularProgress />
				</Box>
			) : (
				<>
					{diversity && (
						<>
							<Typography variant="h6" mb={1}>다양성 리포트</Typography>
							<Grid container spacing={2} mb={3}>
								<Grid item xs={6} sm={3}>
									<Card variant="outlined">
										<CardContent>
											<Typography variant="caption" color="text.secondary">활성 Ghost</Typography>
											<Typography variant="h4" fontWeight={700}>{diversity.totalActiveGhosts}</Typography>
										</CardContent>
									</Card>
								</Grid>
								<Grid item xs={6} sm={3}>
									<Card variant="outlined">
										<CardContent>
											<Typography variant="caption" color="text.secondary">다양성 점수</Typography>
											<Typography variant="h4" fontWeight={700} color="success.main">
												{diversity.diversityScore.toFixed(2)}
											</Typography>
										</CardContent>
									</Card>
								</Grid>
							</Grid>

							<Typography variant="subtitle2" mb={1}>아키타입 분포</Typography>
							<TableContainer component={Paper} sx={{ mb: 3 }}>
								<Table size="small">
									<TableHead>
										<TableRow>
											<TableCell>아키타입 코드</TableCell>
											<TableCell align="right">수량</TableCell>
											<TableCell align="right">비율 (%)</TableCell>
										</TableRow>
									</TableHead>
									<TableBody>
										{diversity.archetypeDistribution.map((row) => (
											<TableRow key={row.archetypeCode}>
												<TableCell>{row.archetypeCode}</TableCell>
												<TableCell align="right">{row.count}</TableCell>
												<TableCell align="right">{row.percentage.toFixed(1)}</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</TableContainer>
							<Divider sx={{ my: 2 }} />
						</>
					)}

					<Typography variant="h6" mb={1}>Ghost 페르소나 목록</Typography>
					<TableContainer component={Paper}>
						<Table size="small">
							<TableHead>
								<TableRow>
									<TableCell>아키타입</TableCell>
									<TableCell>상태</TableCell>
									<TableCell>반응 속도</TableCell>
									<TableCell>노이즈 강도</TableCell>
									<TableCell>활동 커브</TableCell>
									<TableCell align="right">트레이트</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{items.length === 0 ? (
									<TableRow>
										<TableCell colSpan={6} align="center">활성 Ghost 없음</TableCell>
									</TableRow>
								) : items.map((p) => (
									<TableRow key={p.id} hover>
										<TableCell>
											<Typography variant="body2" fontWeight={500}>{p.archetypeName}</Typography>
											<Typography variant="caption" color="text.secondary">{p.archetypeCode}</Typography>
										</TableCell>
										<TableCell>
											<Chip label={p.status} size="small" color={p.status === 'ACTIVE' ? 'success' : 'default'} />
										</TableCell>
										<TableCell>{p.communityTraits.reactionSpeed ?? '-'}</TableCell>
										<TableCell>{p.communityTraits.noiseStrength ?? '-'}</TableCell>
										<TableCell>{p.communityTraits.activityCurve ?? '-'}</TableCell>
										<TableCell align="right">
											<Box display="flex" gap={0.5} justifyContent="flex-end">
												<Button size="small" variant="outlined" onClick={() => openTraitDialog(p)}>
													편집
												</Button>
												<Button
													size="small"
													variant="outlined"
													color="error"
													onClick={() => setDeleteTarget(p.id)}
												>
													초기화
												</Button>
											</Box>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</TableContainer>
				</>
			)}

			{/* Trait Edit Dialog */}
			<Dialog open={!!traitTarget} onClose={() => setTraitTarget(null)} maxWidth="xs" fullWidth>
				<DialogTitle>커뮤니티 트레이트 설정</DialogTitle>
				<DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: '16px !important' }}>
					<FormControl size="small">
						<InputLabel>반응 속도</InputLabel>
						<Select
							value={traitForm.reactionSpeed ?? ''}
							label="반응 속도"
							onChange={(e) => setTraitForm((f) => ({ ...f, reactionSpeed: (e.target.value as ReactionSpeed) || undefined }))}
						>
							<MenuItem value="">미설정</MenuItem>
							<MenuItem value="high">빠름 (high)</MenuItem>
							<MenuItem value="mid">보통 (mid)</MenuItem>
							<MenuItem value="low">느림 (low)</MenuItem>
						</Select>
					</FormControl>

					<Box>
						<Typography variant="caption" gutterBottom display="block">
							노이즈 강도: {traitForm.noiseStrength ?? 0}
						</Typography>
						<Slider
							value={traitForm.noiseStrength ?? 0}
							min={0}
							max={1}
							step={0.05}
							valueLabelDisplay="auto"
							onChange={(_, v) => setTraitForm((f) => ({ ...f, noiseStrength: v as number }))}
						/>
					</Box>

					<FormControl size="small">
						<InputLabel>활동 커브</InputLabel>
						<Select
							value={traitForm.activityCurve ?? ''}
							label="활동 커브"
							onChange={(e) => setTraitForm((f) => ({ ...f, activityCurve: (e.target.value as ActivityCurve) || undefined }))}
						>
							<MenuItem value="">미설정</MenuItem>
							<MenuItem value="morning">아침 (morning)</MenuItem>
							<MenuItem value="night">밤 (night)</MenuItem>
							<MenuItem value="random">랜덤 (random)</MenuItem>
						</Select>
					</FormControl>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setTraitTarget(null)}>취소</Button>
					<Button variant="contained" disabled={traitLoading} onClick={handleTraitSave}>
						{traitLoading ? <CircularProgress size={16} /> : '저장'}
					</Button>
				</DialogActions>
			</Dialog>

			{/* Delete Confirm Dialog */}
			<Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs">
				<DialogTitle>트레이트 오버라이드 삭제</DialogTitle>
				<DialogContent>
					<Typography>이 Ghost의 커뮤니티 트레이트 오버라이드를 삭제하시겠습니까?</Typography>
					<Typography variant="caption" color="text.secondary">재시작 시 초기화되는 설정입니다.</Typography>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setDeleteTarget(null)}>취소</Button>
					<Button variant="contained" color="error" disabled={deleteLoading} onClick={handleTraitDelete}>
						{deleteLoading ? <CircularProgress size={16} /> : '삭제'}
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
}
