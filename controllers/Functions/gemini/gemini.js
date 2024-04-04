// node --version # Should be >= 18
// npm install @google/generative-ai
import { createRequire } from "module"
const require = createRequire(import.meta.url)
const path = require("path")

const dotenv = require("dotenv")
dotenv.config({ path: path.resolve(".env") })

const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold
} = require("@google/generative-ai")

const MODEL_NAME = "gemini-pro"
const API_KEY = process.env.GEMINI_API_KEY

async function runChat(inputText) {
  const genAI = new GoogleGenerativeAI(API_KEY)
  const model = genAI.getGenerativeModel({ model: MODEL_NAME })

  const generationConfig = {
    temperature: 0.9,
    topK: 1,
    topP: 1,
    maxOutputTokens: 2048
  }

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
  ]

  const chat = model.startChat({
    generationConfig,
    safetySettings,
    history: []
  })

  const result = await chat.sendMessage(inputText)
  const response = result.response
 

  return response.text()
}

// runChat()

export default runChat
