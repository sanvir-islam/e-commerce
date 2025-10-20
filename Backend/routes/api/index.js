const express = require("express");
const router = express.Router();
const authRoutes = require("./auth");
const categoryRoutes = require("./category");

router.use("/auth", authRoutes);
router.use("/category", categoryRoutes);

module.exports = router;
