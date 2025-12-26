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
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
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
let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    console.log("✅ Using existing MongoDB connection");
    return;
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      bufferCommands: false,
    });
    isConnected = true;
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    throw err;
  }
};

// ✅ Connect before handling any request (important for serverless)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ error: "Database connection failed" });
  }
});

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

// ✅ Root route with HTML response
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>WHR-Sorting Backend</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
        h1 { color: #667eea; }
        .endpoint { background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 5px; }
        .status { color: #10b981; font-weight: bold; }
      </style>
    </head>
    <body>
      <h1>🤖 WHR-Sorting Backend API</h1>
      <p class="status">✅ Status: Running</p>
      <h2>Available Endpoints:</h2>
      <div class="endpoint">GET /health - Health check</div>
      <div class="endpoint">POST /login - User login</div>
      <div class="endpoint">POST /signup - User registration</div>
      <div class="endpoint">POST /admin/login - Admin login</div>
      <div class="endpoint">GET /auth/google - Google OAuth</div>
      <div class="endpoint">GET /user/products - Get products</div>
      <div class="endpoint">GET /admin/* - Admin routes (protected)</div>
    </body>
    </html>
  `);
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
