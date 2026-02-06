// src/components/error/ErrorMessage.tsx
import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { AlertCircle, RotateCcw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorMessageProps {
  title: string;
  message: string;
  onRetry?: () => void; // Optional manual retry handler
  onRouterReset?: () => void; // Optional router reset handler
  showBackButton?: boolean;
  className?: string;
}

export function ErrorMessage({
  title,
  message,
  onRetry,
  onRouterReset,
  showBackButton = true,
  className,
}: ErrorMessageProps) {
  const router = useRouter();
  const [isRetrying, setIsRetrying] = useState(false);

  async function handleRetry() {
    try {
      setIsRetrying(true);

      if (onRouterReset) {
        // ✅ Prefer router reset if provided
        onRouterReset();
      } else if (onRetry) {
        await onRetry();
      } else {
        router.invalidate();
      }
    } finally {
      setIsRetrying(false);
    }
  }

  return (
    <div
      className={cn(
        "w-full max-w-md mx-auto bg-destructive/10 border border-destructive/30 rounded-xl p-6 flex flex-col items-center text-center space-y-4 shadow-sm",
        className
      )}
    >
      <div className="flex items-center justify-center w-12 h-12 bg-destructive/20 rounded-full">
        <AlertCircle className="w-6 h-6 text-destructive" />
      </div>

      <div>
        <h3 className="text-lg font-semibold text-destructive">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1">{message}</p>
      </div>

      <div className="flex flex-wrap justify-center gap-3 pt-2">
        {showBackButton && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.history.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Geri Dön
          </Button>
        )}
        {(onRetry || onRouterReset) && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleRetry}
            disabled={isRetrying}
            className="flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            {isRetrying ? "Tekrar Deneniyor..." : "Tekrar Dene"}
          </Button>
        )}
      </div>
    </div>
  );
}
