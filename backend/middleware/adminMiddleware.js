function requireAdmin(req, res, next) {
  console.log("ADMIN CHECK USER:", req.user); 

  if (!req.user.is_admin) {
    return res.status(403).json({ error: "Forbidden" });
  }

  next();
}

module.exports = requireAdmin;