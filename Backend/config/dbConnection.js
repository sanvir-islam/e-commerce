const mongoose = require("mongoose");

function dbConnection() {
  mongoose
    .connect(process.env.DATABASE_URL)
    .then(() => console.log("MongoDB Connected"))
    .catch((err) => {
      console.log("server error" + err);
    });
}

module.exports = dbConnection;
