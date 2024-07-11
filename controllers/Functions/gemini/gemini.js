import { createRequire } from "module";
const require = createRequire(import.meta.url);
const path = require("path");

const dotenv = require("dotenv");
dotenv.config({ path: path.resolve(".env") });

const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold
} = require("@google/generative-ai");

const MODEL_NAME = "gemini-1.5-pro";
const API_KEY = process.env.GEMINI_API_KEY;

// Initialize an object to store chat histories by senderId
let chatHistories = {};

async function runChat(inputText, senderId) {
  try {
    // Check if chat history exists for this senderId, otherwise initialize it
    if (!chatHistories[senderId]) {
      chatHistories[senderId] = [];
    }

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const generationConfig = {
      temperature: 0.9,
      topK: 1,
      topP: 1,
      maxOutputTokens: 2048
    };

    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
      }
    ];

    const chat = model.startChat({
      generationConfig,
      safetySettings,
      history: chatHistories[senderId] // Pass the current chat history for this senderId
    });

    // Send user input
    const userMessage = {
      role: "user",
      parts: inputText
    };

    // Add user message to history for this senderId
    chatHistories[senderId].push(userMessage);

    const result = await chat.sendMessage(inputText);
    const response = result.response;

    // Add model response to history for this senderId
    const modelMessage = {
      role: "model",
      parts: response.text()
    };
    chatHistories[senderId].push(modelMessage);

    return response.text();
  } catch (error) {
    console.log(error)

    return "Too many requests. Please try again later.";


  }
}

export default runChat;
