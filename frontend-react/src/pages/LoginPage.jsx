import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiSend } from "../api";
import { useI18n } from "../providers/I18nProvider";
import { useAuth } from "../providers/AuthProvider";

export default function LoginPage() {
  const { t } = useI18n();
  const { login } = useAuth();
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [haslo, setHaslo] = useState("");
  const [msg, setMsg] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setMsg("");

    if (!email.trim() || !haslo) {
      setMsg(t("login_err_fill"));
      return;
    }

    try {
      const out = await apiSend("/api/auth/login", "POST", { email: email.trim(), haslo });
      login(out.token);
      nav("/karty");
    } catch (e2) {
      setMsg(e2?.error || (e2?.errors ? e2.errors.join(" ") : t("login_err_generic")));
    }
  }

  return (
    <div className="card">
      <h2>{t("login_title")}</h2>

      <form onSubmit={onSubmit}>
        <div className="row">
          <div>
            <label>{t("login_label_email")}</label><br/>
            <input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="np. jan@example.com" />
          </div>
          <div>
            <label>{t("login_label_pass")}</label><br/>
            <input value={haslo} onChange={(e)=>setHaslo(e.target.value)} type="password" />
          </div>
        </div>

        <div className="row" style={{ marginTop: 10 }}>
          <button type="submit">{t("login_btn")}</button>
          <Link to="/register" style={{ alignSelf: "center" }}>{t("login_btn_register")}</Link>
        </div>

        {msg && <div className="error">{msg}</div>}
      </form>
    </div>
  );
}