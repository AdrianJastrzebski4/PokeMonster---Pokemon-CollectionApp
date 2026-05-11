module.exports = function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Brak autoryzacji" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Brak uprawnień" });
    }

    next();
  };
};