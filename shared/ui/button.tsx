import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/shared/utils/index"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#222222] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[#ff385c] text-white hover:bg-[#e00b41]",
        destructive:
          "bg-[#c13515] text-white hover:bg-[#b32505]",
        outline:
          "border border-[#222222] bg-white text-[#222222] hover:bg-[#f7f7f7]",
        secondary:
          "bg-[#f7f7f7] text-[#222222] hover:bg-[#f2f2f2]",
        ghost: "text-[#222222] hover:bg-[#f7f7f7]",
        link: "text-[#ff385c] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-12 px-6 py-[14px]",
        sm: "h-10 rounded-lg px-4 text-sm",
        lg: "h-12 rounded-lg px-8",
        icon: "h-10 w-10 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
