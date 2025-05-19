import { getGlobalValue } from "../utils/global-context.js";
import { gemini } from "./gemini/query_gemini-api.js";

/**
 * AI-based message classification function.
 * Sends the message to the AI with a classification system prompt.
 * Returns an object with endpoint flag, message, and download boolean.
 * 
 * @param {string} text - The user message text to classify.
 * @returns {Promise<{endpoint: string, message: string, download: boolean}>}
 */

const globalchat = {}

export async function classifyAI(text, message, userId) {
  // System prompt for classification
  const classificationPrompt = `
You are a message classifier 

Classify the given message into one of the following endpoints based on its intent. Return only a JSON object in the format:

\`\`\`json
{ "endpoint": "<selected_endpoint>", "message": "<concise English-translated request>", "download": <true_or_false> }
\`\`\`

When something is not clear, use only \`/ask\`. Do not use \`/song\` unless the name of a music/song is explicitly mentioned for download or related actions.

### Endpoint Selection Criteria:
1. **/gif**: Use this when the message requests a random GIF.
2. **/gen**: Use this **only** for image generation requests or when the user explicitly asks to create graphics, artwork, or something visual. If unclear, use \`/ask\`.
3. **/ask**: Use this for general questions, requests for code, explanations, or text-based information.
4. **/help**: Use this if the user is asking for help.
5. **/start**: Use this if the user wants to restart the bot.
6. **/about**: Use this if the user asks for information about you.
7. **/song**: Use this only when the name of a music/song is explicitly mentioned for download or similar actions; otherwise, use \`/ask\`.

### Additional Instructions:

\`\`\`js
const allCommands = [
  '/feed', '/isign', '/vsign', '/gif', 'gif', '/fun', 'fun', '/ping', 'ping',
  '/userid', 'userid', '/stop', 'stop', '/ask', 'ask', '/gen', '/song',
  '/lyrics', 'lyrics', '/about', 'about', '/start', 'start', '/help', 'help', '/set', 'set'
];
\`\`\`

If the message is asking for code, explanations, or general knowledge, classify it under \`/ask\` instead of \`/gen\`.
`;

  if (!text) return



  // If Nvidia model is active, proceed with handling image
  console.log("text", text)
  const classificationResponse = await gemini(null, null, classificationPrompt + "\nUser message: " + text);
console.log("classificationResponse",classificationResponse)
  // Parse the JSON response safely
  let classification;
  try {
    classification = JSON.parse(classificationResponse);
    console.log("classification:", classification)
  } catch (e) {
    // Fallback to default classification
    console.log(e)
    classification = { endpoint: "/ask", message: text, download: false };
  }

  return classification;
}
