import e from "express";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

const { createCanvas, loadImage } = require("@napi-rs/canvas");
const axios = require("axios");
const fs = require("fs").promises;

export async function overlayTextOnImage(imageUrl, text, outputFilePath) {
  return new Promise(async (resolve, reject) => {
    try {
      // Fetch the image using axios
      const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
      const imageBuffer = Buffer.from(response.data, "binary");

      // Load the image onto the canvas
      console.log("Downloading image from:", imageUrl);
      const img = await loadImage(imageBuffer);
      const canvas = createCanvas(img.width, img.height);
      const ctx = canvas.getContext("2d");

      // Draw the image onto the canvas
      ctx.drawImage(img, 0, 0, img.width, img.height);

      // Set initial text properties
      let fontSize = 120;
      ctx.font = `${fontSize}px Arial`;
      ctx.textAlign = "center";
      ctx.fillStyle = "white"; // Text color
      ctx.strokeStyle = "black"; // Outline color
      ctx.lineWidth = 3; // Outline width

      // Measure text and adjust font size if necessary
      while (ctx.measureText(text).width > canvas.width * 0.9) {
        fontSize -= 5;
        ctx.font = `${fontSize}px Arial`; // Use the same font family for consistency
      }

      // Calculate text position (centered at bottom)
      const textX = canvas.width / 2;
      const textY = canvas.height - 50;

      // Draw background rectangle behind text
      const textWidth = ctx.measureText(text).width;
      const padding = 20;
      // ctx.fillStyle = "rgba(0, 0, 0, 0.6)"; // Semi-transparent black background color
      // ctx.fillRect(
      //   textX - textWidth / 2 - padding,
      //   textY - fontSize - padding,
      //   textWidth + padding * 2,
      //   fontSize + padding * 2
      // );

      // Draw the text with outline and fill
      ctx.strokeText(text, textX, textY);
      ctx.fillText(text, textX, textY);

      // Convert canvas to a PNG buffer
      const buffer = canvas.toBuffer("image/png");

      // Save the PNG buffer to a file
      await fs.writeFile(outputFilePath, buffer);

      console.log(`Image canvas saved to ${outputFilePath}`);
      resolve(outputFilePath);
    } catch (error) {
      console.error("Error overlaying image:", error);
      reject(error);
    }
  });
}

// Example usage
// overlayTextOnImage(
//   "https://example.com/path/to/image.webp",
//   "Sample text overlay",
//   "./output-image.png"
// );
