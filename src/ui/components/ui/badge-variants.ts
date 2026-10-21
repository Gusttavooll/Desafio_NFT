import { cva } from "class-variance-authority"

// Carimbo (.stamp), tag de versão (.version-tag) e contador (.badge-count) do Kronos.
// Nunca em Cobalto: a cor de ação é exclusiva de CTA primário e foco.
export const badgeVariants = cva(
  "mono inline-flex w-fit shrink-0 items-center whitespace-nowrap",
  {
    variants: {
      variant: {
        stamp:
          "gap-1.5 border border-ink bg-paper px-2 py-1 text-[9.5px] leading-[1.4] text-ink before:size-1 before:bg-current before:content-['']",
        version:
          "gap-[5px] bg-ink px-[7px] py-[3px] text-[10px] leading-[1.4] text-paper before:size-1 before:bg-current before:content-['']",
        count:
          "rounded-[2px] bg-ink px-1.5 py-[3px] text-[10px] leading-none font-medium text-paper group-data-[state=active]/tab:bg-paper group-data-[state=active]/tab:text-ink",
      },
    },
    defaultVariants: {
      variant: "stamp",
    },
  }
)
