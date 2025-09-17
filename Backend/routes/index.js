const express = require("express");
const router = express.Router();

const apiRoutes = require("./api");
router.use(process.env.BASE_URL, apiRoutes);

module.exports = router;
