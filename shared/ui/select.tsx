"use client";
import * as React from "react";
import {
	Select as HeroSelect,
	ListBox,
	Header,
	Separator,
} from "@heroui/react";
type Props = Omit<
	React.ComponentProps<typeof HeroSelect>,
	"value" | "onChange" | "defaultValue"
> & {
	value?: string;
	defaultValue?: string;
	onValueChange?: (value: string) => void;
	disabled?: boolean;
};
function Select({
	value,
	defaultValue,
	onValueChange,
	disabled,
	...props
}: Props) {
	return (
		<HeroSelect
			{...props}
			value={value === undefined ? undefined : value || null}
			defaultValue={defaultValue}
			onChange={(key) => onValueChange?.(String(key ?? ""))}
			isDisabled={disabled ?? props.isDisabled}
		/>
	);
}
const SelectTrigger = React.forwardRef<
	HTMLButtonElement,
	Omit<React.ComponentProps<typeof HeroSelect.Trigger>, "children"> & {
		children?: React.ReactNode;
	}
>(({ children, ...props }, ref) => (
	<HeroSelect.Trigger {...props} ref={ref}>
		{children}
		<HeroSelect.Indicator />
	</HeroSelect.Trigger>
));
SelectTrigger.displayName = "SelectTrigger";
function SelectValue({
	placeholder,
	...props
}: React.ComponentProps<typeof HeroSelect.Value> & { placeholder?: string }) {
	return (
		<HeroSelect.Value {...props}>
			{({ isPlaceholder, selectedText }) =>
				isPlaceholder ? placeholder : selectedText
			}
		</HeroSelect.Value>
	);
}
function SelectContent({
	children,
	position: _position,
	...props
}: React.ComponentProps<typeof HeroSelect.Popover> & { position?: string }) {
	return (
		<HeroSelect.Popover {...props}>
			<ListBox>{children}</ListBox>
		</HeroSelect.Popover>
	);
}
// 트리거에 보일 텍스트. `{20}`, `{n}개` 같은 숫자/조합 children 도 포함한다.
function textOf(children: React.ReactNode): string | undefined {
	const text = React.Children.toArray(children)
		.filter((c) => typeof c === "string" || typeof c === "number")
		.join("");
	return text || undefined;
}
function SelectItem({
	value,
	disabled,
	children,
	...props
}: Omit<React.ComponentProps<typeof ListBox.Item>, "id" | "children"> & {
	value: string;
	disabled?: boolean;
	children?: React.ReactNode;
}) {
	return (
		<ListBox.Item
			{...props}
			id={value}
			isDisabled={disabled ?? props.isDisabled}
			textValue={props.textValue ?? textOf(children)}
		>
			{children}
			<ListBox.ItemIndicator />
		</ListBox.Item>
	);
}
const SelectGroup = ListBox.Section;
const SelectLabel = Header;
const SelectSeparator = Separator;
export {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectItem,
	SelectGroup,
	SelectLabel,
	SelectSeparator,
};
