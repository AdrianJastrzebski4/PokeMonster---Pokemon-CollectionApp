const express = require("express");
const router = express.Router();
const db = require("../db");
const { isInt, isNonEmptyString, isNullableNumber } = require("../validators/common");
const { requireAuth } = require("../middlewares/auth");
const requireRole = require("../middlewares/requireRole");

const ALLOWED_TYP = ["SPRZEDAZ", "WYMIANA"];
const ALLOWED_STATUS = ["AKTYWNE", "ZAMKNIETE"];

function validateBody(body) {
  const errors = [];
  const { typ, cena, status, karty_w_danej_kolekcji_id } = body;

  if (!isNonEmptyString(typ, 3, 20) || !ALLOWED_TYP.includes(typ)) errors.push("typ: SPRZEDAZ lub WYMIANA");
  if (!isNonEmptyString(status, 3, 20) || !ALLOWED_STATUS.includes(status)) errors.push("status: AKTYWNE lub ZAMKNIETE");
  if (!isInt(karty_w_danej_kolekcji_id) || karty_w_danej_kolekcji_id <= 0) errors.push("karty_w_danej_kolekcji_id: INT > 0");
  if (!isNullableNumber(cena) || (cena !== null && cena !== "" && Number(cena) < 0)) errors.push("cena: >= 0 lub null");

  return errors;
}

router.get("/", async (req, res) => {
  const page = Math.max(parseInt(req.query.page || "1", 10), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit || "10", 10), 1), 50);
  const offset = (page - 1) * limit;

  const [[{ total }]] = await db.query("SELECT COUNT(*) AS total FROM ogloszenie");

  const [items] = await db.query(
    `SELECT o.id, o.typ, o.cena, o.status,
            k.nazwa_kart, k.numer_kart,
            u.imie, u.nazwisko
     FROM ogloszenie o
     JOIN karty_w_danej_kolekcji kw ON kw.id = o.karty_w_danej_kolekcji_id
     JOIN karty k ON k.id = kw.karty_id
     JOIN uzytkownicy u ON u.id = kw.uzytkownicy_id
     ORDER BY o.id DESC
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
    `SELECT o.*,
            kw.ocena_karty, kw.cena AS cena_karty_w_kolekcji,
            k.nazwa_kart, k.numer_kart,
            u.id AS uzytkownik_id, u.imie, u.nazwisko, u.email
     FROM ogloszenie o
     JOIN karty_w_danej_kolekcji kw ON kw.id = o.karty_w_danej_kolekcji_id
     JOIN karty k ON k.id = kw.karty_id
     JOIN uzytkownicy u ON u.id = kw.uzytkownicy_id
     WHERE o.id = ?`,
    [id]
  );
  if (rows.length === 0) return res.status(404).json({ error: "Nie znaleziono" });

  res.json(rows[0]);
});

router.post("/", requireAuth, requireRole("USER", "ADMIN"), async (req, res) => {
  const errors = validateBody(req.body);
  if (errors.length) return res.status(400).json({ errors });

  const { typ, cena, status, karty_w_danej_kolekcji_id } = req.body;

  try {
    const [rows] = await db.query(
      "SELECT uzytkownicy_id FROM karty_w_danej_kolekcji WHERE id = ?",
      [karty_w_danej_kolekcji_id]
    );

    if (!rows.length) {
      return res.status(400).json({ error: "Nie istnieje taki wpis kolekcji" });
    }

    if (req.user.role === "USER" && rows[0].uzytkownicy_id !== req.user.id) {
      return res.status(403).json({ error: "Brak uprawnień" });
    }

    const [result] = await db.query(
      "INSERT INTO ogloszenie (typ, cena, status, karty_w_danej_kolekcji_id) VALUES (?, ?, ?, ?)",
      [
        typ,
        cena === "" || cena === undefined ? null : cena,
        status,
        karty_w_danej_kolekcji_id
      ]
    );

    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(400).json({ error: err.code, message: err.message });
  }
});

router.put("/:id", requireAuth, requireRole("USER", "ADMIN"), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: "Niepoprawne id" });

  const errors = validateBody(req.body);
  if (errors.length) return res.status(400).json({ errors });

  const [rows] = await db.query(
    `SELECT kwdk.uzytkownicy_id
     FROM ogloszenie o
     JOIN karty_w_danej_kolekcji kwdk ON kwdk.id = o.karty_w_danej_kolekcji_id
     WHERE o.id = ?`,
    [id]
  );

  if (!rows.length) return res.status(404).json({ error: "Nie znaleziono" });

  if (req.user.role === "USER" && rows[0].uzytkownicy_id !== req.user.id) {
    return res.status(403).json({ error: "Brak uprawnień" });
  }

  const { typ, cena, status, karty_w_danej_kolekcji_id } = req.body;

  const [result] = await db.query(
    `UPDATE ogloszenie
     SET typ = ?, cena = ?, status = ?, karty_w_danej_kolekcji_id = ?
     WHERE id = ?`,
    [
      typ,
      cena === "" || cena === undefined ? null : cena,
      status,
      karty_w_danej_kolekcji_id,
      id
    ]
  );

  if (result.affectedRows === 0) return res.status(404).json({ error: "Nie znaleziono" });
  res.json({ ok: true });
});

router.delete("/:id", requireAuth, requireRole("USER", "ADMIN"), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: "Niepoprawne id" });

  const [rows] = await db.query(
    `SELECT kwdk.uzytkownicy_id
     FROM ogloszenie o
     JOIN karty_w_danej_kolekcji kwdk ON kwdk.id = o.karty_w_danej_kolekcji_id
     WHERE o.id = ?`,
    [id]
  );

  if (!rows.length) return res.status(404).json({ error: "Nie znaleziono" });

  if (req.user.role === "USER" && rows[0].uzytkownicy_id !== req.user.id) {
    return res.status(403).json({ error: "Brak uprawnień" });
  }

  const [result] = await db.query("DELETE FROM ogloszenie WHERE id = ?", [id]);
  if (result.affectedRows === 0) return res.status(404).json({ error: "Nie znaleziono" });

  res.json({ ok: true });
});

module.exports = router;