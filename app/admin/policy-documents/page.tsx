"use client";
import {
	Button,
	Chip,
	Label,
	ListBox,
	Modal,
	ProgressBar,
	Select,
	Spinner,
} from "@heroui/react";
import { ListChecks, Plus, Send } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
	usePolicyDocumentList,
	usePolicyConsentProgress,
	usePublishPolicyDocument,
} from "@/app/admin/hooks";
import { useToast } from "@/shared/ui/admin/toast/toast-context";
import { useConfirm } from "@/shared/ui/admin/confirm-dialog/confirm-dialog-context";
import { getAdminErrorMessage } from "@/shared/lib/http/admin-fetch";
import type { PolicyDocumentStatus, PolicyDocumentType } from "@/types/admin";
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
const STATUS_LABELS: Record<PolicyDocumentStatus, string> = {
	DRAFT: "초안",
	SCHEDULED: "공지 예정",
	NOTICE_ACTIVE: "공지 중",
	EFFECTIVE: "시행 중",
	SUPERSEDED: "대체됨",
};
const STATUS_COLORS: Record<
	PolicyDocumentStatus,
	"default" | "info" | "warning" | "success"
> = {
	DRAFT: "default",
	SCHEDULED: "info",
	NOTICE_ACTIVE: "warning",
	EFFECTIVE: "success",
	SUPERSEDED: "default",
};
function formatDate(value?: string | null) {
	if (!value) return "-";
	return new Date(value).toLocaleString("ko-KR");
}
function ConsentProgressDialog({
	id,
	onClose,
}: {
	id: string;
	onClose: () => void;
}) {
	const { data, isLoading } = usePolicyConsentProgress(id);
	return (
		<Modal.Backdrop
			isOpen={true}
			onOpenChange={(isOpen) => {
				if (!isOpen) onClose?.();
			}}
			isDismissable={onClose !== undefined}
		>
			<Modal.Container size="md" scroll="inside">
				<Modal.Dialog>
					<Modal.Header>
						<Modal.Heading>재동의 진행 현황</Modal.Heading>
					</Modal.Header>
					<Modal.Body>
						{isLoading || !data ? (
							<div
								style={{
									display: "flex",
									justifyContent: "center",
									paddingTop: 32,
									paddingBottom: 32,
								}}
							>
								<Spinner aria-label="불러오는 중" size="sm" />
							</div>
						) : (
							<div
								style={{
									display: "flex",
									flexDirection: "column",
									gap: 12,
									paddingTop: 8,
									paddingBottom: 8,
								}}
							>
								<p className={"text-sm text-neutral-700"}>
									{DOCUMENT_TYPE_LABELS[data.documentType]}· v{data.version}
								</p>
								<div>
									<div
										style={{
											display: "flex",
											justifyContent: "space-between",
											marginBottom: 4,
										}}
									>
										<p className={"text-sm text-neutral-700"}>완료율</p>
										<p className={"text-sm text-neutral-700"}>
											{(data.completionRate * 100).toFixed(1)}%
										</p>
									</div>
									<ProgressBar
										value={data.completionRate * 100}
										aria-label="진행률"
									>
										<ProgressBar.Track>
											<ProgressBar.Fill />
										</ProgressBar.Track>
									</ProgressBar>
								</div>
								<div
									style={{ display: "flex", justifyContent: "space-between" }}
								>
									<p className={"text-sm text-neutral-700"}>대상 유저</p>
									<p className={"text-sm text-neutral-700"}>
										{data.eligibleUsers.toLocaleString()}명
									</p>
								</div>
								<div
									style={{ display: "flex", justifyContent: "space-between" }}
								>
									<p className={"text-sm text-neutral-700"}>동의</p>
									<p className={"text-sm text-neutral-700"}>
										{data.consented.toLocaleString()}명
									</p>
								</div>
								<div
									style={{ display: "flex", justifyContent: "space-between" }}
								>
									<p className={"text-sm text-neutral-700"}>거부</p>
									<p className={"text-sm text-neutral-700"}>
										{data.declined.toLocaleString()}명
									</p>
								</div>
								<div
									style={{ display: "flex", justifyContent: "space-between" }}
								>
									<p className={"text-sm text-neutral-700"}>대기</p>
									<p className={"text-sm text-neutral-700"}>
										{data.pending.toLocaleString()}명
									</p>
								</div>
							</div>
						)}
					</Modal.Body>
					<Modal.Footer>
						<Button onClick={onClose} variant={"tertiary"} size={"md"}>
							닫기
						</Button>
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}
export default function PolicyDocumentsPage() {
	const router = useRouter();

	const toast = useToast();
	const confirmAction = useConfirm();
	const [statusFilter, setStatusFilter] = useState<PolicyDocumentStatus | "">(
		"",
	);
	const [typeFilter, setTypeFilter] = useState<PolicyDocumentType | "">("");
	const [progressId, setProgressId] = useState<string | null>(null);
	const { data: documents = [], isLoading } = usePolicyDocumentList({
		status: statusFilter || undefined,
		documentType: typeFilter || undefined,
	});
	const publishMutation = usePublishPolicyDocument();
	const handlePublish = async (id: string, version: string) => {
		const ok = await confirmAction({
			title: "공지 개시",
			message: `버전 ${version} 문서의 공지를 지금 개시하시겠습니까? 앱 배너는 바로 노출됩니다. 개별 푸시·이메일 안내는 배치가 약 10분 안에 자동 발송하며, 09:00~21:00 사이에만 발송됩니다.`,
		});
		if (!ok) return;
		try {
			await publishMutation.mutateAsync(id);
			toast.success(
				"공지가 개시되었습니다. 앱 배너는 바로 노출되고, 개별 푸시·이메일은 배치가 자동 발송합니다(09:00~21:00).",
			);
		} catch (err: unknown) {
			toast.error(getAdminErrorMessage(err, "공지 개시에 실패했습니다."));
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
				<h2 className={"text-lg font-semibold text-neutral-900"}>
					정책 개정 등록
				</h2>
				<Button
					onPress={() => router.push("/admin/policy-documents/create")}
					variant={"primary"}
					size={"md"}
				>
					{<Plus size={18} />}정책 개정 등록
				</Button>
			</div>
			<div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
				<div style={{ minWidth: 200 }}>
					<Select
						value={typeFilter}
						onChange={(key) => {
							const value = String(key ?? "");
							setTypeFilter(value as PolicyDocumentType | "");
						}}
						className="w-full"
					>
						<Label>{"문서 종류"}</Label>
						<Select.Trigger>
							<Select.Value />
							<Select.Indicator />
						</Select.Trigger>
						<Select.Popover>
							<ListBox>
								<ListBox.Item id={""} textValue={"전체"} key={""}>
									전체
								</ListBox.Item>
								{Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
									<ListBox.Item
										id={value}
										textValue={String(label)}
										key={value}
									>
										{label}
									</ListBox.Item>
								))}
							</ListBox>
						</Select.Popover>
					</Select>
				</div>
				<div style={{ minWidth: 160 }}>
					<Select
						value={statusFilter}
						onChange={(key) => {
							const value = String(key ?? "");
							setStatusFilter(value as PolicyDocumentStatus | "");
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
								<ListBox.Item id={""} textValue={"전체"} key={""}>
									전체
								</ListBox.Item>
								{Object.entries(STATUS_LABELS).map(([value, label]) => (
									<ListBox.Item
										id={value}
										textValue={String(label)}
										key={value}
									>
										{label}
									</ListBox.Item>
								))}
							</ListBox>
						</Select.Popover>
					</Select>
				</div>
			</div>
			{isLoading ? (
				<div
					style={{
						display: "flex",
						justifyContent: "center",
						paddingTop: 32,
						paddingBottom: 32,
					}}
				>
					<Spinner aria-label="불러오는 중" size="sm" />
				</div>
			) : (
				<div className={"overflow-x-auto"}>
					<table
						className={
							"w-full text-sm text-left [&_td]:p-3 [&_th]:p-3 [&_thead]:bg-neutral-50 [&_tr]:border-b"
						}
					>
						<thead>
							<tr>
								<th scope="col">문서 종류</th>
								<th scope="col">버전</th>
								<th scope="col">상태</th>
								<th scope="col">공지 트랙</th>
								<th scope="col">재동의 필요</th>
								<th scope="col">시행일</th>
								<th scope="col">등록일</th>
								<th scope="col">작업</th>
							</tr>
						</thead>
						<tbody>
							{documents.length === 0 ? (
								<tr>
									<td colSpan={8}>
										<p
											style={{ paddingTop: 32, paddingBottom: 32 }}
											className={"text-sm text-neutral-700"}
										>
											등록된 정책 문서가 없습니다.
										</p>
									</td>
								</tr>
							) : (
								documents.map((doc) => (
									<tr key={doc.id}>
										<td>
											{DOCUMENT_TYPE_LABELS[doc.documentType] ??
												doc.documentType}
										</td>
										<td>{doc.version}</td>
										<td>
											<Chip size={"sm"} variant={"soft"}>
												<Chip.Label>
													{STATUS_LABELS[doc.status] ?? doc.status}
												</Chip.Label>
											</Chip>
										</td>
										<td>{doc.noticeTrack}</td>
										<td>
											{doc.requiresReconsent ? (
												<Chip size={"sm"} variant={"soft"}>
													<Chip.Label>
														{doc.reconsentAxes.join(", ") || "필요"}
													</Chip.Label>
												</Chip>
											) : (
												"-"
											)}
										</td>
										<td>{formatDate(doc.effectiveAt)}</td>
										<td>{formatDate(doc.createdAt)}</td>
										<td>
											<div
												style={{
													display: "flex",
													gap: 4,
													justifyContent: "center",
												}}
											>
												{doc.requiresReconsent && (
													<Button
														onClick={() => setProgressId(doc.id)}
														variant={"tertiary"}
														isIconOnly={true}
														aria-label="재동의 진행 현황"
														size={"sm"}
													>
														<ListChecks size={18} />
													</Button>
												)}
												{(doc.status === "DRAFT" ||
													doc.status === "SCHEDULED") && (
													<Button
														onClick={() => handlePublish(doc.id, doc.version)}
														variant={"tertiary"}
														isDisabled={publishMutation.isPending}
														isIconOnly={true}
														aria-label="공지 개시"
														size={"sm"}
													>
														<Send size={18} />
													</Button>
												)}
											</div>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			)}
			{progressId && (
				<ConsentProgressDialog
					id={progressId}
					onClose={() => setProgressId(null)}
				/>
			)}
		</div>
	);
}
