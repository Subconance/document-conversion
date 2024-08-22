const express = require("express");
const router = express.Router();
const convert = require("./convert")

router.get("/", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Data Conversion API",
  });
});

router.use("/convert", convert)

module.exports = router;
