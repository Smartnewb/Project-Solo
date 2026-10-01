"use client";
import * as React from "react";
import { Modal as HeroModal } from "@heroui/react";
import { cn } from "@/shared/utils";
interface ModalProps
	extends Omit<React.ComponentProps<typeof HeroModal.Dialog>, "children"> {
	isOpen: boolean;
	onClose: () => void;
	children: React.ReactNode;
}
function Modal({ isOpen, onClose, children, className, ...props }: ModalProps) {
	return (
		<HeroModal.Backdrop
			isOpen={isOpen}
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
		>
			<HeroModal.Container size="lg">
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
