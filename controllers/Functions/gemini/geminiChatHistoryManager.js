import { GoogleGenAI, createUserContent } from "@google/genai";
import { getGlobalValue, setGlobalValue, getUserSpecificValue } from "../../utils/global-context.js";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const TOKEN_LIMIT = 909999; // Token limit for pruning

// Function to calculate token count for a message
function calculateTokenCount(text) {
  return Math.ceil(text.length / 4);
}

// Function to prune history if it exceeds the token limit
function pruneHistory(history) {
  let tokenCount = history.reduce((sum, msg) => {
    const text = msg.parts ? (msg.parts[0]?.text || "") : (msg.content || "");
    return sum + calculateTokenCount(text);
  }, 0);

  while (tokenCount > TOKEN_LIMIT && history.length > 1) {
    const removedMsg = history[1]; // second message
    const text = removedMsg.parts ? (removedMsg.parts[0]?.text || "") : (removedMsg.content || "");
    tokenCount -= calculateTokenCount(text);
    history.splice(1, 1);
  }
}

class GeminiChatHistoryManager {
  constructor() {
    this.globalKey = "geminiChatHistories";
    this.chatHistories = getGlobalValue(this.globalKey) || {};
  }

  getHistory(senderId, systemInstruction) {
    if (!this.chatHistories[senderId]) {
      const userGender = getUserSpecificValue(senderId, "gender") || "male";
      const dynamicSystemInstruction = process.env.SYSTEM_INSTRUCTIONS_GEMINI ? `${process.env.SYSTEM_INSTRUCTIONS_GEMINI} ${userGender}` : userGender;
      this.chatHistories[senderId] = [
        { role: "system", parts: [{ text: systemInstruction || dynamicSystemInstruction }] }
      ];
      setGlobalValue(this.globalKey, this.chatHistories);
    }
    return this.chatHistories[senderId];
  }

  addMessage(senderId, message) {
    const history = this.getHistory(senderId);
    history.push(message);
    pruneHistory(history);
    setGlobalValue(this.globalKey, this.chatHistories);
  }

  async sendMessage(senderId, message, systemInstruction) {
    const history = this.getHistory(senderId, systemInstruction);

    // Prepare contents array including full history plus current user message
    const contents = [
      ...history.map(msg => createUserContent(msg.parts.map(part => part.text))),
      createUserContent([message])
    ];

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL_NAME || "gemini-2.0-flash",
      contents,
      systemInstruction: systemInstruction || process.env.SYSTEM_INSTRUCTIONS_GEMINI || "",
    });

    const responseText = response.text;

    // Add user message and model response to history
    this.addMessage(senderId, { role: "user", parts: [{ text: message }] });
    this.addMessage(senderId, { role: "model", parts: [{ text: responseText }] });

    return responseText;
  }

  // New method to clear chat history for a specific sender
  clearHistory(senderId) {
    if (this.chatHistories[senderId]) {
      delete this.chatHistories[senderId];
      setGlobalValue(this.globalKey, this.chatHistories);
    }
  }
}

export default new GeminiChatHistoryManager();
