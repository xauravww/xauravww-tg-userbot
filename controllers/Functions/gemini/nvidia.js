import axios from 'axios';
import chatHistoryManager from "./chatHistoryManager.js";

const invokeUrl = "https://integrate.api.nvidia.com/v1/chat/completions";
const stream = false;

const headers = {
  "Authorization": "Bearer " + process.env.NVIDIA_API_KEY,
  "Accept": stream ? "text/event-stream" : "application/json"
};

/**
 * Invoke Nvidia API with optional image base64 string and/or text input.
 * @param {string} inputText - The text input to send if no image is provided.
 * @param {string} [imageB64] - Optional base64 encoded image string.
 * @param {string} senderId - The sender ID for chat history context.
 * @returns {Promise<object|string>} - The API response data or streamed data as string.
 */
export async function invokeNvidiaApi(inputText, imageB64, senderId) {
  async function callApiWithMessages(messages) {
    const payload = {
      "model": "meta/llama-4-maverick-17b-128e-instruct",
      "messages": messages.map(msg => ({
        role: msg.role,
        content: msg.parts ? (msg.parts[0]?.text || "") : (msg.content || "")
      })),
      "max_tokens": 512,
      "temperature": 1.00,
      "top_p": 1.00,
      "stream": stream
    };
    return await axios.post(invokeUrl, payload, { headers: headers, responseType: stream ? 'stream' : 'json' });
  }


  try {
    let content = inputText;
    if (imageB64) {
      if (imageB64.length > 180000) {
        throw new Error("To upload larger images, use the assets API (see docs)");
      }
      content = "What is in this image? <img src=\"data:image/png;base64," + imageB64 + "\" />";
    }

    // Get chat history for sender
    const chatHistories = chatHistoryManager.getHistory(senderId);

    // Add user message to history
    const userMessage = { role: "user", parts: [{ text: content }] };
    chatHistoryManager.addMessage(senderId, userMessage);

    // Use only last 5 messages for context to avoid API errors
    const recentMessages = chatHistories.slice(-5);

    let response;
    try {
      response = await callApiWithMessages(recentMessages);
    } catch (err) {
      console.warn("Nvidia API call with context failed, retrying with last user message only", err);
      // Retry with only last user message (stateless)
      response = await callApiWithMessages([userMessage]);
    }

    if (stream) {
      let resultData = '';
      response.data.on('data', (chunk) => {
        resultData += chunk.toString();
      });
      return resultData;
    } else {
      // console.log("response.data", response.data);
      // Nvidia API may return base64 encoded content or raw text.
      // If content looks like base64, decode it; else return as is.
      if (response.data.choices && response.data.choices[0] && response.data.choices[0].message && response.data.choices[0].message.content) {
        let content = response.data.choices[0].message.content;
        // Check if content is base64 encoded (heuristic)
        const base64Pattern = /^[A-Za-z0-9+/=\\s]+$/;
        if (base64Pattern.test(content.replace(/\s/g, ''))) {
          try {
            const buffer = Buffer.from(content, 'base64');
            const decoded = buffer.toString('utf-8');
            // If decoded string is still gibberish, fallback to original content
            if (/[\x00-\x08\x0E-\x1F]/.test(decoded)) {
              return response.data;
            }
            response.data.choices[0].message.content = decoded;
          } catch (decodeError) {
            console.error("Error decoding base64 content from Nvidia API:", decodeError);
          }
        }
      }

      // Add model response to chat history
      const modelResponseText = response.data.choices[0].message.content || JSON.stringify(response.data);
      const modelMessage = { role: "assistant", parts: [{ text: modelResponseText }] };
      chatHistoryManager.addMessage(senderId, modelMessage);


      return response.data;
    }
  } catch (error) {
    console.error("Error invoking Nvidia API:", error);
    throw error;
  }
}
