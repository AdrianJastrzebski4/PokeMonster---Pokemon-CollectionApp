import React, { useEffect, useMemo, useState } from "react";
import { apiGet, apiSend } from "../api";
import { useI18n } from "../providers/I18nProvider";

export default function AdsPage() {
  const { t } = useI18n();

  const [page, setPage] = useState(1);
  const limit = 5;

  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(false);
  const [listErr, setListErr] = useState("");

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsText, setDetailsText] = useState("");

  const [kwdkOptions, setKwdkOptions] = useState([]);

  const [editId, setEditId] = useState("");
  const [typ, setTyp] = useState("SPRZEDAZ");
  const [status, setStatus] = useState("AKTYWNE");
  const [cena, setCena] = useState(""); 
  const [kwdkId, setKwdkId] = useState("");

  const [formErr, setFormErr] = useState("");
  const [formOk, setFormOk] = useState("");

  const pageInfoText = useMemo(
    () => t("page_info", meta.page, meta.totalPages, meta.total),
    [t, meta]
  );

  function resetForm() {
    setEditId("");
    setTyp("SPRZEDAZ");
    setStatus("AKTYWNE");
    setCena("");
    setKwdkId("");
    setFormErr("");
    setFormOk("");
  }

  function validateClient() {
    const errors = [];

    if (!["SPRZEDAZ", "WYMIANA"].includes(typ)) errors.push(t("og_err_type"));
    if (!["AKTYWNE", "ZAMKNIETE"].includes(status)) errors.push(t("og_err_status"));

    const kwdk = Number(kwdkId);
    if (!Number.isInteger(kwdk) || kwdk <= 0) errors.push(t("og_err_kwdk"));

    const cenaRaw = String(cena ?? "").trim();
    const cenaNum = cenaRaw === "" ? null : Number(cenaRaw);

    if (cenaNum !== null) {
      if (!Number.isFinite(cenaNum) || cenaNum < 0) errors.push(t("og_err_price_nonneg"));
    }
    if (typ === "SPRZEDAZ" && (cenaNum === null || cenaRaw === "")) errors.push(t("og_err_price_required"));

    return errors;
  }

  async function loadKwdkOptions() {
    const data = await apiGet(`/api/kolekcje?page=1&limit=100`);
    const list = Array.isArray(data) ? data : (data.items || []);
    setKwdkOptions(list);
  }

  async function loadList(p = page) {
    setLoading(true);
    setListErr("");
    try {
      const data = await apiGet(`/api/ogloszenia?page=${p}&limit=${limit}`);
      setItems(data.items || []);
      setMeta({ page: data.page, totalPages: data.totalPages, total: data.total });
    } catch (e) {
      setItems([]);
      setListErr(t("og_msg_list_fail"));
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function loadDetails(id) {
    setDetailsOpen(true);
    setDetailsText(t("loading"));
    try {
      const data = await apiGet(`/api/ogloszenia/${id}`);
      setDetailsText(JSON.stringify(data, null, 2));
    } catch (e) {
      setDetailsText(t("og_msg_details_fail"));
    }
  }

  async function onEdit(id) {
    setFormErr("");
    setFormOk("");
    try {
      const o = await apiGet(`/api/ogloszenia/${id}`);
      setEditId(String(o.id));
      setTyp(o.typ);
      setStatus(o.status);
      setCena(o.cena === null ? "" : String(o.cena));
      setKwdkId(String(o.karty_w_danej_kolekcji_id));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setFormErr(t("og_msg_edit_load_fail"));
    }
  }

  async function onDelete(id) {
    if (!confirm(t("og_confirm_delete", id))) return;
    setFormErr("");
    setFormOk("");
    try {
      await apiSend(`/api/ogloszenia/${id}`, "DELETE", {});
      setFormOk(t("og_msg_deleted"));
      await loadList(page);
    } catch (e) {
      setFormErr(e?.message || t("og_msg_delete_fail"));
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

    const cenaRaw = String(cena ?? "").trim();
    const payload = {
      typ,
      status,
      cena: cenaRaw === "" ? null : Number(cenaRaw),
      karty_w_danej_kolekcji_id: Number(kwdkId),
    };

    try {
      if (editId) {
        await apiSend(`/api/ogloszenia/${editId}`, "PUT", payload);
        setFormOk(t("og_msg_saved"));
      } else {
        const out = await apiSend("/api/ogloszenia", "POST", payload);
        setFormOk(t("og_msg_added", out.id));
      }
      await loadList(page);
      resetForm();
    } catch (e2) {
      if (e2?.errors?.length) setFormErr(e2.errors.join(" | "));
      else setFormErr(e2?.message || t("og_err_save"));
    }
  }

  useEffect(() => {
    loadKwdkOptions().catch(console.error);
  }, []);

  useEffect(() => {
    loadList(page);
  }, [page]);

  return (
    <>
      <div className="card">
        <h2>{t("title_ogloszenia")}</h2>
        <p className="small">{t("og_desc")}</p>
      </div>

      <div className="card">
        <h3>{t("og_form_title")}</h3>

        <form onSubmit={onSubmit}>
          <div className="row">
            <div>
              <label>{t("og_label_type")}</label>
              <br />
              <select value={typ} onChange={(e) => setTyp(e.target.value)}>
                <option value="SPRZEDAZ">SPRZEDAZ</option>
                <option value="WYMIANA">WYMIANA</option>
              </select>
            </div>

            <div>
              <label>{t("og_label_status")}</label>
              <br />
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="AKTYWNE">AKTYWNE</option>
                <option value="ZAMKNIETE">ZAMKNIETE</option>
              </select>
            </div>

            <div>
              <label>{t("og_label_price")}</label>
              <br />
              <input
                value={cena}
                onChange={(e) => setCena(e.target.value)}
                type="number"
                step="0.01"
                placeholder="np. 55.00"
              />
            </div>

            <div>
              <label>{t("og_label_kwdk")}</label>
              <br />
              <select value={kwdkId} onChange={(e) => setKwdkId(e.target.value)}>
                <option value="">{t("og_kwdk_pick") || "-- wybierz kartę z kolekcji --"}</option>
                {kwdkOptions.map((x) => (
                  <option key={x.id} value={x.id}>
                    wpis#{x.id} | user:{x.uzytkownicy_id} | karta:{x.karty_id}
                  </option>
                ))}
              </select>
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
        <h3>{t("og_list_title")}</h3>
        <p className="small">{t("og_hint_details")}</p>

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
              <th>{t("og_th_type")}</th>
              <th>{t("og_th_price")}</th>
              <th>{t("og_th_status")}</th>
              <th>{t("og_th_card")}</th>
              <th>{t("og_th_owner")}</th>
              <th>{t("og_th_actions")}</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="small">
                  {t("loading")}
                </td>
              </tr>
            ) : (
              items.map((r) => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.typ}</td>
                  <td>{r.cena === null ? "-" : String(r.cena)}</td>
                  <td>{r.status}</td>
                  <td>
                    {r.nazwa_kart} (#{r.numer_kart})
                  </td>
                  <td>
                    {r.imie} {r.nazwisko}
                  </td>
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
            <h3 style={{ margin: 0 }}>{t("og_details_title")}</h3>
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
