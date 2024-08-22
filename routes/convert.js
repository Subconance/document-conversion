const express = require('express');
const router = express.Router();
const { wordToPdf, pdfToImage, pdfToWord } = require("../controllers");
const multer = require("multer");

const upload = multer({ dest: "uploads/" });

router.post("/word-to-pdf", upload.single("file"), wordToPdf);
router.post("/pdf-to-word", upload.single("file"), pdfToWord);
router.post("/pdf-to-image", upload.single("file"), pdfToImage);

module.exports = router;