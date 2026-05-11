const express = require("express");
const router = express.Router();
const db = require("../db");
const { isInt, isNonEmptyString } = require("../validators/common");
const { requireAuth } = require("../middlewares/auth");

router.get("/", async (req, res) => {
  const [rows] = await db.query("SELECT id, nazwa FROM rola ORDER BY id ASC");
  res.json(rows);
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!isInt(id)) return res.status(400).json({ error: "Niepoprawne id" });

  const [rows] = await db.query("SELECT * FROM rola WHERE id = ?", [id]);
  if (rows.length === 0) return res.status(404).json({ error: "Nie znaleziono" });

  res.json(rows[0]);
});

router.post("/", requireAuth, async (req, res) => {
  const { nazwa } = req.body;
  const errors = [];
  if (!isNonEmptyString(nazwa, 2, 20)) errors.push("nazwa: 2-20 znaków");
  if (errors.length) return res.status(400).json({ errors });

  try {
    const [result] = await db.query("INSERT INTO rola (nazwa) VALUES (?)", [nazwa.trim()]);
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(400).json({ error: err.code, message: err.message });
  }
});

router.put("/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const { nazwa } = req.body;

  const errors = [];
  if (!isInt(id)) errors.push("id: niepoprawne");
  if (!isNonEmptyString(nazwa, 2, 20)) errors.push("nazwa: 2-20");
  if (errors.length) return res.status(400).json({ errors });

  const [result] = await db.query("UPDATE rola SET nazwa = ? WHERE id = ?", [nazwa.trim(), id]);
  if (result.affectedRows === 0) return res.status(404).json({ error: "Nie znaleziono" });

  res.json({ ok: true });
});

router.delete("/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!isInt(id)) return res.status(400).json({ error: "Niepoprawne id" });

  try {
    const [result] = await db.query("DELETE FROM rola WHERE id = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Nie znaleziono" });
    res.json({ ok: true });
  } catch (err) {
    res.status(409).json({ error: err.code, message: err.message });
  }
});

module.exports = router;