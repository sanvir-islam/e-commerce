require("dotenv").config();
const express = require("express");
const app = express();
app.use(express.json());

const routes = require("./routes");
app.use(routes);

const dbConnection = require("./config/dbConnection");
dbConnection();

app.listen(process.env.PORT, () => {
  console.log(`http://localhost:${process.env.PORT}${process.env.BASE_URL}`);
});
