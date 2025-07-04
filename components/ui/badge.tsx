import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default:
          "bg-muted text-muted-foreground",
        github:
          "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
        jira:
          "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
        internal:
          "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        external:
          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

type BadgeProps = React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants>

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }

