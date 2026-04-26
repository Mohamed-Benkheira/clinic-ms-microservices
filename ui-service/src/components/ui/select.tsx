import * as React from "react"
import { cn } from "@/lib/utils"
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}
const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ className, children, ...props }, ref) => (
  <select ref={ref} className={cn("flex h-9 w-full rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[hsl(var(--ring))] disabled:opacity-50", className)} {...props}>{children}</select>
))
Select.displayName = "Select"
export { Select }
