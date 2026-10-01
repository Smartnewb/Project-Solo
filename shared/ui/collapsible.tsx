"use client";
import * as React from "react";
import { Disclosure } from "@heroui/react";
type Props = Omit<
	React.ComponentProps<typeof Disclosure>,
	"isExpanded" | "onExpandedChange"
> & {
	open?: boolean;
	defaultOpen?: boolean;
	onOpenChange?: (open: boolean) => void;
};
function Collapsible({ open, defaultOpen, onOpenChange, ...props }: Props) {
	return (
		<Disclosure
			{...props}
			isExpanded={open}
			defaultExpanded={defaultOpen}
			onExpandedChange={onOpenChange}
		/>
	);
}
function CollapsibleTrigger(
	props: React.ComponentProps<typeof Disclosure.Trigger>,
) {
	return (
		<Disclosure.Heading>
			<Disclosure.Trigger {...props} />
		</Disclosure.Heading>
	);
}
const CollapsibleContent = Disclosure.Content;
export { Collapsible, CollapsibleTrigger, CollapsibleContent };
