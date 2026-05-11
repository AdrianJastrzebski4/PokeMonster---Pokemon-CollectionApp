require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const authRoutes = require("./routes/auth.routes");

const app = express();

app.use(cors());
app.use(express.json());

const kartyRoutes = require("./routes/karty.routes");
const kolekcjeRoutes = require("./routes/kolekcje.routes");
const ogloszeniaRoutes = require("./routes/ogloszenia.routes");
const uzytkownicyRoutes = require("./routes/uzytkownicy.routes");
const roleRoutes = require("./routes/role.routes");

app.use("/api/karty", kartyRoutes);
app.use("/api/kolekcje", kolekcjeRoutes);
app.use("/api/ogloszenia", ogloszeniaRoutes);
app.use("/api/uzytkownicy", uzytkownicyRoutes);
app.use("/api/role", roleRoutes);
app.use("/api/auth", authRoutes);

const db = require("./db");

app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "Backend dziala" });
});

app.get("/api/db-test", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT 1 AS ok");
    res.json(rows[0]);
  } catch (err) {
    console.error("DB ERROR:", err);
    res.status(500).json({
      error: "DB connection/query failed",
      code: err.code,
      message: err.message,
    });
  }
});

app.get("/api/debug-admin", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, email, haslo, rola_id FROM uzytkownicy WHERE email='admin@example.com'"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "debug-admin failed", message: err.message });
  }
});

const reactDistPath = path.join(__dirname, "..", "frontend-react", "dist");
app.use(express.static(reactDistPath));

app.use((req, res, next) => {
  if (req.method !== "GET") return next();
  if (req.path.startsWith("/api/")) return next();

  res.sendFile(path.join(reactDistPath, "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
