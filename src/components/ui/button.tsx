import * as React from "react"
import { cn } from "../../lib/utils"

// Needs class-variance-authority, I forgot to install it. 
// I'll add it to the install list or just use simple cn for now.
// For now, I'll use simple cn to avoid dependency hell if I can't install.
// Actually, I can write a simple version without CVA.

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'outline' | 'ghost';
    size?: 'default' | 'sm' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'default', size = 'default', ...props }, ref) => {
        const variants = {
            default: "bg-blue-600 text-white hover:bg-blue-700",
            outline: "border border-gray-200 bg-white hover:bg-gray-100 text-gray-900",
            ghost: "hover:bg-gray-100 text-gray-900",
        }
        const sizes = {
            default: "h-10 px-4 py-2",
            sm: "h-9 rounded-md px-3",
            icon: "h-10 w-10",
        }

        return (
            <button
                className={cn(
                    "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
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
