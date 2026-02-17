export function createSettingsScript(settings?: {
  lang: string
  theme: string
  timeZone: string
}) {
  return `
(function () {
  try {
    var settings = ${settings ? JSON.stringify(settings) : 'null'};

    function getCookie(name) {
      return document.cookie
        .split('; ')
        .find(row => row.startsWith(name + '='))
        ?.split('=')[1];
    }

    var lang = settings?.lang || getCookie("lang") || "en";
    var theme = settings?.theme || getCookie("theme") || "system";
    var timeZone = settings?.timeZone || getCookie("tz") || "UTC";

    try {
      Intl.DateTimeFormat(undefined, { timeZone: timeZone });
    } catch {
      timeZone = "UTC";
    }

    window.__APP_SETTINGS__ = Object.freeze({ lang, theme, timeZone });

    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var isDark = theme === "dark" || (theme === "system" && prefersDark);
    document.documentElement.classList.toggle("dark", isDark);
  } catch (e) { console.error("[settingsScript] error:", e); }
})();
`
}
