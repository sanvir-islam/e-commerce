require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();

app.use(cookieParser()); // middleware for auto extract cookies
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // for traditional html form

// custom middleware
const requireBody = require("./middleware/requireBody");
app.use(requireBody);

const routes = require("./routes");
app.use(routes);

//errMsg on hitting wrong route
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// global error handler
const errorHandler = require("./middleware/errorHandler");
app.use(errorHandler);

const dbConnection = require("./config/dbConnection");
dbConnection();

app.listen(process.env.PORT || 3000, () => {
  console.log(`http://localhost:${process.env.PORT || 3000}${process.env.BASE_URL}`);
});
