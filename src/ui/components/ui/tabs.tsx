import * as React from "react"
import { cn } from "@/lib/utils"
import { Tabs as TabsPrimitive } from "radix-ui"

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      orientation={orientation}
      className={cn("flex flex-col gap-4", className)}
      {...props}
    />
  )
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn("flex flex-wrap gap-1.5 max-md:w-full", className)}
      {...props}
    />
  )
}

// Aba do Kronos (.tab-btn): 44px, raio 4px; ativa em grafite com texto Papel.
function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "group/tab inline-flex min-h-touch items-center justify-center gap-2 rounded-xs border border-line bg-paper px-3.5 py-2 font-ui text-[12px] leading-none font-semibold whitespace-nowrap text-ink transition-colors duration-160 ease-out hover:not-disabled:border-ink hover:not-disabled:bg-plate disabled:cursor-not-allowed disabled:bg-plate data-[state=active]:border-ink data-[state=active]:bg-ink data-[state=active]:text-paper max-md:flex-[1_1_150px] max-md:px-2.5 max-md:text-[11px] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[18px]",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
