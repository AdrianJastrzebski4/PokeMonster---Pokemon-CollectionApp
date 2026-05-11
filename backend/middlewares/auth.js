const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [type, token] = header.split(" ");

  if (type !== "Bearer" || !token) {
    return res.status(401).json({ error: "Brak tokena (zaloguj się)" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; 
    next();
  } catch (err) {
    return res.status(401).json({ error: "Nieprawidłowy lub wygasły token" });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Brak autoryzacji" });
    if (!roles.includes(req.user.rola)) {
      return res.status(403).json({ error: "Brak uprawnień" });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };