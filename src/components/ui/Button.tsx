import * as React from "react"
import { cn } from "@/utils/cn"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const baseClasses = "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 sm:text-base"
    
    const variants = {
      default: "bg-[var(--vc-button-primary)] text-white hover:bg-blue-700 focus:ring-blue-500",
      destructive: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
      outline: "border-2 border-[var(--vc-border)] bg-[var(--vc-bg)] hover:bg-[var(--vc-hover)] text-[var(--vc-text)] focus:ring-blue-500",
      secondary: "bg-[var(--vc-bg-secondary)] text-[var(--vc-text)] hover:bg-[var(--vc-hover)] focus:ring-gray-500",
      ghost: "hover:bg-[var(--vc-hover)] text-[var(--vc-text)] focus:ring-gray-500",
      link: "text-[var(--vc-button-primary)] underline-offset-4 hover:underline",
    }

    const sizes = {
      default: "h-10 px-4 py-2 sm:h-11 sm:px-6 sm:py-3",
      sm: "h-8 px-3 py-1 text-xs sm:h-9 sm:px-4 sm:py-2 sm:text-sm",
      lg: "h-12 px-6 py-3 text-base sm:h-14 sm:px-8 sm:py-4 sm:text-lg",
      icon: "h-10 w-10 sm:h-11 sm:w-11",
    }

    return (
      <button
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
