import { createRequire } from "module"
const require = createRequire(import.meta.url)

const path = require("path")
const dotenv = require("dotenv")
dotenv.config({ path: path.resolve(".env") })



import { client } from "../../../client-init.js";
import handleGeminiQuery from "./gemini.js";



export async function gemini(chat, msgId, messageText,senderId) {
  // Remove the query prefix
  const newString = messageText.replace("ask ", "");
const loadingtext = "✎Typing •၊၊||၊|။||||။၊|။•"
  try {
    // Inform the user about the search process 
    /*
     I will use it if i need loader something
    */
    const msgToBeEdited = await client.sendMessage(chat, {
      message: loadingtext,
      replyTo: msgId
    });
    const msgToBeEditedId = msgToBeEdited.id;

    // Define the filter text
    const filterText =process.env.SYSTEM_INSTRUCTIONS_GEMINI;

    // Handle the Gemini query
    const data = handleGeminiQuery(filterText +"My Question: " + newString,senderId)
      .then((data) => {
        // Update the message with the search result
        const resultText = data.toString();
        const truncatedText = resultText.length > 4096 ? resultText.substring(0, 4093) + "..." : resultText;

        const formattedText = `${truncatedText}`;
        client.editMessage(chat, {
          message: msgToBeEditedId,
          text:formattedText,
          replyTo: msgId,
          parseMode:"html"
        });
        
      })
      .catch((err) => {
        // Inform the user about the error
        if(msgToBeEditedId && err.code === 429){
          client.editMessage(chat, {
            message: msgToBeEditedId,
            text:"Too may requests, try again after few seconds",
          });
        }
      });
  } catch (err) {
    // Inform the user about the error
    client.sendMessage(chat, {
      message: "Some error occurred...",
      replyTo: msgId
    });
  }
}
