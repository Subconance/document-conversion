const expressAsyncHandler = require("express-async-handler");
const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const { Document, Packer, Paragraph, TextRun } = require("docx");
const { exec } = require("child_process");

const wordToPdf = expressAsyncHandler(async (req, res) => {
  const filePath = path.resolve(req.file.path);
  const outputDir = path.resolve("uploads");
  const outputFilePath = path.join(outputDir, `${req.file.filename}.pdf`);

  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      console.error(`The uploaded file was not found.: ${filePath}`);
      return res.status(500).json({
        success: false,
        error: "The uploaded file was not found.",
      });
    }

    fs.access(outputDir, fs.constants.F_OK, (err) => {
      if (err) {
        console.error(`Output directory not found: ${outputDir}`);
        return res.status(500).json({
          success: false,
          error: "Output directory not found.",
        });
      }

      exec(
        `unoconv -o ${outputFilePath} -f pdf ${filePath}`,
        (error, stdout, stderr) => {
          if (error) {
            console.error(`Conversion error: ${error.message}`);
            console.error(`stderr: ${stderr}`);
            return res.status(500).json({
              success: false,
              error: "An error occurred during conversion.",
            });
          }

          console.log(`stdout: ${stdout}`);
          console.log(`stderr: ${stderr}`);

          fs.access(outputFilePath, fs.constants.F_OK, (err) => {
            if (err) {
              console.error(
                `The created file was not found: ${outputFilePath}`
              );
              return res.status(500).json({
                success: false,
                error: "An error occurred during conversion.",
              });
            }

            return res.download(outputFilePath, (err) => {
              if (err) {
                console.error(`Download error: ${err.message}`);
                return res.status(500).json({
                  success: false,
                  error: "Download Error",
                });
              }
              
              fs.unlink(filePath, (unlinkErr) => {
                if (unlinkErr) {
                  console.log(
                    `Uploaded file deletion error: ${unlinkErr.message}`
                  );
                  return res.status(500).json({
                    success: false,
                    error: "Uploaded file deletion error.",
                  });
                }
              });
              fs.unlink(outputFilePath, (unlinkErr) => {
                if (unlinkErr) {
                  console.log(
                    `Converted file deletion error: ${unlinkErr.message}`
                  );
                  return res.status(500).json({
                    success: false,
                    error: "Converted file deletion error.",
                  });
                }
              });
            });
          });
        }
      );
    });
  });
});

const pdfToWord = expressAsyncHandler(async (req, res) => {
  const filePath = path.resolve(req.file.path); 
  const outputFilePath = path.join("uploads", `${req.file.filename}.docx`);

  try {
    const pdfBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(pdfBuffer);

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: pdfData.text,
                  size: 24,
                }),
              ],
            }),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(outputFilePath, buffer);

    return res.download(outputFilePath, (err) => {
      if (err) {
        console.error(`Download error: ${err.message}`);
        return res.status(500).json({
          success: false,
          error: "An error occurred during file download.",
        });
      }

      
      fs.unlink(filePath, (unlinkErr) => {
        if (unlinkErr) {
          console.log(`Uploaded file deletion error: ${unlinkErr.message}`);
          return res.status(500).json({
            success: false,
            error: "Uploaded file deletion error.",
          });
        }
      });
      fs.unlink(outputFilePath, (unlinkErr) => {
        if (unlinkErr) {
          console.log(`Converted file deletion error: ${unlinkErr.message}`);
          return res.status(500).json({
            success: false,
            error: "Converted file deletion error.",
          });
        }
      });
    });
  } catch (error) {
    console.error(`Conversion error: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: "An error occurred during conversion.",
    });
  }
});

const pdfToImage = expressAsyncHandler(async (req, res) => {
  const filePath = path.resolve(req.file.path);
  const outputDir = path.join("uploads", `${req.file.filename}_images`);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const command = `pdftoppm -png ${filePath} ${path.join(outputDir, "image")}`;
  console.log(`Running command: ${command}`);

  exec(command, (err, stdout, stderr) => {
    if (err) {
      console.error(`Conversion error: ${stderr}`);
      return res.status(500).json({
        success: false,
        error: "An error occurred during conversion.",
      });
    }

    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);

    const imagePath = path.join(outputDir, "image-1.png");

    fs.access(imagePath, fs.constants.F_OK, (err) => {
      if (err) {
        console.error(`Image not found: ${imagePath}`);
        return res.status(500).json({
          success: false,
          error: "An error occurred during conversion.",
        });
      }

      return res.download(imagePath, (err) => {
        if (err) {
          console.error(`Download error: ${err.message}`);
          return res.status(500).json({
            success: false,
            error: "Download error.",
          });
        }

        fs.rm(filePath, { force: true }, (err) => {
          if (err) console.error(`File deletion error: ${err.message}`);
        });

        fs.rm(outputDir, { recursive: true, force: true }, (err) => {
          if (err) console.error(`Directory deletion error: ${err.message}`);
        });
      });
    });
  });
});


module.exports = { wordToPdf, pdfToImage, pdfToWord };
