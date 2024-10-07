import { client } from "../../../client-init.js";
import path from "path";
import { fileURLToPath } from "url";
import { Button } from "telegram/tl/custom/button.js";
import { CallbackQuery } from "telegram/events/CallbackQuery.js";
import { generateImage3 } from "./flux-schnell-gen.js";
import {
  getvalueData,
  setvalueData,
  deletevalueData,
} from "../../utils/localStorageUtils.js";
import { genImage2 } from "./speed-gen.js";
import { genImage4 } from "./replicate-gen.js";

import { Api } from "telegram";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Global variable to hold all chat-related data
const globalchat = {};

// Function to initiate the image generation process with buttons
export async function genButtons(userId, chat, msgId, message) {
  console.log("🎉 ~ buttons-image-gens.js:23 -> userId, chat, msgId, message: ", userId, chat, msgId, message);
  
  // Store data in the globalchat variable
  globalchat[userId] = {
    chatId: chat.chatId,
    message,
    msgId,
    chat,
    initialMsgId: null, // Initialize initialMsgId here
  };

  // Create buttons with a reference to the stored userId
  const buttons = [
    [
      Button.inline("Schnell Gen", Buffer.from(`flux-schnell|${userId}`)),
      Button.inline("Speed Gen", Buffer.from(`speed-gen|${userId}`)),
    ],
    [ Button.inline("Replicate Gen", Buffer.from(`replicate-gen|${userId}`))]
  ];

  // Send a message with buttons to the user
  const initialMsg = await client.sendMessage(chat, {
    message: `Please choose an image generation model: 
    <pre>Schnell Gen (fast + good quality)</pre>
    <pre>Speed Gen (fastest + med quality)</pre>
    <pre>Replicate Gen (med + best quality)</pre>`,
    replyTo: msgId,
    buttons: buttons,
    parseMode: "md2",
  });
  
  // Update initialMsgId in globalchat
  globalchat[userId].initialMsgId = initialMsg.id;
  // setvalueData(userId, initialMsg.id);
}

// Add the button callback handler for the image generation buttons
client.addEventHandler(ButtonHandler, new CallbackQuery({}));

// Callback handler for button clicks
async function ButtonHandler(event) {
  // Get the userId from the event (user who clicked the button)
  const clickedUserId = event.query.userId; 
  const callbackData = event.query.data.toString("utf-8").trim(); // Get the callback data
  const callbackQueryId = event.query.queryId;
  // Access chat and msgId from globalchat
  const chat = globalchat[clickedUserId]?.chat || event.query.peer.userId;
  const msgId = globalchat[clickedUserId]?.msgId;

  // Split the callback data to get the action and original userId
  const [action, originalUserId] = callbackData.split("|");

  // Ensure that only the user who initiated the process can click the button
  if (clickedUserId.toString() !== originalUserId.toString()) {
    // Send a message back to the chat if the user is not the one who initiated
    await client.invoke(new Api.messages.SetBotCallbackAnswer({
      queryId: callbackQueryId, // Use the query ID from event
      message: "Your are not the one who initiated this message",
      alert: true, // Show as an alert popup
    }));
    

    return;  // Return early if the clicked user is different
  }

  console.log("Callback data received:", action);

  // Retrieve the message using the originalUserId from globalchat
  const message = globalchat[originalUserId]?.message;
  console.log("Message retrieved:", message);

  switch (action) {
    case "flux-schnell":
      console.log("flux-schnell button clicked");
      await generateImage3(
        originalUserId,
        chat,
        msgId,
        message.replace(/\/gen/, ""),
        process.env.FLUX_SCHNELL_API_MODEL_SUFFIX,
        parseInt(globalchat[originalUserId]?.initialMsgId)
      );
      break;
      
    case "speed-gen":
      console.log("speed-gen button clicked");
      await genImage2(
        originalUserId,
        chat,
        msgId,
        message.replace(/\/gen/, ""),
        parseInt(globalchat[originalUserId]?.initialMsgId)
      );
      break;

    case "replicate-gen":
      console.log("replicate-gen button clicked");
      await genImage4(
        originalUserId,
        chat,
        msgId,
        message.replace(/\/gen/, ""),
        parseInt(globalchat[originalUserId]?.initialMsgId)
      );
      break;

    default:
      console.log("Unknown callback data:", callbackData);
      await client.sendMessage(chat, {
        message: "Unknown button clicked. Please try again.",
        replyTo: msgId,
      });
      break;
  }
}
