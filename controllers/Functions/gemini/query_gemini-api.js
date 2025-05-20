import { client } from "../../../client-init.js";
import handleGeminiQuery from "./gemini.js";
import { invokeNvidiaApi } from "./nvidia.js";
import { replyWithAudio } from "../miscellaneous.js";
import axios from "axios";
import { queueRequest } from "../../msgs.js";
import { getGlobalValue } from "../../utils/global-context.js";
import showdown from "showdown";
const converter = new showdown.Converter()
import chatHistoryManager from "./chatHistoryManager.js";
const globalchat ={}
export async function gemini(chat, msgId, messageText, senderId, isSlashEndpoint = false) {
  // Remove the query prefix
  const newString = messageText.replace("ask ", "");
  const voiceToggle = getGlobalValue("voice_toggle");
  const loadingtext = voiceToggle
    ? "🙊Speaking •၊၊||၊|။||||။၊|။• Hold On.."
    : "✎Typing •၊၊||၊|။||||။၊|။•";
  let msgToBeEditedId;
  try {
    // If chat or msgId is null or invalid, skip sending loading message to avoid errors
    let msgToBeEdited;
    if (chat && msgId && typeof chat !== 'string' && typeof msgId !== 'string') {
      msgToBeEdited = await client.sendMessage(chat, {
        message: loadingtext,
        replyTo: msgId,
      });
      msgToBeEditedId = msgToBeEdited.id;
    } else {
      msgToBeEditedId = null;
    }

    // Check model mode
    const modelMode = getGlobalValue("model_mode") || "gemini-flash";

    if (modelMode === "gemini-flash" || modelMode === "gemini-pro") {
      // Define the filter text
      const filterText = process.env.SYSTEM_INSTRUCTIONS_GEMINI;

    // Add user message to chat history for context
    chatHistoryManager.addMessage(senderId, { role: "user", parts: [{ text: newString }] });

    // Handle the Gemini query
    const { html, responseText } = await handleGeminiQuery(
      newString,
      senderId
    );

    // Return only the responseText string for classification or other uses
    return responseText?.toString() || "";




    } else if (modelMode === "nvidia-pro") {
      // For Nvidia model, assume image base64 string or text input is provided after "ask "
      let input = newString.trim();

      // If base64 string is not present, try to get from globalchat
      if (!input.startsWith("data:image")) {
        const userId = senderId;
        if (userId && globalchat[userId] && globalchat[userId].base64String) {
          input = globalchat[userId].base64String;
        }
      }

      try {
        // Check if input is base64 image string (simple check)
        const isBase64Image = input.startsWith("data:image");

        let response;
        if (isBase64Image) {
          response = await invokeNvidiaApi("", input, senderId);
        } else {
          response = await invokeNvidiaApi(input, undefined, senderId);
        }

        let responseText = response.choices?.[0]?.message?.content || JSON.stringify(response);
        const rawInput = responseText.trim();
        const cleanedJsonString = rawInput.replace(/^```json\s*|\s*```$/g, '');
        responseText = isSlashEndpoint? JSON.parse(cleanedJsonString).response : responseText;
        const truncatedText =
          responseText.length > 4096 ? responseText.substring(0, 4093) + "..." : responseText;

        if (!voiceToggle && msgToBeEditedId) {
          
         const html = converter.makeHtml(truncatedText);
        //  console.log("html",html)
          await client.editMessage(chat, {
            message: msgToBeEditedId,
            text: html,
            replyTo: msgId,
            parseMode: "html",
          });
        } else if (voiceToggle && msgToBeEditedId) {
          const audio = await axios.post(process.env.N8N_AUDIO_WEBHOOK, { message: truncatedText });
          const audioUrl = audio?.data[0]?.url;
          if (audioUrl) {
            queueRequest(replyWithAudio, chat, msgToBeEditedId, msgId, truncatedText, audioUrl);
          }
        } else {
          return responseText
        }
      } catch (error) {
        if (msgToBeEditedId) {
          await client.editMessage(chat, {
            message: msgToBeEditedId,
            text: "Error processing Nvidia API request. Please check the input and try again.",
            replyTo: msgId,
          });
        }
      }
    }
  } catch (err) {
    // Inform the user about the error
    if (msgToBeEditedId && err.code === 429) {
      await client.editMessage(chat, {
        message: msgToBeEditedId,
        text: "Too many requests, try again after a few seconds",
      });
    } else if (chat && msgId) {
      await client.sendMessage(chat, {
        message: "Some error occurred...",
        replyTo: msgId,
      });
    }
    console.error("Error in gemini function:", err);
  }
}
