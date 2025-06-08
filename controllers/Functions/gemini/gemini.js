import { createRequire } from "module";
const require = createRequire(import.meta.url);

const dotenv = require("dotenv");
dotenv.config({path:path.resolve('.env')});
import showdown from "showdown";
import { getGlobalValue } from "../../utils/global-context.js";
import path from "path";
import geminiChatHistoryManager from "./geminiChatHistoryManager.js";
const converter = new showdown.Converter()
import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;

const MODEL_NAME = getGlobalValue("textModel") || process.env.GEMINI_MODEL_NAME.split(" ")[0];

const ai = new GoogleGenAI({
  apiKey,
});

async function runChat(inputText, senderId, systemInstruction) {
  try {
    // Send message using GeminiChatHistoryManager
    const responseText = await geminiChatHistoryManager.sendMessage(senderId, inputText, systemInstruction);

    const html = converter.makeHtml(responseText);
    return { html, responseText };
  } catch (error) {
    console.error("Error during chat:", error);
    return `Too many requests. Please try again later. <br>Or contact <a href="tg://openmessage?user_id=${process.env.OWNER_USERID.split(" ")[0]}">here</a> if it persists longer.`;
  }
}

export default runChat;
