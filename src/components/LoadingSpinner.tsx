import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  text?: string;
  variant?: "full-page" | "inline" | "overlay" | "glass";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string; // allow overrides
  inheritColor?: boolean;
}

export function LoadingSpinner({
  text,
  variant = "full-page",
  size = "lg",
  className,
  inheritColor = true,
}: LoadingSpinnerProps) {
  const sizeConfig = {
    sm: { icon: "size-4", text: "text-xs" },
    md: { icon: "size-5", text: "text-sm" },
    lg: { icon: "size-8", text: "text-base" },
    xl: { icon: "size-12", text: "text-lg" },
  };

  const { icon: iconClass, text: textClass } = sizeConfig[size];
  const colorClass = inheritColor ? "text-current" : "text-primary";

  // Base icon with spin animation
  const spinnerIcon = (
    <Loader2
      className={cn("animate-spin", iconClass, colorClass, className)}
      aria-hidden="true"
    />
  );

  // 1. INLINE VARIANT
  if (variant === "inline") {
    return (
      <span
        className={cn("inline-flex items-center gap-2", className)}
        role="status"
        aria-live="polite"
      >
        {spinnerIcon}
        {text && <span className={textClass}>{text}</span>}
      </span>
    );
  }

  // 2. OVERLAY / GLASS VARIANT
  if (variant === "overlay" || variant === "glass") {
    return (
      <div
        className={cn(
          "absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 p-4",
          // Glass effect vs dim effect
          variant === "glass"
            ? "bg-white/40 backdrop-blur-md supports-backdrop-filter:bg-white/20"
            : "bg-black/5 backdrop-blur-[1px]",
          className,
        )}
        role="status"
        aria-live="polite"
      >
        {spinnerIcon}
        {text && (
          <span
            className={cn(
              "font-medium tracking-tight",
              textClass,
              variant === "glass"
                ? "text-foreground/80"
                : "text-muted-foreground",
            )}
          >
            {text}
          </span>
        )}
      </div>
    );
  }

  // 3. FULL PAGE DEFAULT
  return (
    <div
      className={cn(
        "min-h-[50vh] w-full flex flex-col items-center justify-center gap-4",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      {spinnerIcon}
      {text && <p className={cn("text-muted-foreground", textClass)}>{text}</p>}
    </div>
  );
}
