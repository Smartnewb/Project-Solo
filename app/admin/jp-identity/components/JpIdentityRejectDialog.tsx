"use client";
import { Button, Label, Modal, TextArea, TextField } from "@heroui/react";
import { useEffect, useState } from "react";
import type { JpIdentitySubmission } from "@/app/services/admin";
import { JP_IDENTITY_REJECT_PRESETS, formatJpDocumentType } from "../utils";
type Props = {
	readonly target: JpIdentitySubmission | null;
	readonly busy: boolean;
	readonly onClose: () => void;
	readonly onConfirm: (reason: string) => void;
};
export function JpIdentityRejectDialog({
	target,
	busy,
	onClose,
	onConfirm,
}: Props) {
	const [reason, setReason] = useState("");
	const targetId = target?.id;
	useEffect(() => {
		if (targetId) setReason("");
	}, [targetId]);
	const trimmed = reason.trim();
	const displayName =
		target?.account?.name ?? target?.extracted.name ?? target?.userId ?? "";
	return (
		<Modal.Backdrop
			isOpen={target !== null}
			onOpenChange={(isOpen) => {
				if (!isOpen && !busy) onClose();
			}}
			isDismissable={!busy}
			isKeyboardDismissDisabled={busy}
		>
			<Modal.Container size="md" scroll="inside">
				<Modal.Dialog style={{ width: '100%', maxWidth: 600, minWidth: 0 }}>
					<Modal.Header>
						<Modal.Heading>거절 사유</Modal.Heading>
						<p style={{ marginTop: 4 }} className={"text-sm text-neutral-700"}>
							{displayName}· {formatJpDocumentType(target?.documentType)}—
							사유는 필수이며 유저에게 전달될 수 있습니다.
						</p>
					</Modal.Header>
					<Modal.Body>
						<div
							style={{ marginBottom: 16 }}
							className={"flex flex-wrap items-center gap-2"}
						>
							{JP_IDENTITY_REJECT_PRESETS.map((preset) => {
								const selected = reason === preset.reason;
								return (
									<Button
										key={preset.label}
										aria-pressed={selected}
										onPress={() => setReason(preset.reason)}
										isDisabled={busy}
										size={"sm"}
										variant={selected ? "primary" : "secondary"}
									>
										{preset.label}
									</Button>
								);
							})}
						</div>
						<TextField className="w-full" isDisabled={busy}>
							<Label>{"거절 사유"}</Label>
							<TextArea
								required
								value={reason}
								onChange={(event) => setReason(event.target.value)}
								placeholder="사유를 선택하거나 직접 입력하세요"
								rows={4}
							/>
						</TextField>
					</Modal.Body>
					<Modal.Footer
						style={{ paddingLeft: 24, paddingRight: 24, paddingBottom: 16 }}
					>
						<Button
							onClick={onClose}
							variant={"tertiary"}
							isDisabled={busy}
							size={"md"}
						>
							취소
						</Button>
						<Button
							onClick={() => onConfirm(trimmed)}
							variant={"danger"}
							isDisabled={!trimmed || busy}
							size={"md"}
						>
							거절하기
						</Button>
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}
