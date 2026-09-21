import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/shared/utils/index"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#222222] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#ff385c] text-white hover:bg-[#e00b41]",
        secondary:
          "border-transparent bg-[#f7f7f7] text-[#222222] hover:bg-[#f2f2f2]",
        destructive:
          "border-transparent bg-[#c13515] text-white hover:bg-[#b32505]",
        outline: "border-[#dddddd] text-[#222222]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
