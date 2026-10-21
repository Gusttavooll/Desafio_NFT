import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

import { Button } from "@/ui/components/ui/button"
import { Input } from "@/ui/components/ui/input"
import { Textarea } from "@/ui/components/ui/textarea"

// Campo composto do Kronos (.search-input-wrap): o anel de foco cobalto fica no contêiner.
function InputGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-group"
      role="group"
      className={cn(
        "group/input-group relative flex h-touch w-full min-w-0 items-center rounded-inner border border-line bg-paper text-ink transition-colors duration-160 ease-out hover:not-has-disabled:border-ink has-disabled:cursor-not-allowed has-disabled:bg-plate has-[[data-slot=input-group-control]:focus-visible]:border-action has-[[data-slot=input-group-control]:focus-visible]:shadow-[0_0_0_var(--focus-gap)_var(--paper),0_0_0_calc(var(--focus-gap)+var(--focus-gap))_var(--action)] has-[[data-slot][aria-invalid=true]]:border-error has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-end]]:flex-col has-[>[data-align=block-start]]:h-auto has-[>[data-align=block-start]]:flex-col has-[>textarea]:h-auto has-[>[data-align=block-end]]:[&>input]:pt-3 has-[>[data-align=block-start]]:[&>input]:pb-3 has-[>[data-align=inline-end]]:[&>input]:pr-1.5 has-[>[data-align=inline-start]]:[&>input]:pl-1.5",
        className
      )}
      {...props}
    />
  )
}

const inputGroupAddonVariants = cva(
  "flex h-auto cursor-text items-center justify-center gap-2 py-1.5 text-[13px] text-ink select-none [&>svg:not([class*='size-'])]:size-[18px]",
  {
    variants: {
      align: {
        "inline-start": "order-first pl-3.5 has-[>button]:pl-0",
        "inline-end": "order-last pr-3.5 has-[>button]:pr-0",
        "block-start":
          "order-first w-full justify-start px-2.5 pt-2 group-has-[>input]/input-group:pt-2 [.border-b]:pb-2",
        "block-end":
          "order-last w-full justify-start px-2.5 pb-2 group-has-[>input]/input-group:pb-2 [.border-t]:pt-2",
      },
    },
    defaultVariants: {
      align: "inline-start",
    },
  }
)

function InputGroupAddon({
  className,
  align = "inline-start",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof inputGroupAddonVariants>) {
  return (
    <div
      role="group"
      data-slot="input-group-addon"
      data-align={align}
      className={cn(inputGroupAddonVariants({ align }), className)}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("button")) {
          return
        }
        e.currentTarget.parentElement?.querySelector("input")?.focus()
      }}
      {...props}
    />
  )
}

// Botão dentro do campo: ocupa a altura do campo e mantém o alvo de toque de 44px.
const inputGroupButtonVariants = cva("flex items-center gap-2 shadow-none", {
  variants: {
    size: {
      default: "min-h-0 px-3",
      icon: "size-touch p-0 has-[>svg]:p-0",
    },
  },
  defaultVariants: {
    size: "default",
  },
})

function InputGroupButton({
  className,
  type = "button",
  variant = "ghost",
  size = "default",
  ...props
}: Omit<React.ComponentProps<typeof Button>, "size"> &
  VariantProps<typeof inputGroupButtonVariants>) {
  return (
    <Button
      type={type}
      data-size={size}
      variant={variant}
      className={cn(inputGroupButtonVariants({ size }), className)}
      {...props}
    />
  )
}

function InputGroupText({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "flex items-center gap-2 text-[13px] text-muted-foreground [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-[18px]",
        className
      )}
      {...props}
    />
  )
}

function InputGroupInput({
  className,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <Input
      data-slot="input-group-control"
      className={cn(
        "h-full flex-1 rounded-none border-0 bg-transparent focus-visible:shadow-none focus-visible:outline-none disabled:bg-transparent",
        className
      )}
      {...props}
    />
  )
}

function InputGroupTextarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <Textarea
      data-slot="input-group-control"
      className={cn(
        "flex-1 resize-none rounded-none border-0 bg-transparent py-2 focus-visible:shadow-none focus-visible:outline-none disabled:bg-transparent",
        className
      )}
      {...props}
    />
  )
}

export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupInput,
  InputGroupTextarea,
}
