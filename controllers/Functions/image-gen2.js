import { client } from "../../client.js";
import axios from "axios";
import FormData from "form-data";
import { LocalStorage } from "node-localstorage";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const localStorage = new LocalStorage('./scratch');
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function setUserData(userId, key, value) {
  let userData = JSON.parse(localStorage.getItem(userId)) || {};
  userData[key] = value;
  localStorage.setItem(userId, JSON.stringify(userData));
}

function getUserData(userId, key) {
  let userData = JSON.parse(localStorage.getItem(userId)) || {};
  return userData[key];
}

export async function genImage(userId, chat, msgId, message) {
  console.table(JSON.stringify(userId, chat, msgId, message));
  setUserData(userId, 'globalChat', chat);
  setUserData(userId, 'globalMessage', message.replace(/\/gen/, ""));

  try {
    const initialMessage = await client.sendMessage(chat, {
      message: "Image generation is underway. Please hold on...",
      replyTo: msgId,
    });

    setUserData(userId, 'globalInitialMessage', initialMessage);
    console.log("Initial message sent: Image generation is underway.");

    const formData = new FormData();
    const prompt = message.replace(/\/ben/, "");
    formData.append("prompt", prompt);

    const response = await axios.post(
      process.env.FREE_IMG_GEN_API,
      formData,
      { 
        headers: formData.getHeaders(),
        responseType: 'arraybuffer'
      }
    );

    const imageBuffer = Buffer.from(response.data, 'binary');
    const tempDir = path.join(__dirname, 'temp_img');
    
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    const tempImagePath = path.join(tempDir, `${userId}.png`);
    fs.writeFileSync(tempImagePath, imageBuffer);

    await client.sendFile(chat, {
      file: tempImagePath,
      caption: "Here is your generated image:",
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
      message: "An error occurred during image generation. Please try again later.",
      replyTo: msgId,
    });
  }
}
