require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const dns = require("dns");
const employeeRoutes = require("./routes/employeeRoutes");

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN ? process.env.CLIENT_ORIGIN.split(",") : true,
    credentials: true,
  })
);
app.use(express.json());

// API Routes
app.use("/api/employees", employeeRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Employee Management API is running" });
});

// Optionally serve static Angular frontend if built
const frontendDistPath = path.join(__dirname, "../frontend/dist/frontend/browser");
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(frontendDistPath, "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.json({ message: "Employee Management API is running" });
  });
}

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing from .env");
    }

    try {
      await mongoose.connect(process.env.MONGODB_URI);
    } catch (err) {
      // If local DNS fails to resolve SRV records on Windows
      if (err.message && err.message.includes("querySrv ECONNREFUSED")) {
        console.log("Local DNS SRV query failed; switching to public DNS (8.8.8.8)...");
        dns.setServers(["8.8.8.8", "1.1.1.1"]);
        await mongoose.connect(process.env.MONGODB_URI);
      } else {
        throw err;
      }
    }

    console.log("Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
}

startServer();
