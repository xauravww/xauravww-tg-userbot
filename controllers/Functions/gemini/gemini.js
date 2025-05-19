import { createRequire } from "module";
const require = createRequire(import.meta.url);

const dotenv = require("dotenv");
dotenv.config({path:path.resolve('.env')});
import showdown from "showdown";
import { getGlobalValue } from "../../utils/global-context.js";
import path from "path";
import chatHistoryManager from "./chatHistoryManager.js";
const converter = new showdown.Converter()
const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");

const apiKey = process.env.GEMINI_API_KEY;

const MODEL_NAME = getGlobalValue("textModel") || process.env.GEMINI_MODEL_NAME.split(" ")[0];
// console.log("MODEL NAME", MODEL_NAME);
const genAI = new GoogleGenerativeAI(apiKey);

// Configure model with persona-specific system instruction
const model = genAI.getGenerativeModel({
  model: MODEL_NAME,
  systemInstruction: process.env.SYSTEM_INSTRUCTIONS_GEMINI
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 4093,
  // responseMimeType: "text/plain",
};

// Function to handle chat interactions
async function runChat(inputText, senderId) {
  try {
    // Get chat history for sender
    const chatHistories = chatHistoryManager.getHistory(senderId);

    // Start a chat session with specific settings and existing chat history
    const chatSession = model.startChat({
      generationConfig,
      history: chatHistories,
    });

    // Add user input to chat history
    const userMessage = { role: "user", parts: [{ text: inputText }] };
    chatHistoryManager.addMessage(senderId, userMessage);

    // Generate a response based on input text and current chat session
    const result = await chatSession.sendMessage(inputText);
    const responseText = result.response.text();

    // Add model's response to chat history
    const modelMessage = { role: "model", parts: [{ text: responseText }] };
    chatHistoryManager.addMessage(senderId, modelMessage);
    const html = converter.makeHtml(responseText);
    // console.log(html)
    return {html, responseText}
  } catch (error) {
    console.error("Error during chat:", error);
    return `Too many requests. Please try again later. <br>Or contact <a href="tg://openmessage?user_id=${process.env.OWNER_USERID.split(" ")[0]}">here</a> if it persists longer.`;

  }
}

export default runChat;
