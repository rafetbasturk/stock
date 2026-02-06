import { getUserLang } from "./getUserLang";
import { authMessages } from "./messages/auth";

export function getAuthSessionExpiredText() {
  const lang = getUserLang();

  return {
    title: authMessages.sessionExpiredTitle[lang],
    description: authMessages.sessionExpiredDescription[lang],
  };
}
