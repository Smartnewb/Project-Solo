"use client";
import * as React from "react";
import { Popover as HeroPopover } from "@heroui/react";
import { Pressable } from "react-aria-components";
function Popover({
	open,
	defaultOpen,
	...props
}: Omit<React.ComponentProps<typeof HeroPopover>, "isOpen"> & {
	open?: boolean;
	defaultOpen?: boolean;
}) {
	return <HeroPopover {...props} isOpen={open} defaultOpen={defaultOpen} />;
}
function PopoverTrigger({
	asChild,
	children,
	...props
}: React.HTMLAttributes<HTMLDivElement> & { asChild?: boolean }) {
	return asChild &&
		React.isValidElement<React.HTMLAttributes<HTMLElement>>(children) ? (
		<Pressable>
			{
				React.cloneElement(children, props) as React.ComponentProps<
					typeof Pressable
				>["children"]
			}
		</Pressable>
	) : (
		<HeroPopover.Trigger {...props}>{children}</HeroPopover.Trigger>
	);
}
function PopoverContent({
	align = "center",
	sideOffset = 4,
	children,
	...props
}: React.ComponentProps<typeof HeroPopover.Content> & {
	align?: "start" | "center" | "end";
	sideOffset?: number;
}) {
	return (
		<HeroPopover.Content
			{...props}
			offset={sideOffset}
			placement={align === "center" ? "bottom" : `bottom ${align}`}
		>
			<HeroPopover.Dialog>{children}</HeroPopover.Dialog>
		</HeroPopover.Content>
	);
}
export { Popover, PopoverTrigger, PopoverContent };
