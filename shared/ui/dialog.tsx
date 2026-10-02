"use client";
import * as React from "react";
import { Modal, Button } from "@heroui/react";
import { X } from "lucide-react";
import { cn } from "@/shared/utils";
import { Text } from "react-aria-components";
type Props = {
	open?: boolean;
	defaultOpen?: boolean;
	onOpenChange?: (open: boolean) => void;
	children: React.ReactNode;
};
const DialogContext = React.createContext({
	open: false,
	setOpen: (_open: boolean) => {},
});
function Dialog({ open, defaultOpen = false, onOpenChange, children }: Props) {
	const [local, setLocal] = React.useState(defaultOpen);
	const setOpen = (next: boolean) => {
		setLocal(next);
		onOpenChange?.(next);
	};
	return (
		<DialogContext.Provider value={{ open: open ?? local, setOpen }}>
			{children}
		</DialogContext.Provider>
	);
}
function DialogTrigger({
	asChild,
	children,
	...props
}: Omit<React.ComponentProps<typeof Button>, "children"> & {
	asChild?: boolean;
	children: React.ReactNode;
}) {
	const { setOpen } = React.useContext(DialogContext);
	if (
		asChild &&
		React.isValidElement<{ onClick?: React.MouseEventHandler<HTMLElement> }>(
			children,
		)
	)
		return React.cloneElement(children, {
			onClick: (event: React.MouseEvent<HTMLElement>) => {
				children.props.onClick?.(event);
				if (!event.defaultPrevented) setOpen(true);
			},
		});
	return (
		<Button
			{...props}
			onPress={(event) => {
				props.onPress?.(event);
				setOpen(true);
			}}
		>
			{children}
		</Button>
	);
}
const DialogClose = Modal.CloseTrigger;
const DialogOverlay = Modal.Backdrop;
function DialogPortal({ children }: { children: React.ReactNode }) {
	return <>{children}</>;
}
function DialogContent({
	className,
	children,
	isDismissable = true,
	...props
}: Omit<React.ComponentProps<typeof Modal.Dialog>, "children"> & {
	children: React.ReactNode;
	/** 요청 진행 중 등 닫히면 안 될 때 false (바깥 클릭/Esc 차단) */
	isDismissable?: boolean;
}) {
	const { open, setOpen } = React.useContext(DialogContext);
	return (
		<Modal.Backdrop
			isOpen={open}
			onOpenChange={(next) => {
				if (next || isDismissable) setOpen(next);
			}}
			isDismissable={isDismissable}
			isKeyboardDismissDisabled={!isDismissable}
		>
			<Modal.Container size="lg" scroll="outside">
				<Modal.Dialog {...props} className={cn("relative min-w-0 p-6 break-words", className)}>
					{children}
					<Modal.CloseTrigger
						aria-label="닫기"
						className="absolute right-3 top-3"
					>
						<X size={18} />
					</Modal.CloseTrigger>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}
const DialogHeader = Modal.Header;
const DialogFooter = Modal.Footer;
const DialogTitle = Modal.Heading;
function DialogDescription(props: React.HTMLAttributes<HTMLParagraphElement>) {
	return (
		<Text
			slot="description"
			elementType="p"
			{...props}
			className={cn("text-sm text-muted", props.className)}
		/>
	);
}
export {
	Dialog,
	DialogTrigger,
	DialogClose,
	DialogOverlay,
	DialogPortal,
	DialogContent,
	DialogHeader,
	DialogFooter,
	DialogTitle,
	DialogDescription,
};
