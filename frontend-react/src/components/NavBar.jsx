import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useI18n } from "../providers/I18nProvider";
import { useAuth } from "../providers/AuthProvider";

export default function NavBar() {
  const { t, lang, setLang } = useI18n();
  const { isAuthed, logout } = useAuth();
  const nav = useNavigate();

  const linkStyle = ({ isActive }) => ({
    marginRight: 12,
    fontWeight: isActive ? 700 : 400,
    textDecoration: "none",
  });

  return (
    <div style={{ padding: 12, borderBottom: "1px solid #ddd" }}>
      <NavLink to="/karty" style={linkStyle}>{t("nav_karty")}</NavLink>
      <NavLink to="/ogloszenia" style={linkStyle}>{t("nav_ogloszenia")}</NavLink>
      <NavLink to="/kolekcje" style={linkStyle}>{t("nav_kolekcje")}</NavLink>

      <span style={{ marginLeft: 16 }}>
        <button onClick={() => setLang("pl")} disabled={lang === "pl"}>PL</button>{" "}
        <button onClick={() => setLang("en")} disabled={lang === "en"}>EN</button>
      </span>

      <span style={{ float: "right" }}>
        {!isAuthed ? (
          <NavLink to="/login" style={linkStyle}>{t("nav_login")}</NavLink>
        ) : (
          <button
            onClick={() => {
              logout();
              nav("/login");
            }}
          >
            {t("nav_logout")}
          </button>
        )}
      </span>
    </div>
  );
}