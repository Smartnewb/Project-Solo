'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
	Alert,
	Box,
	Button,
	Checkbox,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	FormControl,
	FormControlLabel,
	InputLabel,
	MenuItem,
	Paper,
	Select,
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
import { getAdminErrorMessage } from '@/shared/lib/http/admin-fetch';
import AdminService from '@/app/services/admin';
import type { GemDiscountRow, GemPriceRow } from '@/app/services/admin';
import { featureOptionLabel } from './feature-labels';
import { COUNTRY_OPTIONS, FeatureName, DiscountStatusChip, GENDER_OPTIONS, ScopeChip, discountStatus, localInputToIso, mergeFeatureTypes, neededConfirm } from './shared';

interface Props {
	onChanged: () => void;
}

/**
 * 서버(GemsV2Service.resolveListPriceForScope)와 같은 규칙으로 정가를 찾는다.
 * 정확히 같은 스코프의 활성 행 → 없으면 공통(전체/전체) 활성 행. 없으면 null.
 */
function resolveListPrice(
	prices: GemPriceRow[],
	featureType: string,
	countryCode: string | null,
	gender: string | null,
): number | null {
	const exact = prices.find(
		(p) =>
			p.featureType === featureType &&
			p.countryCode === countryCode &&
			p.gender === gender &&
			p.isActive,
	);
	if (exact) return exact.price;
	const base = prices.find(
		(p) => p.featureType === featureType && !p.countryCode && !p.gender && p.isActive,
	);
	return base?.price ?? null;
}

