import * as React from "react"

import { cn } from "@/shared/utils/index"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[96px] w-full rounded-lg border border-[#dddddd] bg-white px-4 py-3 text-base text-[#222222] placeholder:text-[#6a6a6a] focus-visible:outline-none focus-visible:ring-0 focus-visible:border-[#222222] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
