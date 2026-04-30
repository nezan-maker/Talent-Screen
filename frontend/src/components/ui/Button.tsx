import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-accent to-[#FB7A2A] text-white hover:opacity-90 shadow-soft focus-visible:ring-accent/40 border border-transparent",
  outline:
    "bg-surface dark:bg-slate-800 text-text-primary border border-border dark:border-slate-700 hover:bg-bg dark:hover:bg-slate-700 focus-visible:ring-accent/30",
  ghost: "bg-transparent text-text-primary hover:bg-bg dark:hover:bg-slate-800 border border-transparent",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-sm",
  lg: "h-12 px-8 text-base",
  icon: "h-10 w-10 p-0 shrink-0",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-pill font-semibold transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
});
