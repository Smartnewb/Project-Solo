"use client";
import * as React from "react";
import { Tabs as HeroTabs } from "@heroui/react";
type Props = Omit<
	React.ComponentProps<typeof HeroTabs>,
	"selectedKey" | "onSelectionChange"
> & {
	value?: string;
	defaultValue?: string;
	onValueChange?: (value: string) => void;
};
function Tabs({ value, defaultValue, onValueChange, ...props }: Props) {
	return (
		<HeroTabs
			{...props}
			selectedKey={value}
			defaultSelectedKey={defaultValue}
			onSelectionChange={(key) => onValueChange?.(String(key))}
		/>
	);
}
const TabsList = HeroTabs.List;
function TabsTrigger({
	value,
	disabled,
	...props
}: Omit<React.ComponentProps<typeof HeroTabs.Tab>, "id"> & {
	value: string;
	disabled?: boolean;
}) {
	return <HeroTabs.Tab {...props} id={value} isDisabled={disabled} />;
}
function TabsContent({
	value,
	...props
}: Omit<React.ComponentProps<typeof HeroTabs.Panel>, "id"> & {
	value: string;
}) {
	return <HeroTabs.Panel {...props} id={value} />;
}
export { Tabs, TabsList, TabsTrigger, TabsContent };
