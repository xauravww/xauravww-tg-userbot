import { client } from "../../client-init.js";

export async function replyWithUserId(chat, msgId, message) {
  try {
    const msgText = `hi your userid is ${message.senderId}`;
    await client.sendMessage(chat, { message: msgText, replyTo: msgId });
  } catch (error) {
    console.error("Error occurred while replying with user id:", error);
  }
}

export async function replyWithFun(chat, msgId, message, sender) {
  try {
    const msgText = `Munni Badnaam Huyi ${sender.firstName} tere liye 🥺`;
    await client.sendMessage(chat, { message: msgText, replyTo: msgId });
  } catch (error) {
    console.error("Error occurred while replying with fun message:", error);
  }
}
export async function replyWithAbout(chat, msgId, message, sender) {
  try {
    const msgText = process.env.BOT_STATUS_MESSAGE || "No info available...";
    await client.sendMessage(chat, { message: msgText, replyTo: msgId });
  } catch (error) {
    console.error("Error occurred while replying with message:", error);
  }
}