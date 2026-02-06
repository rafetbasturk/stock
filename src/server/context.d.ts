// src/server/context.d.ts
import type { AppSettings } from "@/lib/types/types.settings";

declare module "@tanstack/react-start" {
  interface Register {
    server: {
      requestContext: {
        settings: AppSettings;
      };
    };
  }
}
