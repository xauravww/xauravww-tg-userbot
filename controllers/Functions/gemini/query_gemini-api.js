import { client } from "../../../client-init.js";
import handleGeminiQuery from "./gemini.js";
import { replyWithAudio } from "../miscellaneous.js";
import axios from "axios";
import { queueRequest } from "../../msgs.js";
import { getGlobalValue } from "../../utils/global-context.js";

export async function gemini(chat, msgId, messageText, senderId) {
  // Remove the query prefix
  const newString = messageText.replace("ask ", "");
  const voiceToggle = getGlobalValue("voice_toggle")
  const loadingtext = voiceToggle? "🙊Speaking •၊၊||၊|။||||။၊|။• Hold On.." : "✎Typing •၊၊||၊|။||||။၊|။•";
  let msgToBeEditedId;
  try {
    // Inform the user about the search process
    let msgToBeEdited = await client.sendMessage(chat, {
      message: loadingtext,
      replyTo: msgId,
    });
    msgToBeEditedId = msgToBeEdited.id;

    // Define the filter text
    const filterText = process.env.SYSTEM_INSTRUCTIONS_GEMINI;

    // Handle the Gemini query
    const {html, responseText} = await handleGeminiQuery(filterText + "My Question: " + newString, senderId);

    // Update the message with the search result
    const truncatedText = responseText?.toString()?.length > 4096 ? responseText?.substring(0, 4093) + "..." : responseText?.toString();
    const truncatedHtml = html?.toString()?.length > 4096 ? html?.substring(0, 4093) + "..." : html?.toString();
    // const formattedText = `${truncatedText}`;
    const formattedHtml = `${truncatedHtml}`;

   

  if(!voiceToggle){
      // Edit the message with the formatted text
      await client.editMessage(chat, {
        message: msgToBeEditedId,
        text: formattedHtml,
        replyTo: msgId,
        parseMode: "html",
      });
  }else{
    // Log the audio URL (if available) and reply with audio
    const audio = await axios.post(process.env.N8N_AUDIO_WEBHOOK, { message: truncatedText }) 
    console.log("Audio: ", audio?.data[0]?.url);
    console.log("truncatedText: ", truncatedText);
    const audioUrl = audio?.data[0]?.url;
    if (audioUrl) {
      queueRequest(replyWithAudio, chat, msgToBeEditedId, msgId, truncatedText, audioUrl);
    }
  }



    
  } catch (err) {
    // Inform the user about the error
    if (msgToBeEditedId && err.code === 429) {
      await client.editMessage(chat, {
        message: msgToBeEditedId,
        text: "Too many requests, try again after a few seconds",
      });
    } else {
      await client.sendMessage(chat, {
        message: "Some error occurred...",
        replyTo: msgId,
      });
    }
    console.error("Error in gemini function:", err);
  }
}