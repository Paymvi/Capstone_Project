function requireAdmin(req, res, next){
  if(!req.user || !req.user.is_admin) {
    return res.status(403).json({ error: "Admin only" });
  }

  next();
}

module.exports = requireAdmin;