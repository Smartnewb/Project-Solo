"use client";
import {
	Alert,
	Button,
	Checkbox,
	Description,
	Input,
	Label,
	ListBox,
	Select,
	Separator,
	Spinner,
	Switch,
	TextArea,
	TextField,
} from "@heroui/react";
import { ArrowLeft, Save } from "lucide-react";
import { useState } from "react";
import { Controller } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useAdminForm } from "@/app/admin/hooks/forms";
import {
	policyDocumentSchema,
	type PolicyDocumentFormValues,
} from "@/app/admin/hooks/forms/schemas/policy-document.schema";
import { useRegisterPolicyDocument } from "@/app/admin/hooks";
import { useUnsavedGuard } from "@/app/admin/hooks/use-unsaved-guard";
import { useToast } from "@/shared/ui/admin/toast/toast-context";
import { useConfirm } from "@/shared/ui/admin/confirm-dialog/confirm-dialog-context";
import { getAdminErrorMessage } from "@/shared/lib/http/admin-fetch";
import type {
	PolicyDecision,
	PolicyDocumentType,
	RegisterPolicyDocumentRequest,
} from "@/types/admin";
const DOCUMENT_TYPE_LABELS: Record<PolicyDocumentType, string> = {
	TERMS_OF_SERVICE: "이용약관",
	PRIVACY_POLICY: "개인정보처리방침",
	DATA_COLLECTION_CONSENT: "개인정보 수집·이용 동의",
	SENSITIVE_INFO_CONSENT: "민감정보 처리 동의",
	THIRD_PARTY_PROVISION: "제3자 제공 동의",
	MARKETING_CONSENT: "마케팅 수신 동의",
	REFUND_POLICY: "환불정책",
	LBS_TERMS: "위치기반서비스 이용약관",
	LOCATION_INFO_CONSENT: "위치정보 수집 동의",
	CHILD_SAFETY_POLICY: "아동 안전 정책",
};
const FIVE_AXIS_TYPES: PolicyDocumentType[] = [
	"PRIVACY_POLICY",
	"DATA_COLLECTION_CONSENT",
	"SENSITIVE_INFO_CONSENT",
	"THIRD_PARTY_PROVISION",
];
const ADVERSE_TYPES: PolicyDocumentType[] = [
	"TERMS_OF_SERVICE",
	"REFUND_POLICY",
];
const LOCATION_TYPES: PolicyDocumentType[] = [
	"LBS_TERMS",
	"LOCATION_INFO_CONSENT",
];
const FIVE_AXIS_FIELDS = [
	["axisCollectionItems", "수집 항목"],
	["axisPurpose", "이용 목적"],
	["axisRetentionPeriod", "보유·이용 기간"],
	["axisThirdParty", "제3자 제공"],
	["axisSensitiveInfo", "민감정보 처리"],
] as const;
const MARKETING_FIELDS = [
	["marketingMediaExpanded", "수신 매체 확대 (문자/이메일/앱푸시 등)"],
	["marketingAdTypeExpanded", "광고 유형 확대"],
	["marketingNightExpanded", "야간 광고 수신 확대"],
] as const;
const DEFAULT_VALUES: PolicyDocumentFormValues = {
	documentType: "TERMS_OF_SERVICE",
	version: "",
	diffSummary: "",
	changeReason: "",
	contentUrl: "",
	noticeStartedAt: "",
	effectiveAt: "",
	noticeVisibleUntil: "",
	isMandatory: false,
	axisCollectionItems: false,
	axisPurpose: false,
	axisRetentionPeriod: false,
	axisThirdParty: false,
	axisSensitiveInfo: false,
	adverseOrMaterial: false,
	marketingMediaExpanded: false,
	marketingAdTypeExpanded: false,
	marketingNightExpanded: false,
	locationScopeExpanded: false,
	reconsentOverride: false,
	reconsentOverrideReason: "",
	privacyPolicyDisclosureConfirmed: false,
	minimalCollectionConfirmed: false,
};
function toIsoString(localDateTime: string): string {
	return new Date(localDateTime).toISOString();
}
function buildPayload(
	data: PolicyDocumentFormValues,
	acknowledgeWarnings: boolean,
): RegisterPolicyDocumentRequest {
	const payload: RegisterPolicyDocumentRequest = {
		documentType: data.documentType,
		version: data.version.trim(),
		diffSummary: data.diffSummary.trim(),
		changeReason: data.changeReason.trim(),
		contentUrl: data.contentUrl?.trim() || undefined,
		noticeStartedAt: toIsoString(data.noticeStartedAt),
		effectiveAt: toIsoString(data.effectiveAt),
		noticeVisibleUntil: data.noticeVisibleUntil
			? toIsoString(data.noticeVisibleUntil)
			: undefined,
		isMandatory: data.isMandatory,
	};
	if (acknowledgeWarnings) {
		payload.acknowledgeWarnings = true;
	}
	if (FIVE_AXIS_TYPES.includes(data.documentType)) {
		payload.axisCollectionItems = !!data.axisCollectionItems;
		payload.axisPurpose = !!data.axisPurpose;
		payload.axisRetentionPeriod = !!data.axisRetentionPeriod;
		payload.axisThirdParty = !!data.axisThirdParty;
		payload.axisSensitiveInfo = !!data.axisSensitiveInfo;
	}
	if (ADVERSE_TYPES.includes(data.documentType)) {
		payload.adverseOrMaterial = !!data.adverseOrMaterial;
		payload.reconsentOverride = !!data.reconsentOverride;
		if (data.reconsentOverride) {
			payload.reconsentOverrideReason = data.reconsentOverrideReason?.trim();
		}
	}
	if (data.documentType === "MARKETING_CONSENT") {
		payload.marketingMediaExpanded = !!data.marketingMediaExpanded;
		payload.marketingAdTypeExpanded = !!data.marketingAdTypeExpanded;
		payload.marketingNightExpanded = !!data.marketingNightExpanded;
	}
	if (LOCATION_TYPES.includes(data.documentType)) {
		payload.locationScopeExpanded = !!data.locationScopeExpanded;
	}
	if (data.documentType === "SENSITIVE_INFO_CONSENT") {
		payload.privacyPolicyDisclosureConfirmed =
			!!data.privacyPolicyDisclosureConfirmed;
	}
	if (data.isMandatory) {
		payload.minimalCollectionConfirmed = !!data.minimalCollectionConfirmed;
	}
	return payload;
}
function IssueList({
	items,
}: {
	items: string[];
}) {
	return (
		<ul style={{ margin: 0, paddingLeft: 20 }}>
			{items.map((item, idx) => (
				<li key={idx}>
					<p className={"text-sm text-neutral-700"}>{item}</p>
				</li>
			))}
		</ul>
	);
}
export function PolicyDocumentForm() {
	const router = useRouter();
	const toast = useToast();
	const confirmAction = useConfirm();
	const registerMutation = useRegisterPolicyDocument();
	const [blockers, setBlockers] = useState<string[]>([]);
	const [warnings, setWarnings] = useState<string[]>([]);
	const [decision, setDecision] = useState<PolicyDecision | null>(null);
	const [saved, setSaved] = useState(false);
	const {
		control,
		watch,
		getValues,
		handleFormSubmit,
		formState: { isSubmitting, isDirty },
	} = useAdminForm<PolicyDocumentFormValues>({
		schema: policyDocumentSchema,
		defaultValues: DEFAULT_VALUES,
	});
	useUnsavedGuard(isDirty && !saved, isSubmitting);
	const documentType = watch("documentType");
	const isMandatory = watch("isMandatory");
	const reconsentOverride = watch("reconsentOverride");
	const showFiveAxis = FIVE_AXIS_TYPES.includes(documentType);
	const showAdverse = ADVERSE_TYPES.includes(documentType);
	const showMarketing = documentType === "MARKETING_CONSENT";
	const showLocation = LOCATION_TYPES.includes(documentType);
	const showPrivacyDisclosure = documentType === "SENSITIVE_INFO_CONSENT";
	const submit = async (
		data: PolicyDocumentFormValues,
		acknowledgeWarnings: boolean,
	) => {
		setBlockers([]);
		try {
			const payload = buildPayload(data, acknowledgeWarnings);
			const result = await registerMutation.mutateAsync(payload);
			setDecision(result.decision);
			if (result.saved) {
				setWarnings([]);
				setSaved(true);
				toast.success(
					`정책 문서가 등록되었습니다. (공지 트랙: ${result.decision.noticeTrack}, 재동의 필요: ${result.decision.requiresReconsent ? "예" : "아니오"})`,
				);
				router.push("/admin/policy-documents");
				return;
			}
			// saved === false: 200 응답이지만 blockers 또는 warnings로 인해 저장되지 않음
			if (result.blockers.length > 0) {
				setBlockers(result.blockers);
				setWarnings(result.warnings ?? []);
				toast.error(
					result.message || "등록할 수 없습니다. 아래 항목을 확인해주세요.",
				);
				return;
			}
			setWarnings(result.warnings ?? []);
			toast.warning(
				result.message || "경고 사항을 확인한 후 다시 등록해주세요.",
			);
		} catch (err) {
			toast.error(getAdminErrorMessage(err, "등록에 실패했습니다."));
		}
	};
	const onSubmit = handleFormSubmit((data) => submit(data, false));
	const handleAcknowledgeSubmit = async () => {
		await submit(getValues(), true);
	};
	const handleCancel = async () => {
		if (isDirty && !saved) {
			const ok = await confirmAction({
				title: "작성 취소",
				message: "작성 중인 내용이 저장되지 않습니다. 취소하시겠습니까?",
			});
			if (!ok) return;
		}
		router.push("/admin/policy-documents");
	};
	return (
		<div
			style={{
				padding: 24,
				maxWidth: 900,
				marginLeft: "auto",
				marginRight: "auto",
			}}
		>
			<div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
				<Button
					onClick={handleCancel}
					style={{ marginRight: 16 }}
					variant={"tertiary"}
					size={"md"}
				>
					{<ArrowLeft size={18} />}목록으로
				</Button>
				<h2 className={"text-lg font-semibold text-neutral-900"}>
					정책 개정 등록
				</h2>
			</div>
			{blockers.length > 0 && (
				<Alert style={{ marginBottom: 16 }} status={"danger"}>
					<Alert.Content>
						<div>등록할 수 없습니다</div>
						<IssueList items={blockers} />
						{warnings.length > 0 && (
							<>
								<Separator
									style={{ marginTop: 12, marginBottom: 12 }}
								></Separator>
								<p
									style={{ marginBottom: 4 }}
									className={"text-sm text-neutral-700"}
								>
									추가 경고 사항
								</p>
								<IssueList items={warnings} />
							</>
						)}
					</Alert.Content>
				</Alert>
			)}
			{blockers.length === 0 && warnings.length > 0 && (
				<Alert style={{ marginBottom: 16 }} status={"warning"}>
					<Alert.Content>
						<div>확인이 필요한 경고</div>
						<IssueList items={warnings} />
						<Button
							style={{ marginTop: 8 }}
							onClick={handleAcknowledgeSubmit}
							variant={"secondary"}
							isDisabled={isSubmitting}
							size={"sm"}
						>
							경고 확인하고 등록
						</Button>
					</Alert.Content>
				</Alert>
			)}
			{decision && blockers.length === 0 && (
				<Alert style={{ marginBottom: 16 }} status={"default"}>
					<Alert.Content>
						공지 트랙: {decision.noticeTrack}· 재동의 필요:{" "}
						{decision.requiresReconsent ? "예" : "아니오"}
						{decision.reconsentAxes.length > 0 &&
							` · 재동의 축: ${decision.reconsentAxes.join(", ")}`}
						{decision.needsLegalReview && " · 법무 검토 필요"}
					</Alert.Content>
				</Alert>
			)}
			<section style={{ padding: 24, marginBottom: 24 }}>
				<h2
					style={{ marginBottom: 16 }}
					className={"text-lg font-semibold text-neutral-900"}
				>
					기본 정보
				</h2>
				<Controller
					name="documentType"
					control={control}
					render={({ field }) => (
						<div style={{ marginBottom: 16 }}>
							<Select className="w-full">
								<Label>{"문서 종류"}</Label>
								<Select.Trigger>
									<Select.Value />
									<Select.Indicator />
								</Select.Trigger>
								<Select.Popover>
									<ListBox>
										{Object.entries(DOCUMENT_TYPE_LABELS).map(
											([value, label]) => (
												<ListBox.Item
													id={value}
													textValue={String(label)}
													key={value}
												>
													{label}
												</ListBox.Item>
											),
										)}
									</ListBox>
								</Select.Popover>
							</Select>
						</div>
					)}
				/>
				<Controller
					name="version"
					control={control}
					render={({ field, fieldState }) => (
						<TextField className="w-full" isInvalid={!!fieldState.error}>
							<Label>{"버전"}</Label>
							<Input
								{...field}
								placeholder="예: 2026.07.1"
								style={{ marginBottom: 16 }}
								required
							/>
							<Description>{fieldState.error?.message}</Description>
						</TextField>
					)}
				/>
				<Controller
					name="diffSummary"
					control={control}
					render={({ field, fieldState }) => (
						<TextField className="w-full" isInvalid={!!fieldState.error}>
							<Label>{"신구대조 (변경 전/후 비교)"}</Label>
							<TextArea
								{...field}
								rows={4}
								style={{ marginBottom: 16 }}
								required
							/>
							<Description>{fieldState.error?.message}</Description>
						</TextField>
					)}
				/>
				<Controller
					name="changeReason"
					control={control}
					render={({ field, fieldState }) => (
						<TextField className="w-full" isInvalid={!!fieldState.error}>
							<Label>{"변경사유"}</Label>
							<TextArea
								{...field}
								rows={3}
								style={{ marginBottom: 16 }}
								required
							/>
							<Description>{fieldState.error?.message}</Description>
						</TextField>
					)}
				/>
				<Controller
					name="contentUrl"
					control={control}
					render={({ field, fieldState }) => (
						<TextField className="w-full" isInvalid={!!fieldState.error}>
							<Label>{"전문 URL (선택)"}</Label>
							<Input
								{...field}
								value={field.value ?? ""}
								placeholder="https://..."
							/>
							<Description>{fieldState.error?.message}</Description>
						</TextField>
					)}
				/>
			</section>
			<section style={{ padding: 24, marginBottom: 24 }}>
				<h2
					style={{ marginBottom: 16 }}
					className={"text-lg font-semibold text-neutral-900"}
				>
					공지·시행 일정
				</h2>
				<div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
					<Controller
						name="noticeStartedAt"
						control={control}
						render={({ field, fieldState }) => (
							<TextField className="w-full" isInvalid={!!fieldState.error}>
								<Label>{"공지 시작일"}</Label>
								<Input {...field} type="datetime-local" required />
								<Description>{fieldState.error?.message}</Description>
							</TextField>
						)}
					/>
					<Controller
						name="effectiveAt"
						control={control}
						render={({ field, fieldState }) => (
							<TextField className="w-full" isInvalid={!!fieldState.error}>
								<Label>{"시행일"}</Label>
								<Input {...field} type="datetime-local" required />
								<Description>{fieldState.error?.message}</Description>
							</TextField>
						)}
					/>
				</div>
				<Controller
					name="noticeVisibleUntil"
					control={control}
					render={({ field, fieldState }) => (
						<TextField className="w-full" isInvalid={!!fieldState.error}>
							<Label>{"공지 노출 종료일 (선택)"}</Label>
							<Input
								{...field}
								value={field.value ?? ""}
								type="datetime-local"
							/>
							<Description>{fieldState.error?.message}</Description>
						</TextField>
					)}
				/>
			</section>
			<section style={{ padding: 24, marginBottom: 24 }}>
				<h2
					style={{ marginBottom: 16 }}
					className={"text-lg font-semibold text-neutral-900"}
				>
					필수 여부
				</h2>
				<Controller
					name="isMandatory"
					control={control}
					render={({ field }) => (
						<Switch
							isSelected={field.value}
							onChange={(checked) => field.onChange(checked)}
						>
							<Switch.Content>
								<Switch.Control>
									<Switch.Thumb />
								</Switch.Control>
								<Label>{"필수 동의 항목"}</Label>
							</Switch.Content>
						</Switch>
					)}
				/>
				{isMandatory && (
					<>
						<Separator style={{ marginTop: 16, marginBottom: 16 }}></Separator>
						<Controller
							name="minimalCollectionConfirmed"
							control={control}
							render={({ field }) => (
								<Checkbox
									isSelected={!!field.value}
									onChange={(checked) => field.onChange(checked)}
								>
									<Checkbox.Content>
										<Checkbox.Control>
											<Checkbox.Indicator />
										</Checkbox.Control>
										<Label>{"최소수집 원칙을 확인했습니다."}</Label>
									</Checkbox.Content>
								</Checkbox>
							)}
						/>
					</>
				)}
			</section>
			{showFiveAxis && (
				<section style={{ padding: 24, marginBottom: 24 }}>
					<h2
						style={{ marginBottom: 16 }}
						className={"text-lg font-semibold text-neutral-900"}
					>
						5축 변경 체크리스트
					</h2>
					<p style={{ marginBottom: 8 }} className={"text-sm text-neutral-700"}>
						이번 개정에서 변경된 항목을 모두 선택해주세요.
					</p>
					{FIVE_AXIS_FIELDS.map(([name, label]) => (
						<Controller
							key={name}
							name={name}
							control={control}
							render={({ field }) => (
								<Checkbox
									isSelected={!!field.value}
									onChange={(checked) => field.onChange(checked)}
								>
									<Checkbox.Content>
										<Checkbox.Control>
											<Checkbox.Indicator />
										</Checkbox.Control>
										<Label>{label}</Label>
									</Checkbox.Content>
								</Checkbox>
							)}
						/>
					))}
					{showPrivacyDisclosure && (
						<>
							<Separator
								style={{ marginTop: 16, marginBottom: 16 }}
							></Separator>
							<Controller
								name="privacyPolicyDisclosureConfirmed"
								control={control}
								render={({ field }) => (
									<Checkbox
										isSelected={!!field.value}
										onChange={(checked) => field.onChange(checked)}
									>
										<Checkbox.Content>
											<Checkbox.Control>
												<Checkbox.Indicator />
											</Checkbox.Control>
											<Label>
												{"개인정보처리방침에 §23③ 반영 여부를 확인했습니다."}
											</Label>
										</Checkbox.Content>
									</Checkbox>
								)}
							/>
						</>
					)}
				</section>
			)}
			{showAdverse && (
				<section style={{ padding: 24, marginBottom: 24 }}>
					<h2
						style={{ marginBottom: 16 }}
						className={"text-lg font-semibold text-neutral-900"}
					>
						불리·중대 변경 여부
					</h2>
					<Controller
						name="adverseOrMaterial"
						control={control}
						render={({ field }) => (
							<Checkbox
								isSelected={!!field.value}
								onChange={(checked) => field.onChange(checked)}
							>
								<Checkbox.Content>
									<Checkbox.Control>
										<Checkbox.Indicator />
									</Checkbox.Control>
									<Label>{"이용자에게 불리하거나 중대한 변경입니다."}</Label>
								</Checkbox.Content>
							</Checkbox>
						)}
					/>
					<Separator style={{ marginTop: 16, marginBottom: 16 }}></Separator>
					<Controller
						name="reconsentOverride"
						control={control}
						render={({ field }) => (
							<Checkbox
								isSelected={!!field.value}
								onChange={(checked) => field.onChange(checked)}
							>
								<Checkbox.Content>
									<Checkbox.Control>
										<Checkbox.Indicator />
									</Checkbox.Control>
									<Label>{"재동의 예외 처리 (재동의를 받지 않고 진행)"}</Label>
								</Checkbox.Content>
							</Checkbox>
						)}
					/>
					{reconsentOverride && (
						<Controller
							name="reconsentOverrideReason"
							control={control}
							render={({ field, fieldState }) => (
								<TextField className="w-full" isInvalid={!!fieldState.error}>
									<Label>{"재동의 예외 사유"}</Label>
									<TextArea
										{...field}
										value={field.value ?? ""}
										rows={2}
										style={{ marginTop: 8 }}
										required
									/>
									<Description>{fieldState.error?.message}</Description>
								</TextField>
							)}
						/>
					)}
				</section>
			)}
			{showMarketing && (
				<section style={{ padding: 24, marginBottom: 24 }}>
					<h2
						style={{ marginBottom: 16 }}
						className={"text-lg font-semibold text-neutral-900"}
					>
						마케팅 수신동의 확대 체크리스트
					</h2>
					{MARKETING_FIELDS.map(([name, label]) => (
						<Controller
							key={name}
							name={name}
							control={control}
							render={({ field }) => (
								<Checkbox
									isSelected={!!field.value}
									onChange={(checked) => field.onChange(checked)}
								>
									<Checkbox.Content>
										<Checkbox.Control>
											<Checkbox.Indicator />
										</Checkbox.Control>
										<Label>{label}</Label>
									</Checkbox.Content>
								</Checkbox>
							)}
						/>
					))}
				</section>
			)}
			{showLocation && (
				<section style={{ padding: 24, marginBottom: 24 }}>
					<h2
						style={{ marginBottom: 16 }}
						className={"text-lg font-semibold text-neutral-900"}
					>
						위치 정보 범위 체크리스트
					</h2>
					<Controller
						name="locationScopeExpanded"
						control={control}
						render={({ field }) => (
							<Checkbox
								isSelected={!!field.value}
								onChange={(checked) => field.onChange(checked)}
							>
								<Checkbox.Content>
									<Checkbox.Control>
										<Checkbox.Indicator />
									</Checkbox.Control>
									<Label>{"위치 정보 수집·이용 범위가 확대되었습니다."}</Label>
								</Checkbox.Content>
							</Checkbox>
						)}
					/>
				</section>
			)}
			<div
				style={{
					display: "flex",
					gap: 16,
					justifyContent: "flex-end",
					marginBottom: 24,
				}}
			>
				<Button
					onClick={handleCancel}
					variant={"secondary"}
					isDisabled={isSubmitting}
					size={"md"}
				>
					취소
				</Button>
				<Button
					onClick={onSubmit}
					variant={"primary"}
					isDisabled={isSubmitting}
					size={"md"}
				>
					{isSubmitting ? (
						<Spinner aria-label="불러오는 중" size="sm" />
					) : (
						<Save size={18} />
					)}
					{isSubmitting ? "등록 중..." : "등록"}
				</Button>
			</div>
		</div>
	);
}
