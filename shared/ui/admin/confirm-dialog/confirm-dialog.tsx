"use client";
import { Button, Modal } from "@heroui/react";
import { useConfirmDialogState } from "./confirm-dialog-context";
export function ConfirmDialog() {
	const { state, handleConfirm, handleCancel } = useConfirmDialogState();
	return (
		<Modal.Backdrop
			isOpen={state.open}
			onOpenChange={(open) => {
				if (!open) handleCancel();
			}}
		>
			<Modal.Container size="sm">
				<Modal.Dialog>
					<Modal.Header>
						<Modal.Heading>{state.title ?? "확인"}</Modal.Heading>
					</Modal.Header>
					<Modal.Body>
						<p className="text-muted">{state.message}</p>
					</Modal.Body>
					<Modal.Footer>
						<Button variant="secondary" onPress={handleCancel}>
							{state.cancelText ?? "취소"}
						</Button>
						<Button
							variant={state.severity === "error" ? "danger" : "primary"}
							onPress={handleConfirm}
						>
							{state.confirmText ?? "확인"}
						</Button>
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}
