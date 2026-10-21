import { cn } from "@/lib/utils"

// Placa com shimmer de 1,4s; com prefers-reduced-motion fica estático.
// Quem usa o skeleton continua responsável por anunciar o estado em texto.
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn(
        "relative w-full overflow-hidden bg-plate after:absolute after:inset-0 after:animate-shimmer after:bg-[linear-gradient(100deg,transparent,rgb(255_255_255/0.65),transparent)] after:content-[''] motion-reduce:after:hidden",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
