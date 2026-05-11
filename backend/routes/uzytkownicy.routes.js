const express = require("express");
const router = express.Router();
const db = require("../db");
const { isInt, isNonEmptyString } = require("../validators/common");
const { requireAuth } = require("../middlewares/auth");

function isEmail(v) {
  return typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

router.get("/", async (req, res) => {
  const [rows] = await db.query(
    "SELECT id, imie, nazwisko, email, rola_id FROM uzytkownicy ORDER BY id DESC"
  );
  res.json(rows);
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!isInt(id)) return res.status(400).json({ error: "Niepoprawne id" });

  const [rows] = await db.query(
    `SELECT u.*, r.nazwa AS rola_nazwa
     FROM uzytkownicy u
     JOIN rola r ON r.id = u.rola_id
     WHERE u.id = ?`,
    [id]
  );
  if (rows.length === 0) return res.status(404).json({ error: "Nie znaleziono" });

  res.json(rows[0]);
});

router.post("/", requireAuth, async (req, res) => {
  const { imie, nazwisko, email, haslo, rola_id } = req.body;

  const errors = [];
  if (!isNonEmptyString(imie, 2, 20)) errors.push("imie: 2-20");
  if (!isNonEmptyString(nazwisko, 2, 20)) errors.push("nazwisko: 2-20");
  if (!isEmail(email)) errors.push("email: niepoprawny");
  if (!isNonEmptyString(haslo, 3, 255)) errors.push("haslo: min 3");
  if (!isInt(rola_id) || rola_id <= 0) errors.push("rola_id: INT > 0");

  if (errors.length) return res.status(400).json({ errors });

  try {
    const [result] = await db.query(
      "INSERT INTO uzytkownicy (imie, nazwisko, email, haslo, rola_id) VALUES (?, ?, ?, ?, ?)",
      [imie.trim(), nazwisko.trim(), email.trim(), haslo, rola_id]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(400).json({ error: err.code, message: err.message });
  }
});

router.put("/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const { imie, nazwisko, email, haslo, rola_id } = req.body;

  const errors = [];
  if (!isInt(id)) errors.push("id: niepoprawne");
  if (!isNonEmptyString(imie, 2, 20)) errors.push("imie: 2-20");
  if (!isNonEmptyString(nazwisko, 2, 20)) errors.push("nazwisko: 2-20");
  if (!isEmail(email)) errors.push("email: niepoprawny");
  if (!isNonEmptyString(haslo, 3, 255)) errors.push("haslo: min 3");
  if (!isInt(rola_id) || rola_id <= 0) errors.push("rola_id: INT > 0");

  if (errors.length) return res.status(400).json({ errors });

  const [result] = await db.query(
    "UPDATE uzytkownicy SET imie=?, nazwisko=?, email=?, haslo=?, rola_id=? WHERE id=?",
    [imie.trim(), nazwisko.trim(), email.trim(), haslo, rola_id, id]
  );

  if (result.affectedRows === 0) return res.status(404).json({ error: "Nie znaleziono" });
  res.json({ ok: true });
});

router.delete("/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!isInt(id)) return res.status(400).json({ error: "Niepoprawne id" });

  try {
    const [result] = await db.query("DELETE FROM uzytkownicy WHERE id = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Nie znaleziono" });
    res.json({ ok: true });
  } catch (err) {
    res.status(409).json({ error: err.code, message: err.message });
  }
});

module.exports = router;