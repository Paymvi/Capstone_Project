import jwt from "jsonwebtoken";

function authMiddleware(req, res, next) {
  let token;

  // 1. Try cookie first (web)
  if (req.cookies?.token) {
    token = req.cookies.token;
  }

  // 2. Fallback to Authorization header (mobile)
  else if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ error: "Missing token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

export default authMiddleware;