'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
	Alert,
	Box,
	Button,
	Checkbox,
	Chip,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControl,
	FormControlLabel,
	InputAdornment,
	InputLabel,
	MenuItem,
	Paper,
	Select,
	Stack,
	Switch,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TextField,
	Tooltip,
	Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { formatDateTimeKR } from '@/app/utils/formatters';
import { AdminLoading } from '@/shared/ui/admin/loading';
import { getAdminErrorMessage, isAdminConflictError } from '@/shared/lib/http/admin-fetch';
import AdminService from '@/app/services/admin';
import type { GemPriceRow } from '@/app/services/admin';
import { COUNTRY_OPTIONS, GENDER_OPTIONS, ScopeChip, mergeFeatureTypes, neededConfirm, scopeRank } from './shared';

interface Props {
	onChanged: () => void;
}

export default function PricesTab({ onChanged }: Props) {
	const [prices, setPrices] = useState<GemPriceRow[]>([]);
	const [missing, setMissing] = useState<string[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [search, setSearch] = useState('');
	const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');

	const [editTarget, setEditTarget] = useState<GemPriceRow | null>(null);
	const [createOpen, setCreateOpen] = useState(false);
	const [toggleTarget, setToggleTarget] = useState<GemPriceRow | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		try {
			const res = await AdminService.gemPricing.listPrices();
			setPrices(res.prices);
			setMissing(res.missingFeatureTypes);
			setError(null);
		} catch (e) {
			setError(getAdminErrorMessage(e, '가격 목록을 불러오지 못했습니다'));
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void load();
	}, [load]);

	const handleSaved = () => {
		void load();
		onChanged();
	};

	const allFeatureTypes = useMemo(() => mergeFeatureTypes(prices, missing), [prices, missing]);

	const rows = useMemo(() => {
		const q = search.trim().toUpperCase();
		return prices
			.filter((p) => (q ? p.featureType.includes(q) : true))
			.filter((p) =>
				activeFilter === 'all' ? true : activeFilter === 'active' ? p.isActive : !p.isActive,
			)
			.sort(
				(a, b) =>
					a.featureType.localeCompare(b.featureType) ||
					scopeRank(a.countryCode, a.gender) - scopeRank(b.countryCode, b.gender),
			);
	}, [prices, search, activeFilter]);

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
				가장 구체적인 활성 행이 적용됩니다 — (국가+성별) &gt; (국가) &gt; (성별) &gt; (공통).
				비활성 행은 없는 것으로 보고 다음 순위로 넘어갑니다. 4순위까지 없으면 해당 액션은 실행되지
				않고 에러가 납니다.
			</Alert>

			<Paper sx={{ p: 2, mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
				<TextField
					size="small"
					placeholder="액션 검색 (예: CHAT_START)"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					sx={{ minWidth: 260, flex: 1 }}
					InputProps={{
						startAdornment: (
							<InputAdornment position="start">
								<SearchIcon fontSize="small" />
							</InputAdornment>
						),
					}}
				/>
				<FormControl size="small" sx={{ minWidth: 140 }}>
					<InputLabel>상태</InputLabel>
					<Select
						label="상태"
						value={activeFilter}
						onChange={(e) => setActiveFilter(e.target.value as typeof activeFilter)}
					>
						<MenuItem value="all">전체</MenuItem>
						<MenuItem value="active">활성</MenuItem>
						<MenuItem value="inactive">비활성</MenuItem>
					</Select>
				</FormControl>
				<Button variant="contained" onClick={() => setCreateOpen(true)}>
					가격 행 추가
				</Button>
			</Paper>

			{missing.length > 0 && (
				<Alert severity="warning" sx={{ mb: 2 }}>
					<Typography variant="body2" sx={{ mb: 1 }}>
						가격 행이 없는 액션 {missing.length}개 — 소모 액션이라면 지금 추가해야 합니다.
					</Typography>
					<Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
						{missing.map((t) => (
							<Chip key={t} size="small" variant="outlined" label={t} />
						))}
					</Box>
				</Alert>
			)}

			<TableContainer component={Paper}>
				<Table size="small">
					<TableHead>
						<TableRow sx={{ bgcolor: 'grey.100' }}>
							<TableCell sx={{ fontWeight: 700 }}>액션</TableCell>
							<TableCell sx={{ fontWeight: 700, width: 140 }}>스코프</TableCell>
							<TableCell align="right" sx={{ fontWeight: 700, width: 100 }}>
								정가
							</TableCell>
							<TableCell align="center" sx={{ fontWeight: 700, width: 90 }}>
								활성
							</TableCell>
							<TableCell sx={{ fontWeight: 700 }}>최근 사유</TableCell>
							<TableCell sx={{ fontWeight: 700, width: 150 }}>수정 시각</TableCell>
							<TableCell align="right" sx={{ fontWeight: 700, width: 90 }} />
						</TableRow>
					</TableHead>
					<TableBody>
						{rows.length === 0 ? (
							<TableRow>
								<TableCell colSpan={7} align="center" sx={{ py: 6 }}>
									<Typography color="text.secondary">조건에 맞는 가격 행이 없습니다</Typography>
								</TableCell>
							</TableRow>
						) : (
							rows.map((row) => (
								<TableRow key={row.id} hover sx={{ opacity: row.isActive ? 1 : 0.55 }}>
									<TableCell sx={{ fontWeight: 500 }}>
										<code>{row.featureType}</code>
									</TableCell>
									<TableCell>
										<ScopeChip countryCode={row.countryCode} gender={row.gender} />
									</TableCell>
									<TableCell align="right" sx={{ fontWeight: 700 }}>
										{row.price === 0 ? (
											<Chip size="small" color="warning" label="무료 (0)" />
										) : (
											`${row.price} 구슬`
										)}
									</TableCell>
									<TableCell align="center">
										<Tooltip title={row.isActive ? '비활성화' : '활성화'}>
											<Switch
												size="small"
												checked={row.isActive}
												onChange={() => setToggleTarget(row)}
											/>
										</Tooltip>
									</TableCell>
									<TableCell>
										<Typography variant="body2" color="text.secondary" noWrap>
											{row.memo || '-'}
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

			{createOpen && (
				<CreatePriceDialog
					featureTypes={allFeatureTypes}
					missingFeatureTypes={missing}
					onClose={() => setCreateOpen(false)}
					onSaved={() => {
						setCreateOpen(false);
						handleSaved();
					}}
				/>
			)}

			{editTarget && (
				<EditPriceDialog
					row={editTarget}
					onClose={() => setEditTarget(null)}
					onSaved={() => {
						setEditTarget(null);
						handleSaved();
					}}
				/>
			)}

			{toggleTarget && (
				<ToggleActiveDialog
					row={toggleTarget}
					onClose={() => setToggleTarget(null)}
					onSaved={() => {
						setToggleTarget(null);
						handleSaved();
					}}
				/>
			)}
		</Box>
	);
}

// ─── 신규 등록 ─────────────────────────────────────────

function CreatePriceDialog({
	featureTypes,
	missingFeatureTypes,
	onClose,
	onSaved,
}: {
	featureTypes: string[];
	missingFeatureTypes: string[];
	onClose: () => void;
	onSaved: () => void;
}) {
	const [featureType, setFeatureType] = useState('');
	const [countryCode, setCountryCode] = useState('');
	const [gender, setGender] = useState('');
	const [price, setPrice] = useState('');
	const [memo, setMemo] = useState('');
	const [confirmFree, setConfirmFree] = useState(false);
	const [needConfirmFree, setNeedConfirmFree] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);

	const priceNum = Number(price);
	const valid = featureType && memo.trim() && price !== '' && Number.isInteger(priceNum) && priceNum >= 0;

	const submit = async () => {
		setSaving(true);
		setError(null);
		try {
			await AdminService.gemPricing.createPrice({
				featureType,
				countryCode: countryCode ? (countryCode as 'kr' | 'jp') : undefined,
				gender: gender ? (gender as 'MALE' | 'FEMALE') : undefined,
				price: priceNum,
				memo: memo.trim(),
				confirmFree: confirmFree || undefined,
			});
			onSaved();
		} catch (e) {
			const msg = getAdminErrorMessage(e, '가격 등록 실패');
			if (neededConfirm(msg) === 'confirmFree') setNeedConfirmFree(true);
			setError(msg);
		} finally {
			setSaving(false);
		}
	};

	return (
		<Dialog open fullWidth maxWidth="sm" onClose={onClose}>
			<DialogTitle>가격 행 추가</DialogTitle>
			<DialogContent>
				<Stack spacing={2} sx={{ mt: 1 }}>
					{error && <Alert severity="error">{error}</Alert>}
					<FormControl size="small" fullWidth>
						<InputLabel>액션</InputLabel>
						<Select
							label="액션"
							value={featureType}
							onChange={(e) => setFeatureType(e.target.value)}
						>
							{featureTypes.map((t) => (
								<MenuItem key={t} value={t}>
									{t}
									{missingFeatureTypes.includes(t) && (
										<Chip size="small" label="미설정" color="warning" sx={{ ml: 1 }} />
									)}
								</MenuItem>
							))}
						</Select>
					</FormControl>
					<Stack direction="row" spacing={2}>
						<FormControl size="small" fullWidth>
							<InputLabel>국가</InputLabel>
							<Select
								label="국가"
								value={countryCode}
								onChange={(e) => setCountryCode(e.target.value)}
							>
								{COUNTRY_OPTIONS.map((o) => (
									<MenuItem key={o.value} value={o.value}>
										{o.label}
									</MenuItem>
								))}
							</Select>
						</FormControl>
						<FormControl size="small" fullWidth>
							<InputLabel>성별</InputLabel>
							<Select label="성별" value={gender} onChange={(e) => setGender(e.target.value)}>
								{GENDER_OPTIONS.map((o) => (
									<MenuItem key={o.value} value={o.value}>
										{o.label}
									</MenuItem>
								))}
							</Select>
						</FormControl>
					</Stack>
					<TextField
						size="small"
						label="정가 (구슬 개수)"
						type="number"
						value={price}
						onChange={(e) => setPrice(e.target.value)}
						inputProps={{ min: 0 }}
					/>
					<TextField
						size="small"
						label="변경 사유 (필수)"
						value={memo}
						onChange={(e) => setMemo(e.target.value)}
						placeholder="감사 로그와 Slack 알림에 그대로 남습니다"
						multiline
						minRows={2}
					/>
					{needConfirmFree && (
						<FormControlLabel
							control={
								<Checkbox
									checked={confirmFree}
									onChange={(e) => setConfirmFree(e.target.checked)}
								/>
							}
							label="0원 설정을 의도했음을 확인합니다 (해당 액션이 전원 무료가 됩니다)"
						/>
					)}
				</Stack>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose}>취소</Button>
				<Button
					variant="contained"
					disabled={!valid || saving || (needConfirmFree && !confirmFree)}
					onClick={submit}
				>
					등록
				</Button>
			</DialogActions>
		</Dialog>
	);
}

// ─── 정가 수정 ─────────────────────────────────────────

function EditPriceDialog({
	row,
	onClose,
	onSaved,
}: {
	row: GemPriceRow;
	onClose: () => void;
	onSaved: () => void;
}) {
	const [price, setPrice] = useState(String(row.price));
	const [memo, setMemo] = useState('');
	const [confirmFree, setConfirmFree] = useState(false);
	const [confirmLarge, setConfirmLarge] = useState(false);
	const [needConfirmFree, setNeedConfirmFree] = useState(false);
	const [needConfirmLarge, setNeedConfirmLarge] = useState(false);
	const [conflict, setConflict] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);

	const priceNum = Number(price);
	const valid =
		memo.trim() && price !== '' && Number.isInteger(priceNum) && priceNum >= 0 && priceNum !== row.price;

	const submit = async () => {
		setSaving(true);
		setError(null);
		try {
			await AdminService.gemPricing.updatePrice(row.id, {
				price: priceNum,
				memo: memo.trim(),
				version: row.version,
				confirmFree: confirmFree || undefined,
				confirmLargeChange: confirmLarge || undefined,
			});
			onSaved();
		} catch (e) {
			const msg = getAdminErrorMessage(e, '가격 수정 실패');
			const need = neededConfirm(msg);
			if (need === 'confirmFree') setNeedConfirmFree(true);
			if (need === 'confirmLargeChange') setNeedConfirmLarge(true);
			// 409 — 다른 관리자가 먼저 저장했다. version 이 낡았으므로 재조회 없이는 저장 불가.
			if (isAdminConflictError(e)) setConflict(true);
			setError(msg);
		} finally {
			setSaving(false);
		}
	};

	return (
		<Dialog open fullWidth maxWidth="sm" onClose={onClose}>
			<DialogTitle>
				정가 수정 — <code>{row.featureType}</code>
			</DialogTitle>
			<DialogContent>
				<Stack spacing={2} sx={{ mt: 1 }}>
					{error && (
						<Alert severity={conflict ? 'warning' : 'error'}>
							{error}
							{conflict && ' 창을 닫고 목록을 새로고침한 뒤 다시 시도하세요.'}
						</Alert>
					)}
					<Stack direction="row" spacing={1} alignItems="center">
						<ScopeChip countryCode={row.countryCode} gender={row.gender} />
						<Typography variant="body2" color="text.secondary">
							현재 정가 {row.price} 구슬 · version {row.version}
						</Typography>
					</Stack>
					<TextField
						size="small"
						label="새 정가 (구슬 개수)"
						type="number"
						value={price}
						onChange={(e) => setPrice(e.target.value)}
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
					{needConfirmFree && (
						<FormControlLabel
							control={
								<Checkbox
									checked={confirmFree}
									onChange={(e) => setConfirmFree(e.target.checked)}
								/>
							}
							label="0원 설정을 의도했음을 확인합니다"
						/>
					)}
					{needConfirmLarge && (
						<FormControlLabel
							control={
								<Checkbox
									checked={confirmLarge}
									onChange={(e) => setConfirmLarge(e.target.checked)}
								/>
							}
							label="기존 대비 ±50% 를 넘는 변경임을 확인합니다"
						/>
					)}
				</Stack>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose}>취소</Button>
				<Button
					variant="contained"
					disabled={
						!valid ||
						saving ||
						conflict ||
						(needConfirmFree && !confirmFree) ||
						(needConfirmLarge && !confirmLarge)
					}
					onClick={submit}
				>
					저장
				</Button>
			</DialogActions>
		</Dialog>
	);
}

// ─── 활성/비활성 ───────────────────────────────────────

function ToggleActiveDialog({
	row,
	onClose,
	onSaved,
}: {
	row: GemPriceRow;
	onClose: () => void;
	onSaved: () => void;
}) {
	const [memo, setMemo] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const next = !row.isActive;

	const submit = async () => {
		setSaving(true);
		setError(null);
		try {
			await AdminService.gemPricing.setPriceActive(row.id, { isActive: next, memo: memo.trim() });
			onSaved();
		} catch (e) {
			setError(getAdminErrorMessage(e, '상태 변경 실패'));
		} finally {
			setSaving(false);
		}
	};

	return (
		<Dialog open fullWidth maxWidth="xs" onClose={onClose}>
			<DialogTitle>{next ? '가격 행 활성화' : '가격 행 비활성화'}</DialogTitle>
			<DialogContent>
				<Stack spacing={2} sx={{ mt: 1 }}>
					{error && <Alert severity="error">{error}</Alert>}
					<Typography variant="body2">
						<code>{row.featureType}</code> · {row.price} 구슬
					</Typography>
					{!next && (
						<Alert severity="warning">
							비활성화하면 이 행은 없는 것으로 취급되어 다음 우선순위 행이 적용됩니다. 대체할 행이
							하나도 없으면 해당 액션은 실행되지 않고 에러가 납니다.
						</Alert>
					)}
					<TextField
						size="small"
						label="변경 사유 (필수)"
						value={memo}
						onChange={(e) => setMemo(e.target.value)}
						multiline
						minRows={2}
					/>
				</Stack>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose}>취소</Button>
				<Button variant="contained" disabled={!memo.trim() || saving} onClick={submit}>
					{next ? '활성화' : '비활성화'}
				</Button>
			</DialogActions>
		</Dialog>
	);
}
