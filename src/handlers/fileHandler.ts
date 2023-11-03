import pdf from "pdf-parse";
import mammoth from "mammoth";
import * as fs from "node:fs";

// Function to extract text from a PDF file
export async function extractTextFromPDF(filePath) {
  return new Promise((resolve, reject) => {
    const dataBuffer = fs.readFileSync(filePath);
    pdf(dataBuffer)
      .then((data) => {
        resolve(data.text);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

// Function to extract text from a Word file
export async function extractTextFromWord(filePath) {
  return new Promise((resolve, reject) => {
    mammoth
      .extractRawText({ path: filePath })
      .then((result) => {
        resolve(result.value);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

export const extractText = async (req, res) => {
  console.log(req.file);
  if (!req.file) {
    return res.status(400).send("No files were uploaded.");
  }

  // Assuming the file input name is 'file'
  const file = req.file;

  fs.readFile(file.path, "utf8", (err, data) => {
    if (err) {
      return res.status(500).send("Error reading file: " + err);
    }

    mammoth
      .extractRawText({ path: file.path })
      .then((result) => {
        const text = result.value;
        console.log(text);
        res.json({ text });
      })
      .catch((err) => {
        console.log(err);
        res.status(500).send("Error extracting file: " + err);
      });
  });
};
