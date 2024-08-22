const express = require("express");
require("dotenv").config();

const routes = require("./routes");

const PORT = process.env.PORT || 11900;

const app = express();

app.use("/api", routes);

app.get("/", (req, res) => {
  res.send("Document Conversion API");
});

app.listen(PORT, () => {
  console.log("Document Conversion API started on port: " + PORT);
});
