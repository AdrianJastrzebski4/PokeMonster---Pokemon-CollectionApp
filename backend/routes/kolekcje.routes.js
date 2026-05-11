const express = require("express");
const router = express.Router();
const db = require("../db");
const { isInt, isNullableDate, isNullableNumber } = require("../validators/common");
const { requireAuth } = require("../middlewares/auth");
const requireRole = require("../middlewares/requireRole");

function validateBody(body) {
  const errors = [];
  const { uzytkownicy_id, karty_id, ocena_karty, wyslana_do_oceny, odeslana_z_oceny, cena } = body;

  if (!isInt(uzytkownicy_id) || uzytkownicy_id <= 0) errors.push("uzytkownicy_id: INT > 0");
  if (!isInt(karty_id) || karty_id <= 0) errors.push("karty_id: INT > 0");
  if (!isInt(ocena_karty) || ocena_karty < 1 || ocena_karty > 10) errors.push("ocena_karty: 1-10");

  if (!isNullableDate(wyslana_do_oceny)) errors.push("wyslana_do_oceny: YYYY-MM-DD lub null");
  if (!isNullableDate(odeslana_z_oceny)) errors.push("odeslana_z_oceny: YYYY-MM-DD lub null");
  if (!isNullableNumber(cena) || (cena !== null && cena !== "" && Number(cena) < 0)) errors.push("cena: >= 0 lub null");

  return errors;
}

router.get("/", async (req, res) => {
  const page = Math.max(parseInt(req.query.page || "1", 10), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit || "10", 10), 1), 50);
  const offset = (page - 1) * limit;

  const [[{ total }]] = await db.query("SELECT COUNT(*) AS total FROM karty_w_danej_kolekcji");

  const [items] = await db.query(
    `SELECT kw.id,
            kw.uzytkownicy_id,
            kw.karty_id,
            kw.ocena_karty,
            kw.cena,
            u.imie, u.nazwisko,
            k.nazwa_kart, k.numer_kart
     FROM karty_w_danej_kolekcji kw
     JOIN uzytkownicy u ON u.id = kw.uzytkownicy_id
     JOIN karty k ON k.id = kw.karty_id
     ORDER BY kw.id DESC
     LIMIT ? OFFSET ?`,
    [limit, offset]
  );

  res.json({
    items,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit)
  });
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!isInt(id)) return res.status(400).json({ error: "Niepoprawne id" });

  const [rows] = await db.query(
    `SELECT kw.*,
            u.imie, u.nazwisko, u.email,
            k.nazwa_kart, k.numer_kart
     FROM karty_w_danej_kolekcji kw
     JOIN uzytkownicy u ON u.id = kw.uzytkownicy_id
     JOIN karty k ON k.id = kw.karty_id
     WHERE kw.id = ?`,
    [id]
  );
  if (rows.length === 0) return res.status(404).json({ error: "Nie znaleziono" });

  const [listings] = await db.query(
    "SELECT id, typ, cena, status FROM ogloszenie WHERE karty_w_danej_kolekcji_id = ? ORDER BY id DESC",
    [id]
  );

  res.json({ ...rows[0], ogloszenia: listings });
});

router.post("/", requireAuth, requireRole("USER", "ADMIN"), async (req, res) => {
  const errors = validateBody(req.body);
  if (errors.length) return res.status(400).json({ errors });

  let { uzytkownicy_id, karty_id, ocena_karty, wyslana_do_oceny, odeslana_z_oceny, cena } = req.body;

  if (req.user.role === "USER") {
    uzytkownicy_id = req.user.id; 
  } else {
    uzytkownicy_id = Number(uzytkownicy_id);
    if (!isInt(uzytkownicy_id)) return res.status(400).json({ error: "Niepoprawne uzytkownicy_id" });
  }

  const [result] = await db.query(
    `INSERT INTO karty_w_danej_kolekcji
     (uzytkownicy_id, karty_id, ocena_karty, wyslana_do_oceny, odeslana_z_oceny, cena)
     VALUES (?,?,?,?,?,?)`,
    [
      uzytkownicy_id,
      karty_id,
      ocena_karty,
      wyslana_do_oceny || null,
      odeslana_z_oceny || null,
      cena === "" || cena === undefined ? null : cena
    ]
  );

  res.status(201).json({ id: result.insertId });
});

router.put(
  "/:id",
  requireAuth,
  requireRole("USER", "ADMIN"),
  async (req, res) => {

    const id = Number(req.params.id);
    if (!isInt(id)) {
      return res.status(400).json({ error: "Niepoprawne id" });
    }

    const errors = validateBody(req.body);
    if (errors.length) {
      return res.status(400).json({ errors });
    }

    const [rows] = await db.query(
      "SELECT uzytkownicy_id FROM karty_w_danej_kolekcji WHERE id = ?",
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Nie znaleziono" });
    }
    if (req.user.role === "USER" && rows[0].uzytkownicy_id !== req.user.id) {
      return res.status(403).json({
        error: "Nie możesz edytować cudzych danych"
      });
    }
    const {
      uzytkownicy_id,
      karty_id,
      ocena_karty,
      wyslana_do_oceny,
      odeslana_z_oceny,
      cena
    } = req.body;

    const [result] = await db.query(
      `UPDATE karty_w_danej_kolekcji
       SET uzytkownicy_id = ?,
           karty_id = ?,
           ocena_karty = ?,
           wyslana_do_oceny = ?,
           odeslana_z_oceny = ?,
           cena = ?
       WHERE id = ?`,
      [
        uzytkownicy_id,
        karty_id,
        ocena_karty,
        wyslana_do_oceny || null,
        odeslana_z_oceny || null,
        cena === "" || cena === undefined ? null : cena,
        id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Nie znaleziono" });
    }

    res.json({ ok: true });
  }
);

router.delete(
  "/:id",
  requireAuth,
  requireRole("USER", "ADMIN"),
  async (req, res) => {

    const id = Number(req.params.id);
    if (!isInt(id)) {
      return res.status(400).json({ error: "Niepoprawne id" });
    }
    const [rows] = await db.query(
      "SELECT uzytkownicy_id FROM karty_w_danej_kolekcji WHERE id = ?",
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Nie znaleziono" });
    }
    if (req.user.role === "USER" && rows[0].uzytkownicy_id !== req.user.id) {
      return res.status(403).json({
        error: "Nie możesz usunąć cudzych danych"
      });
    }
    
    const [result] = await db.query(
      "DELETE FROM karty_w_danej_kolekcji WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Nie znaleziono" });
    }

    res.json({ ok: true });
  }
);

module.exports = router;