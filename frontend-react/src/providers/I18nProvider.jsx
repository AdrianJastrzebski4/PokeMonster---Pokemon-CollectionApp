import React, { createContext, useContext, useMemo, useState } from "react";
import { translations } from "../i18n";

const I18nCtx = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(localStorage.getItem("lang") || "pl");

  const setLang = (l) => {
    setLangState(l);
    localStorage.setItem("lang", l);
  };

  const t = (key, ...args) => {
    const value = translations?.[lang]?.[key];
    if (typeof value === "function") return value(...args);
    return value ?? key;
  };

  const value = useMemo(() => ({ lang, setLang, t }), [lang]);

  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nCtx);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}