const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    app: "SaloneBiz",
    message: "SaloneBiz Backend is running 🇸🇱",
    version: "0.1.0"
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "healthy",
    service: "salonebiz-backend",
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`SaloneBiz Backend running on port ${PORT}`);
});
