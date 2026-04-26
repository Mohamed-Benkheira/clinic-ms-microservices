import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
const badgeVariants = cva("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors", {
  variants: { variant: { default: "bg-blue-500/15 text-blue-400", destructive: "bg-red-500/15 text-red-400", success: "bg-green-500/15 text-green-400", warning: "bg-yellow-500/15 text-yellow-400", secondary: "bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]" } },
  defaultVariants: { variant: "default" }
})
export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}
function Badge({ className, variant, ...props }: BadgeProps) { return <div className={cn(badgeVariants({ variant }), className)} {...props} /> }
export { Badge, badgeVariants }
