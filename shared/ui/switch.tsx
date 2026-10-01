"use client";
import * as React from "react";
import { Switch as HeroSwitch } from "@heroui/react";
type Props = Omit<
	React.ComponentProps<typeof HeroSwitch>,
	"isSelected" | "onChange"
> & {
	checked?: boolean;
	defaultChecked?: boolean;
	disabled?: boolean;
	onCheckedChange?: (checked: boolean) => void;
};
const Switch = React.forwardRef<HTMLDivElement, Props>(
	(
		{ checked, defaultChecked, disabled, onCheckedChange, onClick, ...props },
		ref,
	) => {
		const control = (
			<HeroSwitch
				{...props}
				ref={ref}
				isSelected={checked}
				defaultSelected={defaultChecked}
				isDisabled={disabled ?? props.isDisabled}
				onChange={onCheckedChange}
			>
				<HeroSwitch.Content>
					<HeroSwitch.Control>
						<HeroSwitch.Thumb />
					</HeroSwitch.Control>
				</HeroSwitch.Content>
			</HeroSwitch>
		);
		// React Aria deliberately strips field onClick; keep row propagation guards outside the field.
		return onClick ? (
			<div className="contents" onClick={onClick}>
				{control}
			</div>
		) : (
			control
		);
	},
);
Switch.displayName = "Switch";
export { Switch };
