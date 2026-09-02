const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
require("dotenv").config();

const connectDB = require("./config/db");
const createAdmin = require("./config/createAdmin");

const app = express();

const PORT = process.env.PORT || 5000;

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } // Allow Cloudinary images
}));

const allowedOrigins = process.env.CLIENT_URL
  ? [process.env.CLIENT_URL, "http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5174", "http://localhost:5174"]
  : ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5174", "http://localhost:5174"];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure DB connection for all API routes (Serverless Best Practice)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: "Database connection failed", error: err.message });
  }
});

// Function to mount routes on a specific base path
const mountRoutes = (basePath) => {
  app.use(`${basePath}/auth`, require("./routes/authRoutes"));
  app.use(`${basePath}/users`, require("./routes/userRoutes"));
  app.use(`${basePath}/products`, require("./routes/productRoutes"));
  app.use(`${basePath}/cart`, require("./routes/cartRoutes"));
  app.use(`${basePath}/payment`, require("./routes/paymentRoutes"));
  app.use(`${basePath}/orders`, require("./routes/orderRoutes"));
  app.use(`${basePath}/profile`, require("./routes/profileRoutes"));
  app.use(`${basePath}/dashboard`, require("./routes/dashboardRoutes"));
  app.use(`${basePath}/newsletter`, require("./routes/newsletterRoutes"));
  app.use(`${basePath}/coupons`, require("./routes/couponRoutes"));
  app.use(`${basePath}/membership`, require("./routes/membershipRoutes"));
  app.use(`${basePath}/contact`, require("./routes/contactRoutes"));
};

// Mount routes for both environments (Vercel strips /api in some configurations)
mountRoutes("/api");
mountRoutes("");

// Serve uploaded images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Root Route
app.get("/", (req, res) => {
  res.send("Welcome to the E-Commerce Jewellery API Backend!");
});

// Create admin user once DB is connected (in background)
connectDB().then(() => createAdmin()).catch(() => {});

// Start server (for Render & Local)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

// Export for Vercel serverless functions
module.exports = app;