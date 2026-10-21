import * as React from "react"
import { type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"

import { buttonVariants } from "@/ui/components/ui/button-variants"

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  onClick,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"
  // aria-busy bloqueia reenvio enquanto a ação está em andamento.
  const busy = props["aria-busy"] === true || props["aria-busy"] === "true"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      onClick={busy ? (event) => event.preventDefault() : onClick}
      {...props}
    />
  )
}

export { Button }
