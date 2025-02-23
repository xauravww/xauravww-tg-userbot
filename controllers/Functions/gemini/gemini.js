import { createRequire } from "module";
const require = createRequire(import.meta.url);

const dotenv = require("dotenv");
dotenv.config({path:path.resolve('.env')});
import showdown from "showdown";
import { getGlobalValue } from "../../utils/global-context.js";
import path from "path";
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

// Initialize an object to store chat histories by senderId
let chatHistories = {};
const TOKEN_LIMIT = 909999; 

// Function to calculate token count for a message
function calculateTokenCount(text) {
  // Estimate token count based on character length (average: 4 characters per token)
  return Math.ceil(text.length / 4);
}

// Function to prune history if it exceeds the token limit
function pruneHistory(history) {
  let tokenCount = history.reduce((sum, msg) => sum + calculateTokenCount(msg.parts[0].text), 0);
  
  while (tokenCount > TOKEN_LIMIT && history.length > 1) {
    const removedMsg = history.shift();
    tokenCount -= calculateTokenCount(removedMsg.parts[0].text);
  }
}

// Function to handle chat interactions
async function runChat(inputText, senderId) {
  try {
    // Initialize chat history for sender if not already present
    if (!chatHistories[senderId]) {
      chatHistories[senderId] = [];
    }

    // Prune history to stay within token limits
    pruneHistory(chatHistories[senderId]);

    // Start a chat session with specific settings and existing chat history
    const chatSession = model.startChat({
      generationConfig,
      history: chatHistories[senderId],
    });

    // Add user input to chat history
    const userMessage = { role: "user", parts: [{ text: inputText }] };
    chatHistories[senderId].push(userMessage);

    // Generate a response based on input text and current chat session
    const result = await chatSession.sendMessage(inputText);
    const responseText = result.response.text();

    // Add model's response to chat history
    const modelMessage = { role: "model", parts: [{ text: responseText }] };
    chatHistories[senderId].push(modelMessage);
    const html = converter.makeHtml(responseText);
    // console.log(html)
    return {html, responseText}
  } catch (error) {
    console.error("Error during chat:", error);
    return `Too many requests. Please try again later. <br>Or contact <a href="tg://openmessage?user_id=${process.env.OWNER_USERID.split(" ")[0]}">here</a> if it persists longer.`;

  }
}

export default runChat;
