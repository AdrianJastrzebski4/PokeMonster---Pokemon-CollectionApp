import React, { useEffect, useMemo, useState } from "react";
import { apiGet, apiSend } from "../api";
import { useI18n } from "../providers/I18nProvider";

export default function CardsPage() {
  const { t } = useI18n();

  const [page, setPage] = useState(1);
  const limit = 5;

  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });

  const [loading, setLoading] = useState(false);
  const [listErr, setListErr] = useState("");

  const [editId, setEditId] = useState("");
  const [nazwa, setNazwa] = useState("");
  const [numer, setNumer] = useState("");

  const [formErr, setFormErr] = useState("");
  const [formOk, setFormOk] = useState("");

  const pageInfoText = useMemo(
    () => t("page_info", meta.page, meta.totalPages, meta.total),
    [t, meta]
  );

  async function loadList(p = page) {
    setLoading(true);
    setListErr("");
    try {
      const data = await apiGet(`/api/karty?page=${p}&limit=${limit}`);
      setItems(data.items || []);
      setMeta({ page: data.page, totalPages: data.totalPages, total: data.total });
    } catch (e) {
      setItems([]);
      setListErr(t("karty_msg_list_fail"));
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadList(page);
  }, [page]);

  function resetForm() {
    setEditId("");
    setNazwa("");
    setNumer("");
    setFormErr("");
    setFormOk("");
  }

  function validateClient() {
    const errors = [];
    const n = nazwa.trim();
    const num = Number(numer);

    if (n.length < 2 || n.length > 60) errors.push(t("karty_err_name_len"));
    if (!Number.isInteger(num) || num <= 0) errors.push(t("karty_err_number"));
    return errors;
  }

  async function onEdit(id) {
    setFormErr("");
    setFormOk("");
    try {
      const card = await apiGet(`/api/karty/${id}`);
      setEditId(String(card.id));
      setNazwa(card.nazwa_kart ?? "");
      setNumer(card.numer_kart ?? "");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setFormErr(t("karty_msg_details_fail"));
    }
  }

  async function onDelete(id) {
    if (!confirm(t("karty_confirm_delete", id))) return;
    setFormErr("");
    setFormOk("");
    try {
      await apiSend(`/api/karty/${id}`, "DELETE", {});
      setFormOk(t("karty_msg_deleted"));
      await loadList(page);
    } catch (e) {
      const msg = e?.message || t("karty_err_delete_fk");
      setFormErr(msg);
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    setFormErr("");
    setFormOk("");

    const errs = validateClient();
    if (errs.length) {
      setFormErr(errs.join(" "));
      return;
    }

    const payload = { nazwa_kart: nazwa.trim(), numer_kart: Number(numer) };

    try {
      if (editId) {
        await apiSend(`/api/karty/${editId}`, "PUT", payload);
        setFormOk(t("karty_msg_saved"));
      } else {
        const out = await apiSend("/api/karty", "POST", payload);
        setFormOk(t("karty_msg_added", out.id));
      }
      await loadList(page);
      resetForm();
    } catch (e2) {
      if (e2?.errors?.length) setFormErr(e2.errors.join(" | "));
      else setFormErr(e2?.message || t("karty_err_save"));
    }
  }

  return (
    <>
      <div className="card">
        <h2>{t("title_karty")}</h2>
        <p className="small">{t("karty_desc")}</p>
      </div>

      <div className="card">
        <h3>{t("karty_form_title")}</h3>

        <form onSubmit={onSubmit}>
          <div className="row">
            <div>
              <label>{t("karty_label_name")}</label>
              <br />
              <input value={nazwa} onChange={(e) => setNazwa(e.target.value)} placeholder="np. Pikachu" />
            </div>
            <div>
              <label>{t("karty_label_number")}</label>
              <br />
              <input value={numer} onChange={(e) => setNumer(e.target.value)} type="number" placeholder="np. 25" />
            </div>
          </div>

          <div className="row" style={{ marginTop: 10 }}>
            <button type="submit">{t("btn_save")}</button>
            <button type="button" onClick={resetForm}>{t("btn_cancel")}</button>
          </div>

          {formErr && <div className="error">{formErr}</div>}
          {formOk && <div className="success">{formOk}</div>}
        </form>
      </div>

      <div className="card">
        <h3>{t("karty_list_title")}</h3>

        <div className="row" style={{ margin: "10px 0" }}>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={meta.page <= 1}>
            {t("btn_prev")}
          </button>
          <div className="small">{pageInfoText}</div>
          <button onClick={() => setPage((p) => p + 1)} disabled={meta.page >= meta.totalPages}>
            {t("btn_next")}
          </button>
        </div>

        {listErr && <div className="error">{listErr}</div>}

        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>{t("karty_th_name")}</th>
              <th>{t("karty_th_number")}</th>
              <th>{t("karty_th_actions")}</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="small">{t("loading")}</td></tr>
            ) : (
              items.map((r) => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.nazwa_kart}</td>
                  <td>{r.numer_kart}</td>
                  <td>
                    <div className="actions">
                      <button onClick={() => onEdit(r.id)}>{t("btn_edit")}</button>
                      <button className="danger" onClick={() => onDelete(r.id)}>{t("btn_delete")}</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}