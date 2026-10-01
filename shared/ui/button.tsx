"use client";
import * as React from "react";
import { Button as HeroButton } from "@heroui/react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/utils";
const buttonVariants = cva("button rounded-xl", {
	variants: {
		variant: {
			default: "button--primary",
			destructive: "button--danger",
			outline: "button--outline",
			secondary: "button--secondary",
			ghost: "button--tertiary",
			link: "button--ghost underline",
		},
		size: {
			default: "button--md",
			sm: "button--sm",
			lg: "button--lg",
			icon: "button--md size-10 p-0",
		},
	},
	defaultVariants: { variant: "default", size: "default" },
});
export interface ButtonProps
	extends Omit<
			React.ComponentProps<typeof HeroButton>,
			"variant" | "size" | "children"
		>,
		VariantProps<typeof buttonVariants> {
	asChild?: boolean;
	disabled?: boolean;
	children?: React.ReactNode;
}
const variants = {
	default: "primary",
	destructive: "danger",
	outline: "outline",
	secondary: "secondary",
	ghost: "tertiary",
	link: "ghost",
} as const;
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	(
		{
			className,
			variant = "default",
			size = "default",
			asChild,
			disabled,
			children,
			value,
			...props
		},
		ref,
	) => {
		if (asChild && React.isValidElement<{ className?: string }>(children))
			return React.cloneElement(children, {
				...props,
				className: cn(
					buttonVariants({ variant, size }),
					children.props.className,
					className,
				),
			});
		return (
			<HeroButton
				{...props}
				value={value == null ? undefined : String(value)}
				ref={ref}
				isDisabled={disabled ?? props.isDisabled}
				variant={variants[variant ?? "default"]}
				size={size === "default" || size === "icon" || !size ? "md" : size}
				isIconOnly={size === "icon"}
				className={cn("rounded-xl", className)}
			>
				{children}
			</HeroButton>
		);
	},
);
Button.displayName = "Button";
export { Button, buttonVariants };
