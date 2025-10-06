const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
require("dotenv").config();

const app = express();

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(
  cors({
    origin: "http://localhost:3000", // frontend origin
    credentials: true,
  })
);
app.use(bodyParser.json());
app.use(cookieParser()); // ✅ needed for reading cookies
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// MongoDB connection
const mongoURI = "mongodb+srv://ab1438068:warehouse-123@wareshouse-bot-cluster.ciea2xx.mongodb.net/?retryWrites=true&w=majority&appName=wareshouse-bot-cluster";
mongoose
  .connect(mongoURI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Middlewares
const { authMiddleware, adminMiddleware } = require("./middleware/authmiddleware");

// Routes
const userSideRoutes = require("./routes/userSide");
const adminSideRoutes = require("./routes/adminSide");
const authRoutes = require("./routes/auth");
const dashboardRoutes = require("./routes/dashboard"); // ✅ renamed
const adminOrdersRoutes = require('./routes/orders'); 

app.use('/admin/dashboard', authMiddleware, adminMiddleware, adminOrdersRoutes);
app.use("/user/products", userSideRoutes);
app.use("/admin", authMiddleware, adminMiddleware, adminSideRoutes);
app.use("/admin", authMiddleware, adminMiddleware, dashboardRoutes); // ✅ mount dashboard directly under /admin
app.use("/", authRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


