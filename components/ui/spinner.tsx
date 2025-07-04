"use client"
import { cn } from "@/lib/utils"

export function Spinner({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      role="status"
      {...props}
      className={cn(
        "inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent",
        className
      )}
    />
  )
}