export default function DiscountsTab({ onChanged }: Props) {
	const [discounts, setDiscounts] = useState<GemDiscountRow[]>([]);
	const [prices, setPrices] = useState<GemPriceRow[]>([]);
	const [missing, setMissing] = useState<string[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [includeExpired, setIncludeExpired] = useState(false);
	const [featureFilter, setFeatureFilter] = useState('');

	const [createOpen, setCreateOpen] = useState(false);
	const [cancelTarget, setCancelTarget] = useState<GemDiscountRow | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		try {
			setDiscounts(
				await AdminService.gemPricing.listDiscounts({
					featureType: featureFilter || undefined,
					includeExpired,
				}),
			);
			setError(null);
		} catch (e) {
			setError(getAdminErrorMessage(e, '할인 목록을 불러오지 못했습니다'));
		} finally {
			setLoading(false);
		}
	}, [featureFilter, includeExpired]);

	useEffect(() => {
		void load();
	}, [load]);

	// 가격 카탈로그는 할인 필터와 무관하다 — 필터를 만질 때마다 재조회하지 않는다.
	useEffect(() => {
		AdminService.gemPricing
			.listPrices()
			.then((res) => {
				setPrices(res.prices);
				setMissing(res.missingFeatureTypes);
			})
			.catch((e) => setError(getAdminErrorMessage(e, '가격 목록을 불러오지 못했습니다')));
	}, []);

	const featureTypes = useMemo(() => mergeFeatureTypes(prices, missing), [prices, missing]);

	const handleSaved = () => {
		void load();
		onChanged();
	};

	const rows = useMemo(
		() =>
			[...discounts].sort(
				(a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime(),
			),
		[discounts],
	);

	return (
		<Box>
			{error && (
				<Alert severity="error" sx={{ mb: 2 }}>
					{error}
				</Alert>
			)}

			<Alert severity="info" sx={{ mb: 2 }}>
				할인은 정가에서 <b>구슬 개수를 빼는</b> 방식입니다(비율 아님). 같은 스코프에 기간이 겹치는
				할인은 DB가 막습니다 — 겹치면 등록이 거부됩니다. 시작·종료는 별도 작업 없이 시각이 되면
				자동 반영됩니다.
			</Alert>

			<Paper sx={{ p: 2, mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
				<FormControl size="small" sx={{ minWidth: 240 }}>
					<InputLabel>액션 필터</InputLabel>
					<Select
						label="액션 필터"
						value={featureFilter}
						onChange={(e) => setFeatureFilter(e.target.value)}
					>
						<MenuItem value="">전체 액션</MenuItem>
						{featureTypes.map((t) => (
							<MenuItem key={t} value={t}>
								{featureOptionLabel(t)}
							</MenuItem>
						))}
					</Select>
				</FormControl>
				<FormControlLabel
					control={
						<Checkbox
							checked={includeExpired}
							onChange={(e) => setIncludeExpired(e.target.checked)}
						/>
					}
					label="종료된 할인 포함"
				/>
				<Box flex={1} />
				<Button variant="contained" onClick={() => setCreateOpen(true)}>
					할인 등록
				</Button>
			</Paper>

			{loading ? (
				<AdminLoading />
			) : (
				<TableContainer component={Paper}>
					<Table size="small">
						<TableHead>
							<TableRow sx={{ bgcolor: 'grey.100' }}>
								<TableCell sx={{ fontWeight: 700, width: 90 }}>상태</TableCell>
								<TableCell sx={{ fontWeight: 700 }}>액션</TableCell>
								<TableCell sx={{ fontWeight: 700, width: 140 }}>스코프</TableCell>
								<TableCell align="right" sx={{ fontWeight: 700, width: 160 }}>
									정가 → 할인가
								</TableCell>
								<TableCell sx={{ fontWeight: 700, width: 300 }}>기간</TableCell>
								<TableCell sx={{ fontWeight: 700 }}>사유</TableCell>
								<TableCell align="right" sx={{ fontWeight: 700, width: 100 }} />
							</TableRow>
						</TableHead>
						<TableBody>
							{rows.length === 0 ? (
								<TableRow>
									<TableCell colSpan={7} align="center" sx={{ py: 6 }}>
										<Typography color="text.secondary">등록된 할인이 없습니다</Typography>
									</TableCell>
								</TableRow>
							) : (
								rows.map((row) => {
									const status = discountStatus(row);
									const listPrice = resolveListPrice(
										prices,
										row.featureType,
										row.countryCode,
										row.gender,
									);
									const charge =
										listPrice === null ? null : Math.max(0, listPrice - row.discountAmount);
									return (
										<TableRow key={row.id} hover sx={{ opacity: status === 'ACTIVE' ? 1 : 0.7 }}>
											<TableCell>
												<DiscountStatusChip status={status} />
											</TableCell>
											<TableCell>
												<FeatureName featureType={row.featureType} />
											</TableCell>
											<TableCell>
												<ScopeChip countryCode={row.countryCode} gender={row.gender} />
											</TableCell>
											<TableCell align="right">
												{listPrice === null ? (
													<Typography variant="body2" color="text.secondary">
														-{row.discountAmount} (정가 미설정)
													</Typography>
												) : (
													<Typography variant="body2">
														<s>{listPrice}</s> → <b>{charge}</b> 구슬
													</Typography>
												)}
											</TableCell>
											<TableCell>
												<Typography variant="body2">
													{formatDateTimeKR(row.startsAt)} ~ {formatDateTimeKR(row.endsAt)}
												</Typography>
											</TableCell>
											<TableCell>
												<Typography variant="body2" color="text.secondary">
													{row.memo}
												</Typography>
											</TableCell>
											<TableCell align="right">
												{(status === 'ACTIVE' || status === 'SCHEDULED') && (
													<Button size="small" color="warning" onClick={() => setCancelTarget(row)}>
														조기 종료
													</Button>
												)}
											</TableCell>
										</TableRow>
									);
								})
							)}
						</TableBody>
					</Table>
				</TableContainer>
			)}

			{createOpen && (
				<CreateDiscountDialog
					featureTypes={featureTypes}
					prices={prices}
					onClose={() => setCreateOpen(false)}
					onSaved={() => {
						setCreateOpen(false);
						handleSaved();
					}}
				/>
			)}

			{cancelTarget && (
				<CancelDiscountDialog
					row={cancelTarget}
					onClose={() => setCancelTarget(null)}
					onSaved={() => {
						setCancelTarget(null);
						handleSaved();
					}}
				/>
			)}
		</Box>
	);
}

// ─── 할인 등록 ─────────────────────────────────────────

function CreateDiscountDialog({
	featureTypes,
	prices,
	onClose,
	onSaved,
}: {
	featureTypes: string[];
	prices: GemPriceRow[];
	onClose: () => void;
	onSaved: () => void;
}) {
	const [featureType, setFeatureType] = useState('');
	const [countryCode, setCountryCode] = useState('');
	const [gender, setGender] = useState('');
	const [discountAmount, setDiscountAmount] = useState('');
	const [startsAt, setStartsAt] = useState('');
	const [endsAt, setEndsAt] = useState('');
	const [memo, setMemo] = useState('');
	const [confirmFree, setConfirmFree] = useState(false);
	const [needConfirmFree, setNeedConfirmFree] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);

	const amountNum = Number(discountAmount);
	const listPrice = featureType
		? resolveListPrice(prices, featureType, countryCode || null, gender || null)
		: null;
	const charge = listPrice === null ? null : Math.max(0, listPrice - (amountNum || 0));

	const periodValid = Boolean(startsAt && endsAt && new Date(endsAt) > new Date(startsAt));
	const valid =
		featureType &&
		memo.trim() &&
		Number.isInteger(amountNum) &&
		amountNum >= 1 &&
		periodValid;

	const submit = async () => {
		setSaving(true);
		setError(null);
		try {
			await AdminService.gemPricing.createDiscount({
				featureType,
				countryCode: countryCode ? (countryCode as 'kr' | 'jp') : undefined,
				gender: gender ? (gender as 'MALE' | 'FEMALE') : undefined,
				discountAmount: amountNum,
				startsAt: localInputToIso(startsAt),
				endsAt: localInputToIso(endsAt),
				memo: memo.trim(),
				confirmFree: confirmFree || undefined,
			});
			onSaved();
		} catch (e) {
			const msg = getAdminErrorMessage(e, '할인 등록 실패');
			if (neededConfirm(msg) === 'confirmFree') setNeedConfirmFree(true);
			setError(msg);
		} finally {
			setSaving(false);
		}
	};

	return (
		<Dialog open fullWidth maxWidth="sm" onClose={onClose}>
			<DialogTitle>기간 할인 등록</DialogTitle>
			<DialogContent>
				<Stack spacing={2} sx={{ mt: 1 }}>
					{error && <Alert severity="error">{error}</Alert>}
					<FormControl size="small" fullWidth>
						<InputLabel>액션</InputLabel>
						<Select label="액션" value={featureType} onChange={(e) => setFeatureType(e.target.value)}>
							{featureTypes.map((t) => (
								<MenuItem key={t} value={t}>
									{featureOptionLabel(t)}
								</MenuItem>
							))}
						</Select>
					</FormControl>
					<Stack direction="row" spacing={2}>
						<FormControl size="small" fullWidth>
							<InputLabel>국가</InputLabel>
							<Select label="국가" value={countryCode} onChange={(e) => setCountryCode(e.target.value)}>
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
						label="할인 구슬 개수"
						type="number"
						value={discountAmount}
						onChange={(e) => setDiscountAmount(e.target.value)}
						inputProps={{ min: 1 }}
						helperText={
							listPrice === null
								? '선택한 스코프의 정가를 찾지 못했습니다 (정가 탭에서 먼저 등록하세요)'
								: `정가 ${listPrice} → 할인가 ${charge} 구슬`
						}
					/>
					<Stack direction="row" spacing={2}>
						<TextField
							size="small"
							label="시작 (포함)"
							type="datetime-local"
							value={startsAt}
							onChange={(e) => setStartsAt(e.target.value)}
							InputLabelProps={{ shrink: true }}
							fullWidth
						/>
						<TextField
							size="small"
							label="종료 (배제)"
							type="datetime-local"
							value={endsAt}
							onChange={(e) => setEndsAt(e.target.value)}
							InputLabelProps={{ shrink: true }}
							fullWidth
							error={Boolean(startsAt && endsAt) && !periodValid}
							helperText={
								Boolean(startsAt && endsAt) && !periodValid ? '종료가 시작보다 뒤여야 합니다' : ' '
							}
						/>
					</Stack>
					<Typography variant="caption" color="text.secondary">
						입력한 시각은 이 브라우저의 로컬 시간대 기준이며 UTC로 변환되어 저장됩니다.
					</Typography>
					<TextField
						size="small"
						label="프로모션 사유 (필수)"
						value={memo}
						onChange={(e) => setMemo(e.target.value)}
						multiline
						minRows={2}
					/>
					{needConfirmFree && (
						<FormControlLabel
							control={
								<Checkbox checked={confirmFree} onChange={(e) => setConfirmFree(e.target.checked)} />
							}
							label="할인액이 정가 이상이라 해당 기간 동안 무료가 되는 것을 확인합니다"
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

// ─── 조기 종료 ─────────────────────────────────────────

function CancelDiscountDialog({
	row,
	onClose,
	onSaved,
}: {
	row: GemDiscountRow;
	onClose: () => void;
	onSaved: () => void;
}) {
	const [error, setError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);

	const submit = async () => {
		setSaving(true);
		setError(null);
		try {
			await AdminService.gemPricing.cancelDiscount(row.id);
			onSaved();
		} catch (e) {
			setError(getAdminErrorMessage(e, '할인 취소 실패'));
		} finally {
			setSaving(false);
		}
	};

	return (
		<Dialog open maxWidth="xs" fullWidth onClose={onClose}>
			<DialogTitle>할인 조기 종료</DialogTitle>
			<DialogContent>
				{error && (
					<Alert severity="error" sx={{ mb: 2 }}>
						{error}
					</Alert>
				)}
				<DialogContentText component="div">
					<Typography variant="body2" gutterBottom>
						{featureOptionLabel(row.featureType)} · -{row.discountAmount} 구슬
					</Typography>
					<Typography variant="body2" gutterBottom>
						{formatDateTimeKR(row.startsAt)} ~ {formatDateTimeKR(row.endsAt)}
					</Typography>
					<Typography variant="body2" color="text.secondary">
						지금 즉시 할인이 멈춥니다. 기록은 삭제되지 않고 취소 표시만 남습니다.
					</Typography>
				</DialogContentText>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose}>닫기</Button>
				<Button variant="contained" color="warning" disabled={saving} onClick={submit}>
					조기 종료
				</Button>
			</DialogActions>
		</Dialog>
	);
}
