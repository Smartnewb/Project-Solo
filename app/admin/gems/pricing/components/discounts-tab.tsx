"use client";
import {
	Alert,
	Button,
	Checkbox,
	Description,
	Input,
	Label,
	ListBox,
	Modal,
	Select,
	TextArea,
	TextField,
} from "@heroui/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatDateTimeKR } from "@/app/utils/formatters";
import { AdminLoading } from "@/shared/ui/admin/loading";
import { getAdminErrorMessage } from "@/shared/lib/http/admin-fetch";
import AdminService from "@/app/services/admin";
import type { GemDiscountRow, GemPriceRow } from "@/app/services/admin";
import { featureOptionLabel } from "./feature-labels";
import {
	COUNTRY_OPTIONS,
	FeatureName,
	DiscountStatusChip,
	GENDER_OPTIONS,
	ScopeChip,
	discountStatus,
	localInputToIso,
	mergeFeatureTypes,
	neededConfirm,
} from "./shared";
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
		(p) =>
			p.featureType === featureType &&
			!p.countryCode &&
			!p.gender &&
			p.isActive,
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
	const [featureFilter, setFeatureFilter] = useState("");
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
			setError(getAdminErrorMessage(e, "할인 목록을 불러오지 못했습니다"));
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
			.catch((e) =>
				setError(getAdminErrorMessage(e, "가격 목록을 불러오지 못했습니다")),
			);
	}, []);
	const featureTypes = useMemo(
		() => mergeFeatureTypes(prices, missing),
		[prices, missing],
	);
	const handleSaved = () => {
		void load();
		onChanged();
	};
	const rows = useMemo(
		() =>
			[...discounts].sort(
				(a, b) =>
					new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime(),
			),
		[discounts],
	);
	return (
		<div>
			{error && (
				<Alert style={{ marginBottom: 16 }} status={"danger"}>
					<Alert.Content>{error}</Alert.Content>
				</Alert>
			)}
			<Alert style={{ marginBottom: 16 }} status={"default"}>
				<Alert.Content>
					할인은 정가에서 <b>구슬 개수를 빼는</b>방식입니다(비율 아님). 같은
					스코프에 기간이 겹치는 할인은 DB가 막습니다 — 겹치면 등록이
					거부됩니다. 시작·종료는 별도 작업 없이 시각이 되면 자동 반영됩니다.
				</Alert.Content>
			</Alert>
			<section
				style={{
					padding: 16,
					marginBottom: 16,
					display: "flex",
					gap: 16,
					flexWrap: "wrap",
					alignItems: "center",
				}}
			>
				<div style={{ minWidth: 240 }}>
					<Select
						value={featureFilter}
						onChange={(key) => {
							const value = String(key ?? "");
							setFeatureFilter(value);
						}}
						className="w-full"
					>
						<Label>{"액션 필터"}</Label>
						<Select.Trigger>
							<Select.Value />
							<Select.Indicator />
						</Select.Trigger>
						<Select.Popover>
							<ListBox>
								<ListBox.Item id={""} textValue={"전체 액션"} key={""}>
									전체 액션
								</ListBox.Item>
								{featureTypes.map((t) => (
									<ListBox.Item
										id={t}
										textValue={String(featureOptionLabel(t))}
										key={t}
									>
										{featureOptionLabel(t)}
									</ListBox.Item>
								))}
							</ListBox>
						</Select.Popover>
					</Select>
				</div>
				<Checkbox
					isSelected={includeExpired}
					onChange={(checked) => setIncludeExpired(checked)}
				>
					<Checkbox.Content>
						<Checkbox.Control>
							<Checkbox.Indicator />
						</Checkbox.Control>
						<Label>{"종료된 할인 포함"}</Label>
					</Checkbox.Content>
				</Checkbox>
				<div></div>
				<Button
					onClick={() => setCreateOpen(true)}
					variant={"primary"}
					size={"md"}
				>
					할인 등록
				</Button>
			</section>
			{loading ? (
				<AdminLoading />
			) : (
				<div className={"overflow-x-auto"}>
					<table
						className={
							"w-full text-sm text-left [&_td]:p-3 [&_th]:p-3 [&_thead]:bg-neutral-50 [&_tr]:border-b"
						}
					>
						<thead>
							<tr style={{ backgroundColor: "#f5f5f5" }}>
								<th style={{ fontWeight: 700, width: 90 }} scope="col">
									상태
								</th>
								<th style={{ fontWeight: 700 }} scope="col">
									액션
								</th>
								<th style={{ fontWeight: 700, width: 140 }} scope="col">
									스코프
								</th>
								<th style={{ fontWeight: 700, width: 160 }} scope="col">
									정가 → 할인가
								</th>
								<th style={{ fontWeight: 700, width: 300 }} scope="col">
									기간
								</th>
								<th style={{ fontWeight: 700 }} scope="col">
									사유
								</th>
								<th style={{ fontWeight: 700, width: 100 }} scope="col"></th>
							</tr>
						</thead>
						<tbody>
							{rows.length === 0 ? (
								<tr>
									<td colSpan={7} style={{ paddingTop: 48, paddingBottom: 48 }}>
										<p className={"text-sm text-neutral-700"}>
											등록된 할인이 없습니다
										</p>
									</td>
								</tr>
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
										listPrice === null
											? null
											: Math.max(0, listPrice - row.discountAmount);
									return (
										<tr
											key={row.id}
											style={{ opacity: status === "ACTIVE" ? 1 : 0.7 }}
										>
											<td>
												<DiscountStatusChip status={status} />
											</td>
											<td>
												<FeatureName featureType={row.featureType} />
											</td>
											<td>
												<ScopeChip
													countryCode={row.countryCode}
													gender={row.gender}
												/>
											</td>
											<td>
												{listPrice === null ? (
													<p className={"text-sm text-neutral-700"}>
														-{row.discountAmount}(정가 미설정)
													</p>
												) : (
													<p className={"text-sm text-neutral-700"}>
														<s>{listPrice}</s>→ <b>{charge}</b>구슬
													</p>
												)}
											</td>
											<td>
												<p className={"text-sm text-neutral-700"}>
													{formatDateTimeKR(row.startsAt)}~{" "}
													{formatDateTimeKR(row.endsAt)}
												</p>
											</td>
											<td>
												<p className={"text-sm text-neutral-700"}>{row.memo}</p>
											</td>
											<td>
												{(status === "ACTIVE" || status === "SCHEDULED") && (
													<Button
														onClick={() => setCancelTarget(row)}
														variant={"tertiary"}
														size={"sm"}
													>
														조기 종료
													</Button>
												)}
											</td>
										</tr>
									);
								})
							)}
						</tbody>
					</table>
				</div>
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
		</div>
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
	const [featureType, setFeatureType] = useState("");
	const [countryCode, setCountryCode] = useState("");
	const [gender, setGender] = useState("");
	const [discountAmount, setDiscountAmount] = useState("");
	const [startsAt, setStartsAt] = useState("");
	const [endsAt, setEndsAt] = useState("");
	const [memo, setMemo] = useState("");
	const [confirmFree, setConfirmFree] = useState(false);
	const [needConfirmFree, setNeedConfirmFree] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const amountNum = Number(discountAmount);
	const listPrice = featureType
		? resolveListPrice(prices, featureType, countryCode || null, gender || null)
		: null;
	const charge =
		listPrice === null ? null : Math.max(0, listPrice - (amountNum || 0));
	const periodValid = Boolean(
		startsAt && endsAt && new Date(endsAt) > new Date(startsAt),
	);
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
				countryCode: countryCode ? (countryCode as "kr" | "jp") : undefined,
				gender: gender ? (gender as "MALE" | "FEMALE") : undefined,
				discountAmount: amountNum,
				startsAt: localInputToIso(startsAt),
				endsAt: localInputToIso(endsAt),
				memo: memo.trim(),
				confirmFree: confirmFree || undefined,
			});
			onSaved();
		} catch (e) {
			const msg = getAdminErrorMessage(e, "할인 등록 실패");
			if (neededConfirm(msg) === "confirmFree") setNeedConfirmFree(true);
			setError(msg);
		} finally {
			setSaving(false);
		}
	};
	return (
		<Modal.Backdrop
			isOpen={true}
			onOpenChange={(isOpen) => {
				if (!isOpen && !saving) onClose?.();
			}}
			isDismissable={!saving}
			isKeyboardDismissDisabled={saving}
		>
			<Modal.Container size="md" scroll="inside">
				<Modal.Dialog style={{ width: '100%', maxWidth: 600, minWidth: 0 }}>
					<Modal.Header>
						<Modal.Heading>기간 할인 등록</Modal.Heading>
					</Modal.Header>
					<Modal.Body>
						<div style={{ marginTop: 8 }} className="flex flex-col gap-4">
							{error && (
								<Alert status={"danger"}>
									<Alert.Content>{error}</Alert.Content>
								</Alert>
							)}
							<div>
								<Select
									value={featureType}
									onChange={(key) => {
										const value = String(key ?? "");
										setFeatureType(value);
									}}
									className="w-full"
								>
									<Label>{"액션"}</Label>
									<Select.Trigger>
										<Select.Value />
										<Select.Indicator />
									</Select.Trigger>
									<Select.Popover>
										<ListBox>
											{featureTypes.map((t) => (
												<ListBox.Item
													id={t}
													textValue={String(featureOptionLabel(t))}
													key={t}
												>
													{featureOptionLabel(t)}
												</ListBox.Item>
											))}
										</ListBox>
									</Select.Popover>
								</Select>
							</div>
							<div className="flex flex-wrap items-center gap-4">
								<div>
									<Select
										value={countryCode}
										onChange={(key) => {
											const value = String(key ?? "");
											setCountryCode(value);
										}}
										className="w-full"
									>
										<Label>{"국가"}</Label>
										<Select.Trigger>
											<Select.Value />
											<Select.Indicator />
										</Select.Trigger>
										<Select.Popover>
											<ListBox>
												{COUNTRY_OPTIONS.map((o) => (
													<ListBox.Item
														id={o.value}
														textValue={String(o.label)}
														key={o.value}
													>
														{o.label}
													</ListBox.Item>
												))}
											</ListBox>
										</Select.Popover>
									</Select>
								</div>
								<div>
									<Select
										value={gender}
										onChange={(key) => {
											const value = String(key ?? "");
											setGender(value);
										}}
										className="w-full"
									>
										<Label>{"성별"}</Label>
										<Select.Trigger>
											<Select.Value />
											<Select.Indicator />
										</Select.Trigger>
										<Select.Popover>
											<ListBox>
												{GENDER_OPTIONS.map((o) => (
													<ListBox.Item
														id={o.value}
														textValue={String(o.label)}
														key={o.value}
													>
														{o.label}
													</ListBox.Item>
												))}
											</ListBox>
										</Select.Popover>
									</Select>
								</div>
							</div>
							<TextField className="w-full">
								<Label>{"할인 구슬 개수"}</Label>
								<Input
									type="number"
									value={discountAmount}
									onChange={(e) => setDiscountAmount(e.target.value)}
									{...{ min: 1 }}
								/>
								<Description>
									{listPrice === null
										? "선택한 스코프의 정가를 찾지 못했습니다 (정가 탭에서 먼저 등록하세요)"
										: `정가 ${listPrice} → 할인가 ${charge} 구슬`}
								</Description>
							</TextField>
							<div className="flex flex-wrap items-center gap-4">
								<TextField className="w-full">
									<Label>{"시작 (포함)"}</Label>
									<Input
										type="datetime-local"
										value={startsAt}
										onChange={(e) => setStartsAt(e.target.value)}
									/>
								</TextField>
								<TextField
									className="w-full"
									isInvalid={Boolean(startsAt && endsAt) && !periodValid}
								>
									<Label>{"종료 (배제)"}</Label>
									<Input
										type="datetime-local"
										value={endsAt}
										onChange={(e) => setEndsAt(e.target.value)}
									/>
									<Description>
										{Boolean(startsAt && endsAt) && !periodValid
											? "종료가 시작보다 뒤여야 합니다"
											: " "}
									</Description>
								</TextField>
							</div>
							<span className={"text-sm text-neutral-700"}>
								입력한 시각은 이 브라우저의 로컬 시간대 기준이며 UTC로 변환되어
								저장됩니다.
							</span>
							<TextField className="w-full">
								<Label>{"프로모션 사유 (필수)"}</Label>
								<TextArea
									value={memo}
									onChange={(e) => setMemo(e.target.value)}
									rows={4}
								/>
							</TextField>
							{needConfirmFree && (
								<Checkbox
									isSelected={confirmFree}
									onChange={(checked) => setConfirmFree(checked)}
								>
									<Checkbox.Content>
										<Checkbox.Control>
											<Checkbox.Indicator />
										</Checkbox.Control>
										<Label>
											{
												"할인액이 정가 이상이라 해당 기간 동안 무료가 되는 것을 확인합니다"
											}
										</Label>
									</Checkbox.Content>
								</Checkbox>
							)}
						</div>
					</Modal.Body>
					<Modal.Footer>
						<Button
							onClick={onClose}
							variant={"tertiary"}
							isDisabled={saving}
							size={"md"}
						>
							취소
						</Button>
						<Button
							onClick={submit}
							variant={"primary"}
							isDisabled={!valid || saving || (needConfirmFree && !confirmFree)}
							size={"md"}
						>
							등록
						</Button>
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
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
			setError(getAdminErrorMessage(e, "할인 취소 실패"));
		} finally {
			setSaving(false);
		}
	};
	return (
		<Modal.Backdrop
			isOpen={true}
			onOpenChange={(isOpen) => {
				if (!isOpen && !saving) onClose?.();
			}}
			isDismissable={!saving}
			isKeyboardDismissDisabled={saving}
		>
			<Modal.Container size="md" scroll="inside">
				<Modal.Dialog style={{ width: '100%', maxWidth: 444, minWidth: 0 }}>
					<Modal.Header>
						<Modal.Heading>할인 조기 종료</Modal.Heading>
					</Modal.Header>
					<Modal.Body>
						{error && (
							<Alert style={{ marginBottom: 16 }} status={"danger"}>
								<Alert.Content>{error}</Alert.Content>
							</Alert>
						)}
						<div>
							<p className={"text-sm text-neutral-700"}>
								{featureOptionLabel(row.featureType)}· -{row.discountAmount}구슬
							</p>
							<p className={"text-sm text-neutral-700"}>
								{formatDateTimeKR(row.startsAt)}~ {formatDateTimeKR(row.endsAt)}
							</p>
							<p className={"text-sm text-neutral-700"}>
								지금 즉시 할인이 멈춥니다. 기록은 삭제되지 않고 취소 표시만
								남습니다.
							</p>
						</div>
					</Modal.Body>
					<Modal.Footer>
						<Button
							onClick={onClose}
							variant={"tertiary"}
							isDisabled={saving}
							size={"md"}
						>
							닫기
						</Button>
						<Button
							onClick={submit}
							variant={"danger"}
							isDisabled={saving}
							size={"md"}
						>
							조기 종료
						</Button>
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}
