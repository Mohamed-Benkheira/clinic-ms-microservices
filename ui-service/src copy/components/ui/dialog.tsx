import * as React from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"
interface DialogProps { open: boolean; onClose: () => void; children: React.ReactNode; className?: string }
export function Dialog({ open, onClose, children, className }: DialogProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={cn("relative bg-[hsl(var(--card))] border rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto", className)}>{children}</div>
    </div>
  )
}
export function DialogHeader({ children, onClose }: { children: React.ReactNode; onClose?: () => void }) {
  return (
    <div className="flex items-center justify-between p-6 border-b">
      <div>{children}</div>
      {onClose && <button onClick={onClose} className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"><X size={18} /></button>}
    </div>
  )
}
export function DialogTitle({ children }: { children: React.ReactNode }) { return <h2 className="text-lg font-semibold">{children}</h2> }
export function DialogBody({ children }: { children: React.ReactNode }) { return <div className="p-6">{children}</div> }
