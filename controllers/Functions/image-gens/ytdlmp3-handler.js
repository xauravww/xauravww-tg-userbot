import { client } from "../../../client-init.js";
import { Button } from "telegram/tl/custom/button.js";
import { CallbackQuery } from "telegram/events/CallbackQuery.js";
import { Api } from "telegram";
import { songDownloader } from "../yt2mp3/song.js";

// Global object to store user session data for the ytdlmp3 flow
const globalchat = {};

// Step 1: Call this to register and show button
export async function replyWithYtdlDownloadButtons(chat, msgId, message, userId) {
  globalchat[userId] = {
    chatId: chat.chatId,
    message,
    msgId,
    chat,
    initialMsgId: null,
  };

  const buttons = [
    [Button.inline("Yes Download MP3", Buffer.from(`yes-ytdlmp3|${userId}`))]
  ];

  const initialMsg = await client.sendMessage(chat, {
    message: `<pre>Do you want to download this song as MP3?</pre>`,
    replyTo: msgId,
    buttons,
    parseMode: "md2",
  });

  globalchat[userId].initialMsgId = initialMsg.id;
}

// Step 2: This is automatically triggered by Telegram for all button clicks
client.addEventHandler(ButtonHandler, new CallbackQuery({}));

// Button click handler
export async function ButtonHandler(event) {
  const clickedUserId = event.query.userId;
  if (!clickedUserId) return;

  const callbackData = event.query.data.toString("utf-8").trim();
  const callbackQueryId = event.query.queryId;

  const [action, originalUserId] = callbackData.split("|");
  if (!originalUserId && action) return;

  const chat = globalchat[clickedUserId]?.chat || event.query?.peer?.userId;
  const msgId = globalchat[clickedUserId]?.msgId;

  // Ensure user is same as original
  if (clickedUserId.toString() !== originalUserId.toString()) {
    await client.invoke(
      new Api.messages.SetBotCallbackAnswer({
        queryId: callbackQueryId,
        message: "You're not the one who initiated this message.",
        alert: true,
      })
    );
    return;
  }

  const message = globalchat[originalUserId]?.message;

  switch (action) {
    case "yes-ytdlmp3":
      if (!chat || !msgId || !message) return;

      await client.editMessage(chat, {
        message: globalchat[originalUserId].initialMsgId,
        text: "🔁 Preparing your song request...",
      });

      await songDownloader(chat, msgId, message);
      break;
  }
}
