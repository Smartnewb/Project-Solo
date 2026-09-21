import * as React from "react"

import { cn } from "@/shared/utils/index"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex min-h-14 w-full rounded-lg border border-[#dddddd] bg-white px-4 py-3 text-base text-[#222222] transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[#222222] placeholder:text-[#6a6a6a] focus-visible:outline-none focus-visible:ring-0 focus-visible:border-[#222222] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
