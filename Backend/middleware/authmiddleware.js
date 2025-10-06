const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "Yooo-JWT-Token";

const authMiddleware = (req, res, next) => {
  // ✅ check cookie OR Authorization header
  const token =
    req.cookies?.token ||
    (req.headers.authorization && req.headers.authorization.split(" ")[1]);

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("Token verification failed:", err);
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({ message: "Forbidden: Admins only" });
  }
};

module.exports = { authMiddleware, adminMiddleware };
