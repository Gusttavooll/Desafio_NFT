import { cva } from "class-variance-authority"

// Botão do Kronos (.btn), com os nomes de variante padrão do shadcn/ui:
// default = primário em Cobalto (só CTA primário), outline = padrão Papel com borda --line,
// secondary = tinta (grafite), destructive = perigo, ghost e link.
export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-3 rounded-inner border font-ui text-[12px] leading-[1.2] font-bold whitespace-nowrap no-underline select-none transition-[transform,background-color,border-color,box-shadow] duration-160 ease-out active:not-disabled:not-aria-busy:scale-97 disabled:cursor-not-allowed disabled:border-line disabled:bg-plate disabled:text-ink aria-busy:cursor-progress [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[18px]",
  {
    variants: {
      variant: {
        default:
          "border-action bg-action text-paper hover:not-disabled:shadow-[inset_0_0_0_40px_rgb(0_0_0/0.12)]",
        outline:
          "border-line bg-paper text-ink hover:not-disabled:border-ink hover:not-disabled:bg-plate",
        secondary: "border-ink bg-ink text-paper",
        destructive:
          "border-error bg-paper text-error hover:not-disabled:shadow-[inset_0_0_0_1px_var(--error)]",
        ghost:
          "border-transparent bg-transparent text-ink hover:not-disabled:bg-plate",
        link: "border-transparent bg-transparent text-ink underline-offset-4 hover:underline",
      },
      size: {
        default: "min-h-button px-[18px] py-[11px]",
        icon: "size-touch p-0",
      },
    },
    compoundVariants: [{ variant: "link", className: "min-h-touch px-0 py-0" }],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
