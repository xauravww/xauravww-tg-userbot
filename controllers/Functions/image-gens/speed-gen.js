import { client } from "../../../client-init.js";
import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function genImage2(userId, chat, msgId, message, count, initialMessageId) {
  console.table(JSON.stringify(userId, chat, msgId, message));
  console.log("initial msg id", initialMessageId);

  try {
    await client.sendMessage(chat, {
      message: "Image generation is underway. Please hold on...",
      replyTo: msgId,
    });

    console.log("Initial message sent: Image generation is underway.");

    // Directly send data in JSON format without FormData
    const prompt = message.replace(/\/gen2/, "").trim();
    const initialResponse = await axios.post(
      `${process.env.FREE_IMG_GEN_API}/guest-generate-image`,
      { prompt },
      { headers: { 'Content-Type': 'application/json' } }
    );

    const uuid = initialResponse.data.uuid;
    console.log("UUID received:", uuid);

    // Poll for image generation status
    let status = "";
    let images = [];
    const maxAttempts = 20;
    let attempts = 0;

    while (status !== "success" && images.length < count && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for 2 seconds before retrying
      const statusResponse = await axios.get(`${process.env.FREE_IMG_GEN_API}/guest-watch-process/${uuid}`);
      status = statusResponse.data.status;
      images = statusResponse.data.images || [];
      console.log(`Attempt ${attempts + 1}: Status - ${status}, Images - ${images.length}`);
      attempts++;
    }

    if (images.length > 0) {
      const tempDir = path.join(__dirname, "temp_img");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
      }

      // Download and send each image
      for (let i = 0; i < Math.min(count, images.length); i++) {
        const imageResponse = await axios.get(`${process.env.FREE_IMG_GEN_API}${images[i]}`, {
          responseType: "arraybuffer"
        });
        const imageBuffer = Buffer.from(imageResponse.data, "binary");
        
        const tempImagePath = path.join(tempDir, `${userId}_${i}.jpeg`);
        fs.writeFileSync(tempImagePath, imageBuffer);

        await client.sendFile(chat, {
          file: tempImagePath,
          caption: `<code>${message}</code>`,
          replyTo: msgId,
          parseMode: "html",
        });

        fs.unlinkSync(tempImagePath);
      }

      await client.editMessage(chat, {
        message: initialMessageId,
        text: `Image generation complete!`,
      });
      console.log("All images sent to the chat and temporary files deleted.");
    } else {
      console.log("Image generation failed or did not complete in time.");
      await client.sendMessage(chat, {
        message: "Image generation failed. Please try again.",
        replyTo: msgId,
      });
    }
  } catch (error) {
    console.error("Error occurred while generating image:", error.message);
    await client.sendMessage(chat, {
      message: "An error occurred during image generation. Please try again.",
      replyTo: msgId,
    });
  }
}
