const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { requireAuth } = require("../middlewares/auth");

function isEmail(v) {
  return typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

router.post("/register", async (req, res) => {
  const { imie, nazwisko, email, haslo } = req.body;

  const errors = [];
  if (!imie || imie.trim().length < 2) errors.push("imie: min 2 znaki");
  if (!nazwisko || nazwisko.trim().length < 2) errors.push("nazwisko: min 2 znaki");
  if (!isEmail(email)) errors.push("email: niepoprawny");
  if (!haslo || String(haslo).length < 6) errors.push("haslo: min 6 znaków");
  if (errors.length) return res.status(400).json({ errors });

  const [roleRows] = await db.query(
    "SELECT id FROM rola WHERE nazwa='USER' LIMIT 1"
  );
  if (roleRows.length === 0)
    return res.status(500).json({ error: "Brak roli USER w bazie" });

  const rola_id = roleRows[0].id;

  try {
    const [result] = await db.query(
      "INSERT INTO uzytkownicy (imie, nazwisko, email, haslo, rola_id) VALUES (?, ?, ?, ?, ?)",
      [
        imie.trim(),
        nazwisko.trim(),
        email.trim(),
        String(haslo), 
        rola_id
      ]
    );

    res.status(201).json({ id: result.insertId, ok: true });
  } catch (err) {
    return res.status(400).json({ error: err.code, message: err.message });
  }
});

router.post("/login", async (req, res) => {
  const { email, haslo } = req.body;

  const errors = [];
  if (!isEmail(email)) errors.push("email: niepoprawny");
  if (!haslo) errors.push("haslo: wymagane");
  if (errors.length) return res.status(400).json({ errors });

  const [rows] = await db.query(
  `SELECT u.id, u.email, u.haslo, r.nazwa AS role
   FROM uzytkownicy u
   JOIN rola r ON r.id = u.rola_id
   WHERE u.email = ?`,
  [email]
);

  if (rows.length === 0) return res.status(401).json({ error: "Błędny email lub hasło" });

  const user = rows[0];
  if (user.haslo !== haslo) {
  return res.status(401).json({ error: "Błędny email lub hasło" });
}

  const token = jwt.sign(
  { id: user.id, role: user.role }, 
  process.env.JWT_SECRET,
  { expiresIn: "2h" }
);

  res.json({ token, user: { id: user.id, email: user.email, rola: user.rola } });
});

router.get("/me", requireAuth, async (req, res) => {
  const [rows] = await db.query(
    `SELECT u.id, u.imie, u.nazwisko, u.email, r.nazwa AS rola
     FROM uzytkownicy u
     JOIN rola r ON r.id = u.rola_id
     WHERE u.id = ?`,
    [req.user.id]
  );
  res.json(rows[0] || null);
});

module.exports = router;