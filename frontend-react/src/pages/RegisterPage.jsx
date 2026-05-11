import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiSend } from "../api";
import { useI18n } from "../providers/I18nProvider";

export default function RegisterPage() {
  const { t } = useI18n();
  const nav = useNavigate();

  const [imie, setImie] = useState("");
  const [nazwisko, setNazwisko] = useState("");
  const [email, setEmail] = useState("");
  const [haslo, setHaslo] = useState("");
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setMsg("");
    setOk("");

    const errors = [];
    if (imie.trim().length < 2) errors.push(t("reg_err_first"));
    if (nazwisko.trim().length < 2) errors.push(t("reg_err_last"));
    if (!email.includes("@")) errors.push(t("reg_err_email"));
    if (haslo.length < 6) errors.push(t("reg_err_pass"));
    if (errors.length) {
      setMsg(errors.join(" "));
      return;
    }

    try {
      await apiSend("/api/auth/register", "POST", { imie: imie.trim(), nazwisko: nazwisko.trim(), email: email.trim(), haslo });
      setOk(t("reg_ok_created"));
      setTimeout(() => nav("/login"), 700);
    } catch (e2) {
      setMsg(e2?.error || (e2?.errors ? e2.errors.join(" ") : t("reg_err_generic")));
    }
  }

  return (
    <div className="card">
      <h2>{t("reg_title")}</h2>

      <form onSubmit={onSubmit}>
        <div className="row">
          <div><label>{t("reg_label_first")}</label><br/><input value={imie} onChange={(e)=>setImie(e.target.value)} /></div>
          <div><label>{t("reg_label_last")}</label><br/><input value={nazwisko} onChange={(e)=>setNazwisko(e.target.value)} /></div>
        </div>

        <div className="row" style={{ marginTop: 10 }}>
          <div><label>{t("reg_label_email")}</label><br/><input value={email} onChange={(e)=>setEmail(e.target.value)} /></div>
          <div><label>{t("reg_label_pass")}</label><br/><input value={haslo} onChange={(e)=>setHaslo(e.target.value)} type="password" /></div>
        </div>

        <div className="row" style={{ marginTop: 10 }}>
          <button type="submit">{t("reg_btn_create")}</button>
          <Link to="/login" style={{ alignSelf: "center" }}>{t("reg_btn_back")}</Link>
        </div>

        {msg && <div className="error">{msg}</div>}
        {ok && <div className="success">{ok}</div>}
      </form>
    </div>
  );
}