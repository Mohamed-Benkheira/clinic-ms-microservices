import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] disabled:pointer-events-none disabled:opacity-50",
  { variants: { variant: { default: "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90", destructive: "bg-[hsl(var(--destructive))] text-white hover:opacity-90", outline: "border border-[hsl(var(--border))] bg-transparent hover:bg-[hsl(var(--accent))]", secondary: "bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] hover:opacity-80", ghost: "hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))]" }, size: { default: "h-9 px-4 py-2", sm: "h-8 rounded-md px-3 text-xs", lg: "h-10 rounded-md px-8", icon: "h-9 w-9" } }, defaultVariants: { variant: "default", size: "default" } }
)
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => (
  <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
))
Button.displayName = "Button"
export { Button, buttonVariants }
