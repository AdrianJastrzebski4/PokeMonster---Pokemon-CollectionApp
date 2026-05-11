import React, { useEffect, useMemo, useState } from "react";
import { apiGet, apiSend } from "../api";
import { useI18n } from "../providers/I18nProvider";

export default function CollectionsPage() {
  const { t } = useI18n();


  const [page, setPage] = useState(1);
  const limit = 5;


  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(false);
  const [listErr, setListErr] = useState("");


  const [users, setUsers] = useState([]);
  const [cards, setCards] = useState([]);


  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsText, setDetailsText] = useState("");


  const [editId, setEditId] = useState("");
  const [uzyId, setUzyId] = useState("");
  const [kartaId, setKartaId] = useState("");
  const [ocena, setOcena] = useState("");
  const [cena, setCena] = useState("");
  const [wyslana, setWyslana] = useState("");
  const [odeslana, setOdeslana] = useState("");

  const [formErr, setFormErr] = useState("");
  const [formOk, setFormOk] = useState("");

  const pageInfoText = useMemo(
    () => t("page_info", meta.page, meta.totalPages, meta.total),
    [t, meta]
  );

  function resetForm() {
    setEditId("");
    setUzyId("");
    setKartaId("");
    setOcena("");
    setCena("");
    setWyslana("");
    setOdeslana("");
    setFormErr("");
    setFormOk("");
  }

  function isValidDateOrEmpty(v) {
    if (!v) return true;
    return /^\d{4}-\d{2}-\d{2}$/.test(v);
  }

  function validateClient() {
    const errors = [];

    const u = Number(uzyId);
    const k = Number(kartaId);
    const o = Number(ocena);

    const cenaRaw = String(cena ?? "").trim();
    const cenaNum = cenaRaw === "" ? null : Number(cenaRaw);

    if (!Number.isInteger(u) || u <= 0) errors.push(t("kol_err_user_id"));
    if (!Number.isInteger(k) || k <= 0) errors.push(t("kol_err_card_id"));
    if (!Number.isInteger(o) || o < 1 || o > 10) errors.push(t("kol_err_grade_range"));

    if (cenaNum !== null) {
      if (!Number.isFinite(cenaNum) || cenaNum < 0) errors.push(t("kol_err_price_nonneg"));
    }

    const w = wyslana.trim();
    const od = odeslana.trim();
    if (!isValidDateOrEmpty(w)) errors.push(t("kol_err_date_sent"));
    if (!isValidDateOrEmpty(od)) errors.push(t("kol_err_date_returned"));
    if (w && od && od < w) errors.push(t("kol_err_date_order"));

    return errors;
  }

  async function loadSelectOptions() {
    const u = await apiGet("/api/uzytkownicy");
    setUsers(Array.isArray(u) ? u : (u.items || []));

    const cData = await apiGet(`/api/karty?page=1&limit=50`);
    setCards(cData.items || []);
  }

  async function loadList(p = page) {
    setLoading(true);
    setListErr("");
    try {
      const data = await apiGet(`/api/kolekcje?page=${p}&limit=${limit}`);
      setItems(data.items || []);
      setMeta({ page: data.page, totalPages: data.totalPages, total: data.total });
    } catch (e) {
      setItems([]);
      setListErr(t("kol_msg_list_fail"));
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function loadDetails(id) {
    setDetailsOpen(true);
    setDetailsText(t("loading"));
    try {
      const data = await apiGet(`/api/kolekcje/${id}`);
      setDetailsText(JSON.stringify(data, null, 2));
    } catch (e) {
      setDetailsText(t("kol_msg_details_fail"));
    }
  }

  async function onEdit(id) {
    setFormErr("");
    setFormOk("");
    try {
      const d = await apiGet(`/api/kolekcje/${id}`);

      setEditId(String(d.id));
      setUzyId(String(d.uzytkownicy_id));
      setKartaId(String(d.karty_id));
      setOcena(String(d.ocena_karty));

      setCena(d.cena === null ? "" : String(d.cena));
      setWyslana(d.wyslana_do_oceny === null ? "" : String(d.wyslana_do_oceny));
      setOdeslana(d.odeslana_z_oceny === null ? "" : String(d.odeslana_z_oceny));

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setFormErr(t("kol_msg_edit_load_fail"));
    }
  }

  async function onDelete(id) {
    if (!confirm(t("kol_confirm_delete", id))) return;
    setFormErr("");
    setFormOk("");
    try {
      await apiSend(`/api/kolekcje/${id}`, "DELETE", {});
      setFormOk(t("kol_msg_deleted"));
      await loadList(page);
    } catch (e) {
      setFormErr(e?.message || t("kol_msg_delete_fail"));
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

    const payload = {
      uzytkownicy_id: Number(uzyId),
      karty_id: Number(kartaId),
      ocena_karty: Number(ocena),
      wyslana_do_oceny: wyslana.trim() === "" ? null : wyslana.trim(),
      odeslana_z_oceny: odeslana.trim() === "" ? null : odeslana.trim(),
      cena: String(cena ?? "").trim() === "" ? null : Number(cena),
    };

    try {
      if (editId) {
        await apiSend(`/api/kolekcje/${editId}`, "PUT", payload);
        setFormOk(t("kol_msg_saved"));
      } else {
        const out = await apiSend("/api/kolekcje", "POST", payload);
        setFormOk(t("kol_msg_added", out.id));
      }
      await loadList(page);
      resetForm();
    } catch (e2) {
      if (e2?.errors?.length) setFormErr(e2.errors.join(" | "));
      else setFormErr(e2?.message || t("kol_err_save"));
    }
  }

  useEffect(() => {
    loadSelectOptions().catch(console.error);
  }, []);

  useEffect(() => {
    loadList(page);
  }, [page]);

  return (
    <>
      <div className="card">
        <h2>{t("title_kolekcje")}</h2>
        <p className="small">{t("kol_desc")}</p>
      </div>

      <div className="card">
        <h3>{t("kol_form_title")}</h3>

        <form onSubmit={onSubmit}>
          <div className="row">
            <div>
              <label>{t("kol_label_user")}</label>
              <br />
              <select value={uzyId} onChange={(e) => setUzyId(e.target.value)}>
                <option value="">{t("kol_opt_user")}</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.imie} {u.nazwisko} (id={u.id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>{t("kol_label_card")}</label>
              <br />
              <select value={kartaId} onChange={(e) => setKartaId(e.target.value)}>
                <option value="">{t("kol_opt_card")}</option>
                {cards.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nazwa_kart} (#{c.numer_kart}) (id={c.id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>{t("kol_label_grade")}</label>
              <br />
              <input
                value={ocena}
                onChange={(e) => setOcena(e.target.value)}
                type="number"
                placeholder="np. 8"
              />
            </div>

            <div>
              <label>{t("kol_label_price")}</label>
              <br />
              <input
                value={cena}
                onChange={(e) => setCena(e.target.value)}
                type="number"
                step="0.01"
                placeholder="np. 49.99"
              />
            </div>
          </div>

          <div className="row" style={{ marginTop: 10 }}>
            <div>
              <label>{t("kol_label_sent")}</label>
              <br />
              <input value={wyslana} onChange={(e) => setWyslana(e.target.value)} placeholder="YYYY-MM-DD" />
            </div>

            <div>
              <label>{t("kol_label_returned")}</label>
              <br />
              <input value={odeslana} onChange={(e) => setOdeslana(e.target.value)} placeholder="YYYY-MM-DD" />
            </div>
          </div>

          <div className="row" style={{ marginTop: 10 }}>
            <button type="submit">{t("btn_save")}</button>
            <button type="button" onClick={resetForm}>
              {t("btn_cancel")}
            </button>
          </div>

          {formErr && <div className="error">{formErr}</div>}
          {formOk && <div className="success">{formOk}</div>}
        </form>
      </div>

      <div className="card">
        <h3>{t("kol_list_title")}</h3>
        <p className="small">{t("kol_details_hint")}</p>

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
              <th>{t("kol_th_user")}</th>
              <th>{t("kol_th_card")}</th>
              <th>{t("kol_th_grade")}</th>
              <th>{t("kol_th_price")}</th>
              <th>{t("kol_th_actions")}</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="small">
                  {t("loading")}
                </td>
              </tr>
            ) : (
              items.map((r) => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>
                    {r.imie} {r.nazwisko} (id={r.uzytkownik_id ?? r.uzytkownicy_id ?? "?"})
                  </td>
                  <td>
                    {r.nazwa_kart} (#{r.numer_kart})
                  </td>
                  <td>{r.ocena_karty}</td>
                  <td>{r.cena === null ? "-" : String(r.cena)}</td>
                  <td>
                    <div className="actions">
                      <button onClick={() => loadDetails(r.id)}>{t("btn_details")}</button>
                      <button onClick={() => onEdit(r.id)}>{t("btn_edit")}</button>
                      <button className="danger" onClick={() => onDelete(r.id)}>
                        {t("btn_delete")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {detailsOpen && (
        <div className="card">
          <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0 }}>{t("kol_details_title")}</h3>
            <button onClick={() => setDetailsOpen(false)}>{t("btn_cancel")}</button>
          </div>
          <pre className="small" style={{ whiteSpace: "pre-wrap" }}>
            {detailsText}
          </pre>
        </div>
      )}
    </>
  );
}
