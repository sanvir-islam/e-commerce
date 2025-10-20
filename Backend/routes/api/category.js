const express = require("express");
const router = express.Router();
const { getCategies, createCategie } = require("../../controller/categoryController");
const { requiredRole, verifyAuthToken } = require("../../middleware/authMiddleware");

router.get("/get-categories", verifyAuthToken, requiredRole("admin", "manager", "staff", "user"), getCategies);
router.post("/create-category", verifyAuthToken, requiredRole("admin", "manager"), createCategie);
// router.post("/update-category/:id");
// router.post("/delete-category/:id");

module.exports = router;
