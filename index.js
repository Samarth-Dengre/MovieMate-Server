const express = require("express");
const app = express();
require("dotenv").config();

app.use(express.json());
// Redirecting requests to routes
app.use("/", require("./routes"));

// Starting the server
app.listen(process.env.PORT, () => {
  console.log("Server Started at port:", process.env.PORT);
});
