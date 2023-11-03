import pdf from "pdf-parse";
import mammoth from "mammoth";
import * as fs from "node:fs";

// Function to extract text from a PDF file
async function extractTextFromPDF(filePath) {
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
async function extractTextFromWord(filePath) {
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
