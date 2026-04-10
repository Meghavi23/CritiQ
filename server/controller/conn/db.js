const mongoose = require("mongoose");
require("dotenv").config();


mongoose
  .connect(DB, {
    useUnifiedTopology: true,
  })
  .then(() => console.log("Database connected!!!"))
  .catch((error) => {
    console.log(error);
  });