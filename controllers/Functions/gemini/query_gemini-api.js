import { createRequire } from "module"
const require = createRequire(import.meta.url)

const path = require("path")
const dotenv = require("dotenv")
dotenv.config({ path: path.resolve(".env") })



import { client } from "../../../client.js";
import handleGeminiQuery from "./gemini.js";



export async function gemini(chat, msgId, messageText) {
  // Remove the query prefix
  const newString = messageText.replace("q ", "");

  try {
    // Inform the user about the search process
    const msgToBeEdited = await client.sendMessage(chat, {
      message: `Searching... Please wait a few seconds.`,
      replyTo: msgId
    });
    const msgToBeEditedId = msgToBeEdited.id;

    // Define the filter text
    const filterText =process.env.FILTERED_TEXT_GEMINI;

    // Handle the Gemini query
    const data = handleGeminiQuery(filterText + newString)
      .then((data) => {
        // Update the message with the search result
        client.editMessage(chat, {
          message: msgToBeEditedId,
          text: data.toString(),
          replyTo: msgId
        });
      })
      .catch((err) => {
        // Inform the user about the error
        client.sendMessage(chat, {
          message: "Please perform a valid search. This won't work here. 😤😤",
          replyTo: msgId
        });
      });
  } catch (err) {
    // Inform the user about the error
    client.sendMessage(chat, {
      message: "Some error occurred...",
      replyTo: msgId
    });
  }
}
