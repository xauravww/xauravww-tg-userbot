import { client } from "../../../client-init.js";
import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";  // For image conversion to PNG/JPG


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to send POST request to FluxImageGenerator API and send converted image
export async function genImage4(userId, chat, msgId, message,initialMessageId) {
  console.table(JSON.stringify(userId, chat, msgId, message));

  try {
    // Send initial message indicating image generation is in progress
    const initialMessage = await client.sendMessage(chat, {
      message: "Image generation is underway. Please hold on...",
      replyTo: msgId,
    });

    console.log("Initial message sent: Image generation is underway.");

    // Define the POST request body based on the provided prompt and settings
    const prompt = message.replace(/\/gen3/, ""); // Remove the command from the message
    const bodyData = {
      aspect_ratio: "1:1",
      output_quality: 100,
      prompt: prompt.trim(),
      version: process.env.REPLICATE_API_VERSION
    };
 
    // Send POST request to FluxImageGenerator API
    const response = await axios.post(process.env.REPLICATE_API_ENDPOINT, bodyData, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Extract the image URL from the response
    const imageUrl = response.data.data[0];
    console.log("Image URL received:", imageUrl);

    // Fetch the image from the URL and store it in a buffer
    const imageResponse = await axios.get(imageUrl, { responseType: "arraybuffer" });
    const imageBuffer = Buffer.from(imageResponse.data, "binary");

    // Use sharp to convert the image to PNG or JPG (you can change this based on preference)
    const convertedImageBuffer = await sharp(imageBuffer).png().toBuffer();  // Convert to PNG

    // Define temporary directory and path for saving the image
    const tempDir = path.join(__dirname, "temp_img");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);  // Create the directory if it doesn't exist
    }

    const tempImagePath = path.join(tempDir, `${userId}.png`);
    fs.writeFileSync(tempImagePath, convertedImageBuffer);  // Save the converted image

    // Send the converted image to the chat
    await client.editMessage(chat, {
        message: initialMessageId,
        text: `Image generation complete!`,
      });
    await client.sendFile(chat, {
      file: tempImagePath,
      caption: `<code>${prompt}</code>`,
      replyTo: msgId,
      parseMode: "html",
    });

    // Delete the temporary image file after sending
    fs.unlinkSync(tempImagePath);
    console.log("Image sent to the chat and temporary file deleted.");
  } catch (error) {
    console.error("Error occurred while generating image:", error);
    console.log("Error details:", {
      message: error.message,
      stack: error.stack,
      response: error.response ? error.response.data : null,
    });

    // Send error message to chat
    await client.sendMessage(chat, {
      message: "An error occurred during image generation. Please try again later \nOr try again using another model",
      replyTo: msgId,
    });
  }
}
