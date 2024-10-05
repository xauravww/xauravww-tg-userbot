import { client } from "../../../client.js";
import path from "path";
import { fileURLToPath } from "url";
import { Button } from "telegram/tl/custom/button.js";
import { CallbackQuery } from "telegram/events/CallbackQuery.js";
import { generateImage3 } from "./flux-schnell-gen.js";
import {
  setMessageData,
  getMessageData,
  deleteMessageData,
} from "../../utils/localStorageUtils.js";
import { genImage2 } from "./speed-gen.js";
import { genImage4 } from "./replicate-gen.js";
import { genImage5 } from "./flux-koda-gen.js";

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
      Button.inline("Schnell Gen (fast + good quality)", Buffer.from(`flux-schnell|${userId}`)),
      Button.inline("Speed Gen (fastest + med quality)", Buffer.from(`speed-gen|${userId}`)),
      Button.inline("Replicate Gen (med + best quality)", Buffer.from(`replicate-gen|${userId}`)),
    ],
  ];

  // Send a message with buttons to the user
  const initialMsg = await client.sendMessage(chat, {
    message: "Please choose an image generation model:",
    replyTo: msgId,
    buttons: buttons,
  });
  
  // Update initialMsgId in globalchat
  globalchat[userId].initialMsgId = initialMsg.id;
  setMessageData(userId, initialMsg.id);
}

// Add the button callback handler for the image generation buttons
client.addEventHandler(ButtonHandler, new CallbackQuery({}));

// Callback handler for button clicks
async function ButtonHandler(event) {
  const userId = event.query.userId;
  const callbackData = event.query.data.toString("utf-8").trim(); // Get the callback data

  // Access chat and msgId from globalchat
  const chat = globalchat[userId]?.chat || event.query.peer.userId;
  const msgId = globalchat[userId]?.msgId;

  // Split the callback data to get the action and userId
  const [action, callbackUserId] = callbackData.split("|");

  console.log("Callback data received:", action);

  // Retrieve the message using the userId from globalchat
  const message = globalchat[userId]?.message;
  console.log("Message retrieved:", message);

  switch (action) {
    case "flux-schnell":
      console.log("flux-schnell button clicked");
      await generateImage3(
        userId,
        chat,
        msgId,
        message.replace(/\/gen/, ""),
        process.env.FLUX_SCHNELL_API_MODEL_SUFFIX,
        parseInt(globalchat[userId]?.initialMsgId) 
      );
      deleteMessageData(callbackUserId);
      break;
      
    case "speed-gen":
      console.log("speed-gen button clicked");
      await genImage2(
        userId,
        chat,
        msgId,
        message.replace(/\/gen/, ""),
        parseInt(globalchat[userId]?.initialMsgId) // Accessing initialMsgId
      );
      console.log("🍺 ~ buttons-image-gens.js:93 -> userId: ", userId, chat, msgId, message.replace(/\/ben3/, ""), parseInt(globalchat[userId]?.initialMsgId));
      deleteMessageData(callbackUserId);
      break;

    case "replicate-gen":
      console.log("replicate-gen");
      await genImage4(
        userId,
        chat,
        msgId,
        message.replace(/\/gen/, ""),
        parseInt(globalchat[userId]?.initialMsgId) 
      );
      deleteMessageData(callbackUserId);
      break;

    case "koda-gen":
      console.log("koda-gen");
      await genImage5(
        userId,
        chat,
        msgId,
        message.replace(/\/gen/, ""),
        parseInt(globalchat[userId]?.initialMsgId) 
      );
      deleteMessageData(callbackUserId);
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
