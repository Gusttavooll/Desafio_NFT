import * as React from "react"
import { cn } from "cn"

// Campo do Kronos (.field-input): 44px, raio 6px, borda --line, erro via aria-invalid.
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-touch w-full min-w-0 rounded-inner border border-line bg-paper px-3 py-2.5 text-[13px] text-ink transition-colors duration-160 ease-out file:inline-flex file:border-0 file:bg-transparent file:text-[12px] file:font-semibold file:text-ink placeholder:text-muted-foreground hover:not-disabled:border-ink disabled:cursor-not-allowed disabled:bg-plate aria-invalid:border-error",
        className
      )}
      {...props}
    />
  )
}

export { Input }
