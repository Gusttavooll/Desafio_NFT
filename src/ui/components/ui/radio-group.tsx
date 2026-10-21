import * as React from "react"
import { cn } from "cn"
import { RadioGroup as RadioGroupPrimitive } from "radix-ui"

// Opção do Kronos (.rail-option / .edition-card): grade de 2 colunas que vira 1 até 640px.
function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn("grid w-full gap-2.5 sm:grid-cols-2", className)}
      {...props}
    />
  )
}

// Cartão selecionável: selecionado ganha borda de 2px grafite e fundo Placa.
function RadioGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        "flex min-h-touch w-full items-center justify-between gap-3 rounded-inner border border-line bg-paper p-3.5 text-left text-ink transition-[transform,background-color,border-color] duration-160 ease-out hover:not-disabled:border-ink hover:not-disabled:bg-plate active:not-disabled:scale-99 disabled:cursor-not-allowed disabled:bg-plate aria-invalid:border-error data-[state=checked]:border-2 data-[state=checked]:border-ink data-[state=checked]:bg-plate data-[state=checked]:p-[13px]",
        className
      )}
      {...props}
    />
  )
}

export { RadioGroup, RadioGroupItem }
