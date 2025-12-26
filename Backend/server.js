// server.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const passport = require("passport");
const session = require("express-session");

require("./config/passport");

const app = express();

// ---------------- Middleware Setup ----------------
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(bodyParser.json());
app.use(cookieParser());

app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || "http://localhost:3000",
      "https://whr-sorting-front.vercel.app",
      "https://whr-sorting-front-181a0w149-muhammad-maaz-alis-projects.vercel.app"
    ],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(
  session({
    secret: process.env.SESSION_SECRET || "keyboard cat",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

// ---------------- MongoDB ----------------
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err.message));

// ---------------- Routes ----------------
const { authMiddleware, adminMiddleware } = require("./middleware/authmiddleware");

const userSideRoutes = require("./routes/userSide");
const adminSideRoutes = require("./routes/adminSide");
const authRoutes = require("./routes/auth");
const dashboardRoutes = require("./routes/dashboard");
const adminOrdersRoutes = require("./routes/orders");
const googleAuthRoutes = require("./routes/googleAuth");
const userManagementRoutes = require("./routes/userManagement");
const logsRoutes = require("./routes/logs");
const analyticsRoutes = require("./routes/analytics");

// ✅ Root route
app.get("/", (req, res) => {
  res.json({ message: "WHR-Sorting Backend API", status: "running" });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

// Public routes
app.use("/", authRoutes);
app.use("/auth", googleAuthRoutes);

// User routes
app.use("/user/products", userSideRoutes);
app.use("/user", userSideRoutes);

// Admin routes
app.use("/admin", authMiddleware, adminMiddleware, adminSideRoutes);
app.use("/admin", authMiddleware, adminMiddleware, dashboardRoutes);
app.use("/admin/orders", authMiddleware, adminMiddleware, adminOrdersRoutes);
app.use("/admin", authMiddleware, adminMiddleware, userManagementRoutes);
app.use("/admin", authMiddleware, adminMiddleware, logsRoutes);
app.use("/admin", authMiddleware, adminMiddleware, analyticsRoutes);

// ---------------- Start Server ----------------
const PORT = process.env.PORT || 4000;

// ✅ Only listen when not in serverless environment
if (process.env.VERCEL !== "1") {
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}

// ✅ Export for Vercel
module.exports = app;
