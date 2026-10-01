"use client";
import * as React from "react";
import { Slider as HeroSlider } from "@heroui/react";
type Props = Omit<
	React.ComponentProps<typeof HeroSlider>,
	"value" | "defaultValue" | "onChange"
> & {
	value?: number[];
	defaultValue?: number[];
	onValueChange?: (value: number[]) => void;
	onValueCommit?: (value: number[]) => void;
	min?: number;
	max?: number;
	disabled?: boolean;
};
function Slider({
	value,
	defaultValue,
	onValueChange,
	onValueCommit,
	min,
	max,
	disabled,
	...props
}: Props) {
	return (
		<HeroSlider
			{...props}
			value={value}
			defaultValue={defaultValue}
			minValue={min}
			maxValue={max}
			isDisabled={disabled ?? props.isDisabled}
			onChange={(v) => onValueChange?.(Array.isArray(v) ? v : [v])}
			onChangeEnd={(v) => onValueCommit?.(Array.isArray(v) ? v : [v])}
		>
			<HeroSlider.Track>
				<HeroSlider.Fill />
				{(value ?? defaultValue ?? [0]).map((_, index) => (
					<HeroSlider.Thumb
						key={index}
						index={index}
						aria-label={`값 ${index + 1}`}
					/>
				))}
			</HeroSlider.Track>
		</HeroSlider>
	);
}
export { Slider };
