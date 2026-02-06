export function createSettingsScript(settings?: {
  lang: string
  theme: string
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

    window.__APP_SETTINGS__ = { lang, theme };

    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var isDark = theme === "dark" || (theme === "system" && prefersDark);
    document.documentElement.classList.toggle("dark", isDark);
  } catch (e) { console.error("[settingsScript] error:", e); }
})();
`
}
