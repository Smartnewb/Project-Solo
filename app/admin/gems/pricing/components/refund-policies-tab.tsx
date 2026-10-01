"use client";
import {
	Alert,
	Button,
	Checkbox,
	Input,
	Label,
	Modal,
	TextArea,
	TextField,
} from "@heroui/react";
import { useCallback, useEffect, useState } from "react";
import { formatDateTimeKR } from "@/app/utils/formatters";
import { AdminLoading } from "@/shared/ui/admin/loading";
import {
	getAdminErrorMessage,
	isAdminConflictError,
} from "@/shared/lib/http/admin-fetch";
import AdminService from "@/app/services/admin";
import type { GemRefundPolicyRow } from "@/app/services/admin";
import { neededConfirm } from "./shared";
interface Props {
	onChanged: () => void;
}
export default function RefundPoliciesTab({ onChanged }: Props) {
	const [policies, setPolicies] = useState<GemRefundPolicyRow[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [editTarget, setEditTarget] = useState<GemRefundPolicyRow | null>(null);
	const load = useCallback(async () => {
		setLoading(true);
		try {
			setPolicies(await AdminService.gemPricing.listRefundPolicies());
			setError(null);
		} catch (e) {
			setError(getAdminErrorMessage(e, "환급 정책을 불러오지 못했습니다"));
		} finally {
			setLoading(false);
		}
	}, []);
	useEffect(() => {
		void load();
	}, [load]);
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
					환급 <b>금액</b>은 여기서 정하지 않습니다 — 환급은 항상{" "}
					<b>차감 당시 실제로 빠져나간 개수</b>만큼 돌려줍니다(가격 인상·할인
					종료 후에도 동일). 이 탭은 &ldquo;어떤 조건까지 환급을
					허용할지&rdquo;의 임계값만 조정합니다.
				</Alert.Content>
			</Alert>
			<div className={"overflow-x-auto"}>
				<table
					className={
						"w-full text-sm text-left [&_td]:p-3 [&_th]:p-3 [&_thead]:bg-neutral-50 [&_tr]:border-b"
					}
				>
					<thead>
						<tr style={{ backgroundColor: "#f5f5f5" }}>
							<th style={{ fontWeight: 700 }} scope="col">
								정책
							</th>
							<th style={{ fontWeight: 700, width: 100 }} scope="col">
								현재 값
							</th>
							<th style={{ fontWeight: 700 }} scope="col">
								설명
							</th>
							<th style={{ fontWeight: 700, width: 150 }} scope="col">
								수정 시각
							</th>
							<th style={{ fontWeight: 700, width: 90 }} scope="col"></th>
						</tr>
					</thead>
					<tbody>
						{policies.length === 0 ? (
							<tr>
								<td colSpan={5} style={{ paddingTop: 48, paddingBottom: 48 }}>
									<p className={"text-sm text-neutral-700"}>
										등록된 환급 정책이 없습니다
									</p>
								</td>
							</tr>
						) : (
							policies.map((row) => (
								<tr key={row.policyKey}>
									<td>
										<p className={"text-sm text-neutral-700"}>{row.label}</p>
										<span className={"text-sm text-neutral-700"}>
											<code>{row.policyKey}</code>
										</span>
									</td>
									<td style={{ fontWeight: 700 }}>{row.value}</td>
									<td>
										<p className={"text-sm text-neutral-700"}>
											{row.description || "-"}
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
			{editTarget && (
				<EditPolicyDialog
					row={editTarget}
					onClose={() => setEditTarget(null)}
					onSaved={() => {
						setEditTarget(null);
						void load();
						onChanged();
					}}
				/>
			)}
		</div>
	);
}
function EditPolicyDialog({
	row,
	onClose,
	onSaved,
}: {
	row: GemRefundPolicyRow;
	onClose: () => void;
	onSaved: () => void;
}) {
	const [value, setValue] = useState(String(row.value));
	const [memo, setMemo] = useState("");
	const [confirmLarge, setConfirmLarge] = useState(false);
	const [needConfirmLarge, setNeedConfirmLarge] = useState(false);
	const [conflict, setConflict] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const valueNum = Number(value);
	const valid =
		memo.trim() &&
		value !== "" &&
		Number.isInteger(valueNum) &&
		valueNum >= 0 &&
		valueNum !== row.value;
	const submit = async () => {
		setSaving(true);
		setError(null);
		try {
			await AdminService.gemPricing.updateRefundPolicy(row.policyKey, {
				value: valueNum,
				memo: memo.trim(),
				version: row.version,
				confirmLargeChange: confirmLarge || undefined,
			});
			onSaved();
		} catch (e) {
			const msg = getAdminErrorMessage(e, "환급 정책 수정 실패");
			if (neededConfirm(msg) === "confirmLargeChange")
				setNeedConfirmLarge(true);
			// 409 — version 이 낡았다. 재조회 없이는 저장 불가.
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
						<Modal.Heading>{row.label}수정</Modal.Heading>
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
							<p className={"text-sm text-neutral-700"}>
								<code>{row.policyKey}</code>· 현재 {row.value}· version{" "}
								{row.version}
							</p>
							{row.description && (
								<p className={"text-sm text-neutral-700"}>{row.description}</p>
							)}
							<TextField className="w-full">
								<Label>{"새 임계값"}</Label>
								<Input
									type="number"
									value={value}
									onChange={(e) => setValue(e.target.value)}
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
											{
												"기존값 대비 2배 이상 변경임을 확인합니다 (환급 대상 폭이 통째로 달라집니다)"
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
							isDisabled={
								!valid ||
								saving ||
								conflict ||
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
