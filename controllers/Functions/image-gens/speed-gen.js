import { client } from "../../../client-init.js";
import axios from "axios";
import FormData from "form-data";
import { LocalStorage } from "node-localstorage";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


export async function genImage2(userId, chat, msgId, message,initialMessageId) {
  console.table(JSON.stringify(userId, chat, msgId, message));
 console.log("initial msg id", initialMessageId)

  try {
    await client.sendMessage(chat, {
      message: "Image generation is underway. Please hold on...",
      replyTo: msgId,
    });

    
    console.log("Initial message sent: Image generation is underway.");

    const formData = new FormData();
    console.log("🎈 ~ speed-gen.js:27 -> formData: ",  formData);
    const prompt = message.replace(/\/gen2/, "");
    console.log("🛶 ~ speed-gen.js:29 -> prompt: ",  prompt);
    formData.append("prompt", prompt);

    const response = await axios.post(process.env.FREE_IMG_GEN_API, formData, {
      headers: formData.getHeaders(),
      responseType: "arraybuffer",
    });

    const imageBuffer = Buffer.from(response.data, "binary");
    const tempDir = path.join(__dirname, "temp_img");

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    const tempImagePath = path.join(tempDir, `${userId}.png`);
    fs.writeFileSync(tempImagePath, imageBuffer);
     await client.editMessage(chat, {
            message: initialMessageId,
            text: `Image generation complete!`,
          });
    await client.sendFile(chat, {
      file: tempImagePath,
      caption: `<code>${message}</code>`,
      replyTo: msgId,
      parseMode: "html",
    });

    fs.unlinkSync(tempImagePath);
    console.log("Image sent to the chat and temporary file deleted.");
  } catch (error) {
    console.error("Error occurred while generating image:", error);
    console.log("Error details:", {
      message: error.message,
      stack: error.stack,
      response: error.response ? error.response.data : null,
    });

    await client.sendMessage(chat, {
      message:
        "An error occurred during image generation.\nOr try again using another model",
      replyTo: msgId,
    });
  }
}
