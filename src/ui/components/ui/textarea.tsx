import * as React from "react"
import { cn } from "cn"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-24 w-full rounded-inner border border-line bg-paper px-3 py-2.5 text-[13px] text-ink transition-colors duration-160 ease-out placeholder:text-muted-foreground hover:not-disabled:border-ink disabled:cursor-not-allowed disabled:bg-plate aria-invalid:border-error",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
