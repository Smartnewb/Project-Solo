"use client";
import {
	Alert,
	Button,
	Checkbox,
	Chip,
	Label,
	Modal,
	Spinner,
	Switch,
	TextArea,
	TextField,
} from "@heroui/react";
import { useState, useEffect, useCallback } from "react";
import AdminService from "@/app/services/admin";
import type { FeatureFlag } from "@/app/services/admin";
import { safeToLocaleDateString } from "@/app/utils/formatters";
import { useConfirm } from "@/shared/ui/admin/confirm-dialog";
import { useToast } from "@/shared/ui/admin/toast";
const AVAILABLE_ROLES = ["admin", "tester", "user"];
function formatRelativeTime(dateStr: string): string {
	const now = Date.now();
	const diff = now - new Date(dateStr).getTime();
	const minutes = Math.floor(diff / 60000);
	if (minutes < 1) return "방금 전";
	if (minutes < 60) return `${minutes}분 전`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}시간 전`;
	const days = Math.floor(hours / 24);
	if (days < 30) return `${days}일 전`;
	return safeToLocaleDateString(dateStr);
}
export default function FeatureFlagsV2() {
	const confirm = useConfirm();
	const toast = useToast();
	const [flags, setFlags] = useState<FeatureFlag[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [togglingFlags, setTogglingFlags] = useState<Set<string>>(new Set());
	const [editOpen, setEditOpen] = useState(false);
	const [editFlag, setEditFlag] = useState<FeatureFlag | null>(null);
	const [editDescription, setEditDescription] = useState("");
	const [editEnabled, setEditEnabled] = useState(false);
	const [editRoles, setEditRoles] = useState<string[]>([]);
	const [editSaving, setEditSaving] = useState(false);
	const fetchFlags = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			const data = await AdminService.featureFlags.getAll();
			setFlags(data);
		} catch (err: any) {
			setError(
				err.response?.data?.message ||
					err.message ||
					"플래그 목록을 불러오지 못했습니다.",
			);
		} finally {
			setLoading(false);
		}
	}, []);
	useEffect(() => {
		fetchFlags();
	}, [fetchFlags]);
	const handleToggle = async (flag: FeatureFlag) => {
		const newEnabled = !flag.enabled;
		const ok = await confirm({
			title: "플래그 변경",
			message: `"${flag.name}" 플래그를 ${newEnabled ? "ON" : "OFF"}(으)로 변경합니다.\n변경 즉시 서비스에 반영됩니다.`,
			confirmText: newEnabled ? "ON 으로 변경" : "OFF 로 변경",
			severity: "warning",
		});
		if (!ok) return;
		setFlags((prev) =>
			prev.map((f) =>
				f.name === flag.name ? { ...f, enabled: newEnabled } : f,
			),
		);
		setTogglingFlags((prev) => new Set(prev).add(flag.name));
		try {
			const updated = await AdminService.featureFlags.toggle(
				flag.name,
				newEnabled,
			);
			setFlags((prev) => prev.map((f) => (f.name === flag.name ? updated : f)));
		} catch {
			setFlags((prev) =>
				prev.map((f) =>
					f.name === flag.name ? { ...f, enabled: flag.enabled } : f,
				),
			);
			const message = `"${flag.name}" 토글에 실패했습니다.`;
			setError(message);
			toast.error(message);
		} finally {
			setTogglingFlags((prev) => {
				const next = new Set(prev);
				next.delete(flag.name);
				return next;
			});
		}
	};
	const openEdit = (flag: FeatureFlag) => {
		setEditFlag(flag);
		setEditDescription(flag.description);
		setEditEnabled(flag.enabled);
		setEditRoles([...flag.allowedRoles]);
		setEditOpen(true);
	};
	const handleRoleToggle = (role: string) => {
		setEditRoles((prev) =>
			prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
		);
	};
	const handleEditSave = async () => {
		if (!editFlag) return;
		setEditSaving(true);
		try {
			const updated = await AdminService.featureFlags.update(editFlag.name, {
				description: editDescription,
				enabled: editEnabled,
				allowedRoles: editRoles,
			});
			setFlags((prev) =>
				prev.map((f) => (f.name === editFlag.name ? updated : f)),
			);
			setEditOpen(false);
		} catch (err: any) {
			const message = err.response?.data?.message || "수정에 실패했습니다.";
			setError(message);
			toast.error(message);
		} finally {
			setEditSaving(false);
		}
	};
	return (
		<div>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					marginBottom: 24,
				}}
			>
				<h1 className={"text-xl font-bold text-neutral-900"}>Feature Flags</h1>
				<Button
					onClick={fetchFlags}
					variant={"secondary"}
					isDisabled={loading}
					size={"sm"}
				>
					새로고침
				</Button>
			</div>
			{error && (
				<Alert style={{ marginBottom: 16 }} status={"danger"}>
					<Alert.Content>{error}</Alert.Content>
				</Alert>
			)}
			{loading ? (
				<div
					style={{
						display: "flex",
						justifyContent: "center",
						paddingTop: 80,
						paddingBottom: 80,
					}}
				>
					<Spinner aria-label="불러오는 중" size="sm" />
				</div>
			) : flags.length === 0 ? (
				<section style={{ padding: 32, textAlign: "center" }}>
					<p className={"text-sm text-neutral-700"}>등록된 플래그가 없습니다</p>
				</section>
			) : (
				<div className={"overflow-x-auto"}>
					<table
						className={
							"w-full text-sm text-left [&_td]:p-3 [&_thead]:bg-neutral-50 [&_tr]:border-b"
						}
					>
						<thead>
							<tr style={{ backgroundColor: "#f9fafb" }}>
								<th style={{ fontWeight: 600 }} scope="col">
									Name
								</th>
								<th style={{ fontWeight: 600 }} scope="col">
									설명
								</th>
								<th style={{ fontWeight: 600 }} scope="col">
									상태
								</th>
								<th style={{ fontWeight: 600 }} scope="col">
									적용 범위
								</th>
								<th style={{ fontWeight: 600 }} scope="col">
									국가
								</th>
								<th style={{ fontWeight: 600 }} scope="col">
									수정일
								</th>
							</tr>
						</thead>
						<tbody>
							{flags.map((flag) => (
								<tr key={flag.name} style={{ cursor: "pointer" }}>
									<td>
										<Button
											variant="ghost"
											onPress={() => openEdit(flag)}
											aria-label={`${flag.name} 설정 수정`}
											className="font-mono"
										>
											{flag.name}
										</Button>
									</td>
									<td>
										<p
											style={{ maxWidth: 300 }}
											className={"text-sm text-neutral-700"}
										>
											{flag.description}
										</p>
									</td>
									<td onClick={(e) => e.stopPropagation()}>
										<div
											style={{
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
												gap: 8,
											}}
										>
											<Switch
												isSelected={flag.enabled}
												isDisabled={togglingFlags.has(flag.name)}
												onChange={() => handleToggle(flag)}
												aria-label={`${flag.name} 활성화`}
											>
												<Switch.Content>
													<Switch.Control>
														<Switch.Thumb />
													</Switch.Control>
												</Switch.Content>
											</Switch>
											<Chip
												style={{
													minWidth: 40,
													fontWeight: 600,
													fontSize: "0.7rem",
												}}
												size={"sm"}
												variant={"soft"}
											>
												<Chip.Label>{flag.enabled ? "ON" : "OFF"}</Chip.Label>
											</Chip>
										</div>
									</td>
									<td>
										{flag.allowedRoles.length === 0 ? (
											<span className={"text-sm text-neutral-700"}>
												전체 공개
											</span>
										) : (
											<div
												style={{ display: "flex", gap: 4, flexWrap: "wrap" }}
											>
												{flag.allowedRoles.map((role) => (
													<Chip
														key={role}
														style={{ fontSize: "0.7rem" }}
														size={"sm"}
														variant={"soft"}
													>
														<Chip.Label>{role}</Chip.Label>
													</Chip>
												))}
											</div>
										)}
									</td>
									<td className="whitespace-nowrap">
										<p className={"text-sm text-neutral-700"}>
											{flag.country ? flag.country.toUpperCase() : "전체"}
										</p>
									</td>
									<td className="whitespace-nowrap">
										<span className={"text-sm text-neutral-700"}>
											{formatRelativeTime(flag.updatedAt)}
										</span>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
			<Modal.Backdrop
				isOpen={editOpen}
				onOpenChange={(isOpen) => {
					if (!isOpen && !editSaving) setEditOpen(false);
				}}
				isDismissable={!editSaving}
				isKeyboardDismissDisabled={editSaving}
			>
				<Modal.Container size="md" scroll="inside">
					<Modal.Dialog style={{ width: '100%', maxWidth: 600, minWidth: 0 }}>
						<Modal.Header style={{ fontWeight: 700 }}>
							<Modal.Heading>
								플래그 수정
								{editFlag && (
									<p
										style={{ fontFamily: "monospace", marginTop: 4 }}
										className={"text-sm text-neutral-700"}
									>
										{editFlag.name}
									</p>
								)}
							</Modal.Heading>
						</Modal.Header>
						<Modal.Body>
							<TextField className="w-full">
								<Label>{"설명"}</Label>
								<TextArea
									rows={2}
									value={editDescription}
									onChange={(e) => setEditDescription(e.target.value)}
									style={{ marginBottom: 24, marginTop: 8 }}
									aria-label={"설명"}
								/>
							</TextField>
							<Switch isSelected={editEnabled} onChange={setEditEnabled}>
								<Switch.Content>
									<Switch.Control>
										<Switch.Thumb />
									</Switch.Control>
									<Label>
										{editEnabled ? "ON (활성화)" : "OFF (비활성화)"}
									</Label>
								</Switch.Content>
							</Switch>
							<p
								style={{ marginBottom: 8, fontWeight: 600 }}
								className={"text-sm text-neutral-700"}
							>
								적용 범위 (allowedRoles)
							</p>
							<span
								style={{ marginBottom: 8, display: "block" }}
								className={"text-sm text-neutral-700"}
							>
								아무것도 선택하지 않으면 모든 유저에게 적용됩니다
							</span>
							<div style={{ display: "flex", gap: 8 }}>
								{AVAILABLE_ROLES.map((role) => (
									<Checkbox
										key={role}
										isSelected={editRoles.includes(role)}
										onChange={() => handleRoleToggle(role)}
									>
										<Checkbox.Content>
											<Checkbox.Control>
												<Checkbox.Indicator />
											</Checkbox.Control>
											<Label>{role}</Label>
										</Checkbox.Content>
									</Checkbox>
								))}
							</div>
						</Modal.Body>
						<Modal.Footer
							style={{
								paddingLeft: 24,
								paddingRight: 24,
								paddingTop: 16,
								paddingBottom: 16,
							}}
						>
							<Button
								onClick={() => setEditOpen(false)}
								variant={"tertiary"}
								isDisabled={editSaving}
								size={"md"}
							>
								취소
							</Button>
							<Button
								onClick={handleEditSave}
								variant={"primary"}
								isDisabled={editSaving}
								size={"md"}
							>
								{editSaving ? (
									<Spinner aria-label="불러오는 중" size="sm" />
								) : (
									"저장"
								)}
							</Button>
						</Modal.Footer>
					</Modal.Dialog>
				</Modal.Container>
			</Modal.Backdrop>
		</div>
	);
}
