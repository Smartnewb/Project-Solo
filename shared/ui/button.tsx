import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/shared/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90 disabled:bg-primary-light disabled:cursor-not-allowed disabled:opacity-50",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 disabled:bg-destructive/40 disabled:cursor-not-allowed disabled:opacity-50",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground disabled:bg-gray-100 disabled:border-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 disabled:bg-secondary/40 disabled:cursor-not-allowed disabled:opacity-50",
        ghost: 
          "hover:bg-accent hover:text-accent-foreground disabled:bg-transparent disabled:text-gray-300 disabled:cursor-not-allowed",
        link: 
          "text-primary underline-offset-4 hover:underline disabled:text-gray-300 disabled:no-underline disabled:cursor-not-allowed",
        white:
          "bg-white text-gray-900 border border-gray-200 shadow-sm hover:bg-white/80 disabled:bg-gray-50 disabled:text-gray-400 disabled:border-gray-100 disabled:cursor-not-allowed",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        xl: "h-12 rounded-md px-10",
        icon: "h-9 w-9",
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
  ({ className, variant, size, asChild = false, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn('!text-lg', buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
