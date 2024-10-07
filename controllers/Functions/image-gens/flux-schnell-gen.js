import { client } from "../../../client-init.js";
import axios from "axios";

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



// Function to generate images based on user input
export async function generateImage3(userId, chat, msgId, message, modelVersion,initialMessageId) {
  if (!userId || !chat || !msgId || !message) {
    console.error("Invalid parameters:", { userId, chat, msgId, message });
    return;
  }

  console.table({ userId, chat, msgId, message, modelVersion });

  

  try {
    const initialMessage = await client.sendMessage(chat, {
      message: `Generating image using Schnell Gen Model...`,
      replyTo: msgId,
    });

   

    const apiData = {
      "height": 1024,
      "prompt": message.replace(/\/ben3/, ""),
      "version": `${process.env.FLUX_SCHNELL_API_MODEL_PREFIX}/${modelVersion}`,
      "width": 1024
    }

    let response;

    // Using correct API endpoint based on modelVersion
    const url = process.env.FLUX_SCHNELL_API_ENDPOINT;

    response = await axios.post(url, apiData, {
      headers: {
        'Content-Type': 'application/json',
      },
      responseType: 'arraybuffer',
    });

    // Log the response to check if it contains valid data
    // console.log("API response length:", response.data.byteLength);
    if (response.data.byteLength === 0) {
      throw new Error("Received empty image data.");
    }

    console.log("🏝️ ~ flux-gen.js:75 -> response.data: ", response.data);

    const tempDir = path.join(__dirname, 'temp_img');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    const tempImagePath = path.join(tempDir, `${userId}.png`);
    
    // Ensure the buffer is correctly written as an image file
    fs.writeFileSync(tempImagePath, Buffer.from(response.data));
    await client.editMessage(chat, {
      message: initialMessageId,
      text: `Image generation complete!`,
    });
    await client.sendFile(chat, {
      file: tempImagePath,
      caption: `<code>${apiData.prompt}</code>`,
      replyTo: msgId,
      parseMode: "html",
    });

    fs.unlinkSync(tempImagePath); // Clean up
    console.log("Image sent and temp file deleted.");

  } catch (error) {
    console.error("Error generating image:", error.message);
    await client.sendMessage(chat, {
      message: "Error during image generation. Please try again later.",
      replyTo: msgId,
    });
  }
}

