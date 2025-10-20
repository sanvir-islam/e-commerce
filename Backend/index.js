require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();
// Middleware to parse cookies
app.use(cookieParser());
app.use(express.json());

const routes = require("./routes");
app.use(routes);

const dbConnection = require("./config/dbConnection");
dbConnection();

const errorHandler = require("./middleware/errorHandler");
app.use(errorHandler);
app.listen(process.env.PORT, () => {
  console.log(`http://localhost:${process.env.PORT}${process.env.BASE_URL}`);
});
