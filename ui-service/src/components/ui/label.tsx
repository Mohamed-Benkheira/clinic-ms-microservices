import * as React from "react"
import { cn } from "@/lib/utils"
const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => <label ref={ref} className={cn("text-xs font-medium text-[hsl(var(--muted-foreground))] leading-none block mb-1.5", className)} {...props} />
)
Label.displayName = "Label"
export { Label }
