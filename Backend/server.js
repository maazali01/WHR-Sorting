// server.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const passport = require("passport");
const session = require("express-session");
const path = require("path");

require("./config/passport"); // ✅ Load passport config

const app = express();

// ---------------- Middleware Setup ----------------
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(bodyParser.json());
app.use(cookieParser());

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ✅ Passport + Session (needed for Google OAuth)
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
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    });
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    console.error("Retrying in 5 seconds...");
    setTimeout(connectDB, 5000);
  }
};

connectDB();

// ---------------- Routes ----------------
const { authMiddleware, adminMiddleware } = require("./middleware/authmiddleware");

const userSideRoutes = require("./routes/userSide");
const adminSideRoutes = require("./routes/adminSide");
const authRoutes = require("./routes/auth");
const dashboardRoutes = require("./routes/dashboard");
const adminOrdersRoutes = require("./routes/orders");
const googleAuthRoutes = require("./routes/googleAuth"); // ✅ added
const userManagementRoutes = require("./routes/userManagement");
const logsRoutes = require("./routes/logs");
const analyticsRoutes = require("./routes/analytics"); // ✅ added
const webotsRoutes = require("./routes/webots"); // ✅ Add this import
const aiModelsRoutes = require("./routes/aiModels"); // ✅ Add this import
const webotsEnvironmentRoutes = require("./routes/webotsEnvironment"); // ✅ Add this import
// Public
app.use("/", authRoutes);
app.use("/auth", googleAuthRoutes); // ✅ Google OAuth entry

// User routes (products should be accessible without full admin auth)
app.use("/user/products", userSideRoutes);
app.use("/user", userSideRoutes); // ✅ mount same router at /user for profile/orders endpoints

// Admin routes (protected)
app.use("/admin", authMiddleware, adminMiddleware, adminSideRoutes);
app.use("/admin", authMiddleware, adminMiddleware, dashboardRoutes);
// mount orders under /admin/orders (history + pending + actions)
app.use("/admin/orders", authMiddleware, adminMiddleware, adminOrdersRoutes);
app.use("/admin", authMiddleware, adminMiddleware, userManagementRoutes);
app.use("/admin", authMiddleware, adminMiddleware, logsRoutes);
app.use("/admin", authMiddleware, adminMiddleware, analyticsRoutes); // ✅ added
app.use("/admin/ai-models", authMiddleware, adminMiddleware, aiModelsRoutes); // ✅ Mount AI Models routes at /admin/ai-models
app.use("/webots", authMiddleware, adminMiddleware, webotsRoutes); // ✅ Mount Webots routes at /webots
app.use("/admin/webots-env", authMiddleware, adminMiddleware, webotsEnvironmentRoutes); // ✅ Mount Webots Environment routes at /admin/webots-env
// ---------------- Start Server ----------------
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
