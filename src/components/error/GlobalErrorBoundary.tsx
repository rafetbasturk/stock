// src/components/error/GlobalErrorBoundary.tsx
import * as React from "react";
import { AppError } from "@/lib/error/core/AppError";
import { handleAppError } from "@/lib/error/core/errorHandler";

export class GlobalErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: unknown }
> {
  state = { error: null };

  static getDerivedStateFromError(error: unknown) {
    return { error };
  }

  componentDidCatch(error: unknown) {
    handleAppError(error);
  }

  render() {
    if (!this.state.error) return this.props.children;

    const err = AppError.from(this.state.error);

    return (
      <div className="min-h-svh flex flex-col items-center justify-center p-6">
        <h1 className="text-lg font-semibold mb-2">
          Beklenmeyen Bir Hata Oluştu
        </h1>
        <p className="text-muted-foreground mb-4">{err.message}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground"
        >
          Sayfayı Yenile
        </button>
      </div>
    );
  }
}
