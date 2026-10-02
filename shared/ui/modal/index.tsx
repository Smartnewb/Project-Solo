"use client";
import * as React from "react";
import { Modal as HeroModal } from "@heroui/react";
import { cn } from "@/shared/utils";
interface ModalProps
	extends Omit<React.ComponentProps<typeof HeroModal.Dialog>, "children"> {
	isOpen: boolean;
	onClose: () => void;
	children: React.ReactNode;
	/** 요청 진행 중 등 닫히면 안 될 때 false (바깥 클릭/Esc 차단) */
	isDismissable?: boolean;
}
function Modal({
	isOpen,
	onClose,
	children,
	className,
	isDismissable = true,
	...props
}: ModalProps) {
	return (
		<HeroModal.Backdrop
			isOpen={isOpen}
			onOpenChange={(open) => {
				if (!open && isDismissable) onClose();
			}}
			isDismissable={isDismissable}
			isKeyboardDismissDisabled={!isDismissable}
		>
			<HeroModal.Container size="lg" scroll="outside">
				<HeroModal.Dialog
					{...props}
					aria-label={props["aria-label"] ?? "대화상자"}
					className={cn("p-0", className)}
				>
					{children}
				</HeroModal.Dialog>
			</HeroModal.Container>
		</HeroModal.Backdrop>
	);
}
function ModalHeader({
	onClose,
	children,
	...props
}: React.HTMLAttributes<HTMLDivElement> & { onClose?: () => void }) {
	return (
		<HeroModal.Header {...props}>
			<HeroModal.Heading>{children}</HeroModal.Heading>
			{onClose && <HeroModal.CloseTrigger aria-label="닫기" />}
		</HeroModal.Header>
	);
}
const ModalContent = HeroModal.Body;
const ModalFooter = HeroModal.Footer;
export { Modal, ModalHeader, ModalContent, ModalFooter };
