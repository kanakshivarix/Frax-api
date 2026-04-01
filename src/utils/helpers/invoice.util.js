// src/utils/helpers/invoice.util.js
const puppeteer = require("puppeteer");
const { s3Client } = require("../../configs/aws.config"); // tumhara existing S3 client
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const ejs = require("ejs");

// Puppeteer se PDF buffer generate karna
async function generateInvoicePDFBuffer(htmlContent) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: "networkidle0" });
  const pdfBuffer = await page.pdf({ format: "A4" });
  await browser.close();
  return pdfBuffer;
}

// S3 me upload karna (existing s3Client use)
async function uploadPDFToS3(buffer, fileName) {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: `invoices/${fileName}`,
    Body: buffer,
    ContentType: "application/pdf",
  };

  try {
    const command = new PutObjectCommand(params);
    await s3Client.send(command);

    // Public URL generate karna
    const s3Url = `https://${process.env.AWS_S3_BUCKET_NAME }.s3.${process.env.AWS_REGION}.amazonaws.com/invoices/${fileName}`;
    return s3Url;
  } catch (err) {
    console.error("S3 Upload Failed:", err);
    throw err;
  }
}

module.exports = {
  generateInvoicePDFBuffer,
  uploadPDFToS3,
};