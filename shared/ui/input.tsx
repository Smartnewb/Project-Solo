"use client";
import * as React from "react";
import { Input as HeroInput } from "@heroui/react";
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
	(props, ref) => <HeroInput {...props} ref={ref} />,
);
Input.displayName = "Input";
export { Input };
