const express = require("express");
const router = express.Router();
const db = require("../db");
const { isInt, isNonEmptyString } = require("../validators/common");
const { requireAuth } = require("../middlewares/auth");
const requireRole = require("../middlewares/requireRole");

router.get("/", async (req, res) => {
  const page = Math.max(parseInt(req.query.page || "1", 10), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit || "10", 10), 1), 50);
  const offset = (page - 1) * limit;

  const [[{ total }]] = await db.query("SELECT COUNT(*) AS total FROM karty");

  const [items] = await db.query(
    "SELECT id, nazwa_kart, numer_kart FROM karty ORDER BY id DESC LIMIT ? OFFSET ?",
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

  const [rows] = await db.query("SELECT * FROM karty WHERE id = ?", [id]);
  if (rows.length === 0) return res.status(404).json({ error: "Nie znaleziono" });

  res.json(rows[0]);
});

router.post("/", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const { nazwa_kart, numer_kart } = req.body;

  const errors = [];
  if (!isNonEmptyString(nazwa_kart, 2, 60)) errors.push("nazwa_kart: 2-60 znaków");
  if (!isInt(numer_kart) || numer_kart <= 0) errors.push("numer_kart: liczba całkowita > 0");

  if (errors.length) return res.status(400).json({ errors });

  try {
    const [result] = await db.query(
      "INSERT INTO karty (nazwa_kart, numer_kart) VALUES (?, ?)",
      [nazwa_kart.trim(), numer_kart]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(400).json({ error: err.code, message: err.message });
  }
});

router.put("/:id", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const id = Number(req.params.id);
  const { nazwa_kart, numer_kart } = req.body;

  const errors = [];
  if (!isInt(id)) errors.push("id: niepoprawne");
  if (!isNonEmptyString(nazwa_kart, 2, 60)) errors.push("nazwa_kart: 2-60 znaków");
  if (!isInt(numer_kart) || numer_kart <= 0) errors.push("numer_kart: liczba całkowita > 0");

  if (errors.length) return res.status(400).json({ errors });

  const [result] = await db.query(
    "UPDATE karty SET nazwa_kart = ?, numer_kart = ? WHERE id = ?",
    [nazwa_kart.trim(), numer_kart, id]
  );
  if (result.affectedRows === 0) return res.status(404).json({ error: "Nie znaleziono" });

  res.json({ ok: true });
});

router.delete("/:id", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const id = Number(req.params.id);
  if (!isInt(id)) return res.status(400).json({ error: "Niepoprawne id" });

  try {
    const [result] = await db.query("DELETE FROM karty WHERE id = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Nie znaleziono" });
    res.json({ ok: true });
  } catch (err) {
    
    res.status(409).json({ error: err.code, message: err.message });
  }
});

module.exports = router;