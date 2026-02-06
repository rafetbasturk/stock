export type Theme = "light" | "dark" | "system";

export type Language = "en" | "tr";

declare global {
  interface Window {
    __APP_SETTINGS__?: {
      lang: Language;
      theme: Theme;
    };
  }
}

export interface AppSettings {
  lang: Language;
  theme: Theme;
}
