"use client";
import {
	Alert,
	Button,
	Checkbox,
	Chip,
	Input,
	Label,
	ListBox,
	Modal,
	Select,
	Switch,
	TextArea,
	TextField,
	Tooltip,
} from "@heroui/react";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatDateTimeKR } from "@/app/utils/formatters";
import { AdminLoading } from "@/shared/ui/admin/loading";
import {
	getAdminErrorMessage,
	isAdminConflictError,
} from "@/shared/lib/http/admin-fetch";
import AdminService from "@/app/services/admin";
import type { GemPriceRow } from "@/app/services/admin";
import { featureLabel, featureOptionLabel } from "./feature-labels";
import {
	COUNTRY_OPTIONS,
	FeatureName,
	GENDER_OPTIONS,
	ScopeChip,
	mergeFeatureTypes,
	neededConfirm,
	scopeRank,
} from "./shared";
interface Props {
	onChanged: () => void;
}
export default function PricesTab({ onChanged }: Props) {
	const [prices, setPrices] = useState<GemPriceRow[]>([]);
	const [missing, setMissing] = useState<string[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [search, setSearch] = useState("");
	const [activeFilter, setActiveFilter] = useState<
		"all" | "active" | "inactive"
	>("all");
	const [editTarget, setEditTarget] = useState<GemPriceRow | null>(null);
	const [createOpen, setCreateOpen] = useState(false);
	const [toggleTarget, setToggleTarget] = useState<GemPriceRow | null>(null);
	const [missingOpen, setMissingOpen] = useState(false);
	const load = useCallback(async () => {
		setLoading(true);
		try {
			const res = await AdminService.gemPricing.listPrices();
			setPrices(res.prices);
			setMissing(res.missingFeatureTypes);
			setError(null);
		} catch (e) {
			setError(getAdminErrorMessage(e, "가격 목록을 불러오지 못했습니다"));
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
	const allFeatureTypes = useMemo(
		() => mergeFeatureTypes(prices, missing),
		[prices, missing],
	);
	const rows = useMemo(() => {
		const q = search.trim().toLowerCase();
		return prices
			.filter((p) =>
				q
					? p.featureType.toLowerCase().includes(q) ||
						featureLabel(p.featureType).toLowerCase().includes(q)
					: true,
			)
			.filter((p) =>
				activeFilter === "all"
					? true
					: activeFilter === "active"
						? p.isActive
						: !p.isActive,
			)
			.sort(
				(a, b) =>
					// 한글 라벨 기준 정렬. 같은 액션의 스코프 행들은 라벨이 같아 계속 붙어 있는다.
					featureLabel(a.featureType).localeCompare(
						featureLabel(b.featureType),
						"ko",
					) ||
					scopeRank(a.countryCode, a.gender) -
						scopeRank(b.countryCode, b.gender),
			);
	}, [prices, search, activeFilter]);
	if (loading) {
		return <AdminLoading />;
	}
	return (
		<div>
			{error && (
				<Alert style={{ marginBottom: 16 }} status={"danger"}>
					<Alert.Content>{error}</Alert.Content>
				</Alert>
			)}
			<Alert style={{ marginBottom: 16 }} status={"default"}>
				<Alert.Content>
					가장 구체적인 활성 행이 적용됩니다 — (국가+성별) &gt; (국가) &gt;
					(성별) &gt; (공통). 비활성 행은 없는 것으로 보고 다음 순위로
					넘어갑니다. 4순위까지 없으면 해당 액션은 실행되지 않고 에러가 납니다.
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
				<TextField
					aria-label={"액션 검색 (예: 채팅 시작, CHAT_START)"}
					className="w-full"
				>
					{
						<span>
							<Search size={18} />
						</span>
					}
					<Input
						placeholder="액션 검색 (예: 채팅 시작, CHAT_START)"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						style={{ minWidth: 260, flex: 1 }}
						aria-label={"액션 검색 (예: 채팅 시작, CHAT_START)"}
					/>
				</TextField>
				<div style={{ minWidth: 140 }}>
					<Select
						value={activeFilter}
						onChange={(key) => {
							const value = String(key ?? "");
							setActiveFilter(value as typeof activeFilter);
						}}
						className="w-full"
					>
						<Label>{"상태"}</Label>
						<Select.Trigger>
							<Select.Value />
							<Select.Indicator />
						</Select.Trigger>
						<Select.Popover>
							<ListBox>
								<ListBox.Item id={"all"} textValue={"전체"} key={"all"}>
									전체
								</ListBox.Item>
								<ListBox.Item id={"active"} textValue={"활성"} key={"active"}>
									활성
								</ListBox.Item>
								<ListBox.Item
									id={"inactive"}
									textValue={"비활성"}
									key={"inactive"}
								>
									비활성
								</ListBox.Item>
							</ListBox>
						</Select.Popover>
					</Select>
				</div>
				<Button
					onClick={() => setCreateOpen(true)}
					variant={"primary"}
					size={"md"}
				>
					가격 행 추가
				</Button>
			</section>
			{missing.length > 0 && (
				<Alert style={{ marginBottom: 16 }} status={"default"}>
					<Alert.Content>
						<p className={"text-sm text-neutral-700"}>
							가격 행이 없는 액션 {missing.length}개 — 대부분{" "}
							<b>보상·환급·결제·관리자 조작</b>이라 정가 개념 자체가 없습니다.
							이 목록에 있다고 해서 추가해야 하는 건 아닙니다.
						</p>
						<p style={{ marginTop: 4 }} className={"text-sm text-neutral-700"}>
							소모 액션인데 여기 있다면 그 액션은 <b>가격표 밖에서 과금</b>되고
							있다는 뜻입니다 (변동 과금이거나 코드·환경변수 상수). 어드민에서
							바꾸려면 서버 작업이 필요합니다.
						</p>
						<Button
							style={{ marginTop: 8 }}
							onClick={() => setMissingOpen((v) => !v)}
							variant={"tertiary"}
							size={"sm"}
						>
							목록 {missingOpen ? "접기" : "보기"}
							{missingOpen ? (
								<ChevronUp size={18} />
							) : (
								<ChevronDown size={18} />
							)}
						</Button>
						<div hidden={!missingOpen}>
							<div
								style={{
									display: "flex",
									gap: 4,
									flexWrap: "wrap",
									marginTop: 8,
								}}
							>
								{missing.map((t) => (
									<Chip key={t} size={"sm"} variant={"soft"}>
										<Chip.Label>{featureOptionLabel(t)}</Chip.Label>
									</Chip>
								))}
							</div>
						</div>
					</Alert.Content>
				</Alert>
			)}
			<div className={"overflow-x-auto"}>
				<table
					className={
						"w-full text-sm text-left [&_td]:p-3 [&_th]:p-3 [&_thead]:bg-neutral-50 [&_tr]:border-b"
					}
				>
					<thead>
						<tr style={{ backgroundColor: "#f5f5f5" }}>
							<th style={{ fontWeight: 700 }} scope="col">
								액션
							</th>
							<th style={{ fontWeight: 700, width: 140 }} scope="col">
								스코프
							</th>
							<th style={{ fontWeight: 700, width: 100 }} scope="col">
								정가
							</th>
							<th style={{ fontWeight: 700, width: 90 }} scope="col">
								활성
							</th>
							<th style={{ fontWeight: 700 }} scope="col">
								최근 사유
							</th>
							<th style={{ fontWeight: 700, width: 150 }} scope="col">
								수정 시각
							</th>
							<th style={{ fontWeight: 700, width: 90 }} scope="col"></th>
						</tr>
					</thead>
					<tbody>
						{rows.length === 0 ? (
							<tr>
								<td colSpan={7} style={{ paddingTop: 48, paddingBottom: 48 }}>
									<p className={"text-sm text-neutral-700"}>
										조건에 맞는 가격 행이 없습니다
									</p>
								</td>
							</tr>
						) : (
							rows.map((row) => (
								<tr key={row.id} style={{ opacity: row.isActive ? 1 : 0.55 }}>
									<td style={{ fontWeight: 500 }}>
										<FeatureName featureType={row.featureType} />
									</td>
									<td>
										<ScopeChip
											countryCode={row.countryCode}
											gender={row.gender}
										/>
									</td>
									<td style={{ fontWeight: 700 }}>
										{row.price === 0 ? (
											<Chip size={"sm"} variant={"soft"}>
												<Chip.Label>{"무료 (0)"}</Chip.Label>
											</Chip>
										) : (
											`${row.price} 구슬`
										)}
									</td>
									<td>
										<Tooltip>
											<Tooltip.Trigger tabIndex={0}>
												<Switch
													isSelected={row.isActive}
													onChange={() => setToggleTarget(row)}
													aria-label={"선택"}
												>
													<Switch.Content>
														<Switch.Control>
															<Switch.Thumb />
														</Switch.Control>
													</Switch.Content>
												</Switch>
											</Tooltip.Trigger>
											<Tooltip.Content>
												{row.isActive ? "비활성화" : "활성화"}
											</Tooltip.Content>
										</Tooltip>
									</td>
									<td>
										<p className={"text-sm text-neutral-700"}>
											{row.memo || "-"}
										</p>
									</td>
									<td>
										<p className={"text-sm text-neutral-700"}>
											{formatDateTimeKR(row.updatedAt)}
										</p>
									</td>
									<td>
										<Button
											onClick={() => setEditTarget(row)}
											variant={"tertiary"}
											size={"sm"}
										>
											수정
										</Button>
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
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
		</div>
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
	const [featureType, setFeatureType] = useState("");
	const [countryCode, setCountryCode] = useState("");
	const [gender, setGender] = useState("");
	const [price, setPrice] = useState("");
	const [memo, setMemo] = useState("");
	const [confirmFree, setConfirmFree] = useState(false);
	const [needConfirmFree, setNeedConfirmFree] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const priceNum = Number(price);
	const valid =
		featureType &&
		memo.trim() &&
		price !== "" &&
		Number.isInteger(priceNum) &&
		priceNum >= 0;
	const submit = async () => {
		setSaving(true);
		setError(null);
		try {
			await AdminService.gemPricing.createPrice({
				featureType,
				countryCode: countryCode ? (countryCode as "kr" | "jp") : undefined,
				gender: gender ? (gender as "MALE" | "FEMALE") : undefined,
				price: priceNum,
				memo: memo.trim(),
				confirmFree: confirmFree || undefined,
			});
			onSaved();
		} catch (e) {
			const msg = getAdminErrorMessage(e, "가격 등록 실패");
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
				if (!isOpen) onClose?.();
			}}
			isDismissable={onClose !== undefined}
		>
			<Modal.Container size="md" scroll="inside">
				<Modal.Dialog style={{ width: '100%', maxWidth: 600, minWidth: 0 }}>
					<Modal.Header>
						<Modal.Heading>가격 행 추가</Modal.Heading>
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
												<ListBox.Item id={t} textValue={String(t)} key={t}>
													{featureOptionLabel(t)}
													{missingFeatureTypes.includes(t) && (
														<Chip
															style={{ marginLeft: 8 }}
															size={"sm"}
															variant={"soft"}
														>
															<Chip.Label>{"미설정"}</Chip.Label>
														</Chip>
													)}
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
								<Label>{"정가 (구슬 개수)"}</Label>
								<Input
									type="number"
									value={price}
									onChange={(e) => setPrice(e.target.value)}
									{...{ min: 0 }}
								/>
							</TextField>
							<TextField className="w-full">
								<Label>{"변경 사유 (필수)"}</Label>
								<TextArea
									value={memo}
									onChange={(e) => setMemo(e.target.value)}
									placeholder="감사 로그와 Slack 알림에 그대로 남습니다"
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
												"0원 설정을 의도했음을 확인합니다 (해당 액션이 전원 무료가 됩니다)"
											}
										</Label>
									</Checkbox.Content>
								</Checkbox>
							)}
						</div>
					</Modal.Body>
					<Modal.Footer>
						<Button onClick={onClose} variant={"tertiary"} size={"md"}>
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
	const [memo, setMemo] = useState("");
	const [confirmFree, setConfirmFree] = useState(false);
	const [confirmLarge, setConfirmLarge] = useState(false);
	const [needConfirmFree, setNeedConfirmFree] = useState(false);
	const [needConfirmLarge, setNeedConfirmLarge] = useState(false);
	const [conflict, setConflict] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const priceNum = Number(price);
	const valid =
		memo.trim() &&
		price !== "" &&
		Number.isInteger(priceNum) &&
		priceNum >= 0 &&
		priceNum !== row.price;
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
			const msg = getAdminErrorMessage(e, "가격 수정 실패");
			const need = neededConfirm(msg);
			if (need === "confirmFree") setNeedConfirmFree(true);
			if (need === "confirmLargeChange") setNeedConfirmLarge(true);
			// 409 — 다른 관리자가 먼저 저장했다. version 이 낡았으므로 재조회 없이는 저장 불가.
			if (isAdminConflictError(e)) setConflict(true);
			setError(msg);
		} finally {
			setSaving(false);
		}
	};
	return (
		<Modal.Backdrop
			isOpen={true}
			onOpenChange={(isOpen) => {
				if (!isOpen) onClose?.();
			}}
			isDismissable={onClose !== undefined}
		>
			<Modal.Container size="md" scroll="inside">
				<Modal.Dialog style={{ width: '100%', maxWidth: 600, minWidth: 0 }}>
					<Modal.Header>
						<Modal.Heading>
							정가 수정 — {featureLabel(row.featureType)}
						</Modal.Heading>
					</Modal.Header>
					<Modal.Body>
						<div style={{ marginTop: 8 }} className="flex flex-col gap-4">
							{error && (
								<Alert
									status={
										(
											{
												error: "danger",
												info: "default",
												warning: "warning",
												success: "success",
												default: "default",
											} as const
										)[conflict ? "warning" : "error"]
									}
								>
									<Alert.Content>
										{error}
										{conflict &&
											" 창을 닫고 목록을 새로고침한 뒤 다시 시도하세요."}
									</Alert.Content>
								</Alert>
							)}
							<div className="flex flex-wrap items-center gap-2">
								<ScopeChip countryCode={row.countryCode} gender={row.gender} />
								<p className={"text-sm text-neutral-700"}>
									현재 정가 {row.price}구슬 · version {row.version}
								</p>
							</div>
							<TextField className="w-full">
								<Label>{"새 정가 (구슬 개수)"}</Label>
								<Input
									type="number"
									value={price}
									onChange={(e) => setPrice(e.target.value)}
									{...{ min: 0 }}
								/>
							</TextField>
							<TextField className="w-full">
								<Label>{"변경 사유 (필수)"}</Label>
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
										<Label>{"0원 설정을 의도했음을 확인합니다"}</Label>
									</Checkbox.Content>
								</Checkbox>
							)}
							{needConfirmLarge && (
								<Checkbox
									isSelected={confirmLarge}
									onChange={(checked) => setConfirmLarge(checked)}
								>
									<Checkbox.Content>
										<Checkbox.Control>
											<Checkbox.Indicator />
										</Checkbox.Control>
										<Label>
											{"기존 대비 ±50% 를 넘는 변경임을 확인합니다"}
										</Label>
									</Checkbox.Content>
								</Checkbox>
							)}
						</div>
					</Modal.Body>
					<Modal.Footer>
						<Button onClick={onClose} variant={"tertiary"} size={"md"}>
							취소
						</Button>
						<Button
							onClick={submit}
							variant={"primary"}
							isDisabled={
								!valid ||
								saving ||
								conflict ||
								(needConfirmFree && !confirmFree) ||
								(needConfirmLarge && !confirmLarge)
							}
							size={"md"}
						>
							저장
						</Button>
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
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
	const [memo, setMemo] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const next = !row.isActive;
	const submit = async () => {
		setSaving(true);
		setError(null);
		try {
			await AdminService.gemPricing.setPriceActive(row.id, {
				isActive: next,
				memo: memo.trim(),
			});
			onSaved();
		} catch (e) {
			setError(getAdminErrorMessage(e, "상태 변경 실패"));
		} finally {
			setSaving(false);
		}
	};
	return (
		<Modal.Backdrop
			isOpen={true}
			onOpenChange={(isOpen) => {
				if (!isOpen) onClose?.();
			}}
			isDismissable={onClose !== undefined}
		>
			<Modal.Container size="md" scroll="inside">
				<Modal.Dialog style={{ width: '100%', maxWidth: 444, minWidth: 0 }}>
					<Modal.Header>
						<Modal.Heading>
							{next ? "가격 행 활성화" : "가격 행 비활성화"}
						</Modal.Heading>
					</Modal.Header>
					<Modal.Body>
						<div style={{ marginTop: 8 }} className="flex flex-col gap-4">
							{error && (
								<Alert status={"danger"}>
									<Alert.Content>{error}</Alert.Content>
								</Alert>
							)}
							<p className={"text-sm text-neutral-700"}>
								{featureOptionLabel(row.featureType)}· {row.price}구슬
							</p>
							{!next && (
								<Alert status={"warning"}>
									<Alert.Content>
										비활성화하면 이 행은 없는 것으로 취급되어 다음 우선순위 행이
										적용됩니다. 대체할 행이 하나도 없으면 해당 액션은 실행되지
										않고 에러가 납니다.
									</Alert.Content>
								</Alert>
							)}
							<TextField className="w-full">
								<Label>{"변경 사유 (필수)"}</Label>
								<TextArea
									value={memo}
									onChange={(e) => setMemo(e.target.value)}
									rows={4}
								/>
							</TextField>
						</div>
					</Modal.Body>
					<Modal.Footer>
						<Button onClick={onClose} variant={"tertiary"} size={"md"}>
							취소
						</Button>
						<Button
							onClick={submit}
							variant={"primary"}
							isDisabled={!memo.trim() || saving}
							size={"md"}
						>
							{next ? "활성화" : "비활성화"}
						</Button>
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}
