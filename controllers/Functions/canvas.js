import { createRequire } from "module";
const require = createRequire(import.meta.url);

const { createCanvas, loadImage } = require("@napi-rs/canvas");
const axios = require("axios");
const fs = require("fs").promises;

export async function overlayTextOnImage(imageUrl, text, outputFilePath, color, fontSizeGiven,positionY) {
  console.log("positionY: " + positionY)
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
      let fontSize = fontSizeGiven || 120;
      ctx.font = `${fontSize}px Arial`;
      ctx.textAlign = "center";
      ctx.fillStyle = color || "white"; // Text color
      ctx.strokeStyle = "black"; // Outline color
      ctx.lineWidth = 3; // Outline width for text

      // Adjust font size to fit within the canvas width
      while (ctx.measureText(text).width > canvas.width * 0.9) {
        fontSize -= 5;
        ctx.font = `${fontSize}px Arial`;
      }

      // Calculate text position (centered at top)
      const textX = canvas.width / 2;
      const textY = fontSize + 10; // Position slightly below the top

      // Draw background rectangle directly behind the text, with no padding
      const textWidth = ctx.measureText(text).width;
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)"; // Semi-transparent black background
      ctx.fillRect(
        textX - textWidth / 2,
        textY - fontSize,
        textWidth,
        fontSize
      );

      // Draw the text with outline and fill
      ctx.strokeText(text, textX, textY);
      ctx.fillStyle = color || "white";
      ctx.fillText(text, textX, textY);

      // Convert canvas to a PNG buffer
      const buffer = canvas.toBuffer("image/png");

      // Save the PNG buffer to a file
      await fs.writeFile(outputFilePath, buffer);

      console.log(`Image canvas saved to ${outputFilePath}`);
      resolve(outputFilePath);
    } catch (error) {
      console.error("Error overlaying text on image:", error);
      reject(error);
    }
  });
}
