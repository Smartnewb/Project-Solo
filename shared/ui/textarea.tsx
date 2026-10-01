"use client";
import * as React from "react";
import { TextArea } from "@heroui/react";
const Textarea = React.forwardRef<
	HTMLTextAreaElement,
	React.ComponentProps<"textarea">
>((props, ref) => <TextArea {...props} ref={ref} />);
Textarea.displayName = "Textarea";
export { Textarea };
