"use client";
import * as React from "react";
import { Drawer } from "@heroui/react";
import { X } from "lucide-react";
import { cn } from "@/shared/utils";
import { Text } from "react-aria-components";
const SheetContext = React.createContext({
	open: false,
	setOpen: (_open: boolean) => {},
});
function Sheet({
	open,
	defaultOpen = false,
	onOpenChange,
	children,
}: {
	open?: boolean;
	defaultOpen?: boolean;
	onOpenChange?: (open: boolean) => void;
	children: React.ReactNode;
}) {
	const [local, setLocal] = React.useState(defaultOpen);
	const setOpen = (next: boolean) => {
		setLocal(next);
		onOpenChange?.(next);
	};
	return (
		<SheetContext.Provider value={{ open: open ?? local, setOpen }}>
			{children}
		</SheetContext.Provider>
	);
}
function SheetTrigger(props: React.ComponentProps<typeof Drawer.Trigger>) {
	const { setOpen } = React.useContext(SheetContext);
	return (
		<Drawer.Trigger
			{...props}
			onPress={(event) => {
				props.onPress?.(event);
				setOpen(true);
			}}
		/>
	);
}
const SheetClose = Drawer.CloseTrigger;
const SheetOverlay = Drawer.Backdrop;
function SheetPortal({ children }: { children: React.ReactNode }) {
	return <>{children}</>;
}
function SheetContent({
	side = "right",
	className,
	children,
	...props
}: Omit<React.ComponentProps<typeof Drawer.Dialog>, "children"> & {
	children: React.ReactNode;
	side?: "left" | "right" | "top" | "bottom";
}) {
	const { open, setOpen } = React.useContext(SheetContext);
	return (
		<Drawer.Backdrop isOpen={open} onOpenChange={setOpen}>
			<Drawer.Content placement={side}>
				<Drawer.Dialog {...props} className={cn("relative p-6", className)}>
					<Drawer.CloseTrigger
						aria-label="닫기"
						className="absolute right-3 top-3"
					>
						<X size={18} />
					</Drawer.CloseTrigger>
					{children}
				</Drawer.Dialog>
			</Drawer.Content>
		</Drawer.Backdrop>
	);
}
const SheetHeader = Drawer.Header;
const SheetFooter = Drawer.Footer;
const SheetTitle = Drawer.Heading;
function SheetDescription(props: React.HTMLAttributes<HTMLParagraphElement>) {
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
	Sheet,
	SheetTrigger,
	SheetClose,
	SheetOverlay,
	SheetPortal,
	SheetContent,
	SheetHeader,
	SheetFooter,
	SheetTitle,
	SheetDescription,
};
