import { client } from "../../client-init.js";
import { Button } from "telegram/tl/custom/button.js";
import { CallbackQuery } from "telegram/events/CallbackQuery.js";
import { Api } from "telegram";

// Global variable to hold all btn-related data
const globalchat = {};

export async function replyWithUserId(chat, msgId, message, fwdFrom) {
  const fwdId = fwdFrom?.fromId?.userId
  try {
    // console.log(chat)
    if (!fwdFrom) {
      const msgText = `Your userid is <code>${message.senderId}</code>`;
      await client.sendMessage(chat, {
        message: msgText,
        replyTo: msgId,
        parseMode: "md2",
      });
    } else {
      const msgText = fwdId? `Forwarded message userid: <code>${fwdId}</code> \n[Link to his/her profile](tg://openmessage?user_id=${fwdId}) \nProfile will only open in case you have intercated or visited user profile at least once in a group or using direct messages or whatever.` : `Userid is hidden by user. \nBut you can still get that id using unoffical Telegram apps like Telegraph or using userbots.`;
      await client.sendMessage(chat, {
        message: msgText,
        replyTo: msgId,
        parseMode: "md2",
      });
      globalchat[userId].initialMsgId = forwardMessage.id;
    }
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

export async function replyWithStart(chat, msgId, message, sender) {
  try {
    const msgText = "Hey there welcome! \nUse /help for commands";
    await client.sendMessage(chat, { message: msgText, replyTo: msgId });
  } catch (error) {
    console.error("Error occurred while replying with message:", error);
  }
}

export async function replyWithHelp(chat, msgId, message, userId) {
  globalchat[userId] = {
    chatId: chat.chatId,
    message,
    msgId,
    chat,
    initialMsgId: null, // Initialize initialMsgId here
  };
  const buttons = [
    [
      Button.inline("AI Chatbot", Buffer.from(`ai-chatbot|${userId}`)),
      Button.inline("Random Gifs", Buffer.from(`random-gifs|${userId}`)),
    ],

    [Button.inline("Image Generator", Buffer.from(`image-gen|${userId}`))],
    [Button.inline("Song Downloader", Buffer.from(`song|${userId}`))],
    [
      Button.inline("Userid", Buffer.from(`userid|${userId}`)),
      Button.inline("Uptime & Ping", Buffer.from(`ping|${userId}`)),
    ],
    [
      Button.inline("Other", Buffer.from(`other|${userId}`)),
      Button.inline("Lyrics", Buffer.from(`lyrics|${userId}`)),
    ],
  ];

  // Send a message with buttons to the user
  const initialMsg = await client.sendMessage(chat, {
    message: `<pre>Choose your option:</pre>
    `,
    replyTo: msgId,
    buttons: buttons,
    parseMode: "md2",
  });
}

client.addEventHandler(ButtonHandler, new CallbackQuery({}));

// Callback handler for button clicks
export async function ButtonHandler(event) {
  // Get the userId from the event (user who clicked the button)
  const clickedUserId = event.query.userId;
  const callbackData = event.query.data.toString("utf-8").trim(); // Get the callback data
  const callbackQueryId = event.query.queryId;
  // // Access chat and msgId from globalchat
  const chat = globalchat[clickedUserId]?.chat || event.query.peer.userId;
  const msgId = globalchat[clickedUserId]?.msgId;

  // Split the callback data to get the action and original userId
  const [action, originalUserId] = callbackData.split("|");

  // Ensure that only the user who initiated the process can click the button
  if (clickedUserId.toString() !== originalUserId.toString()) {
    // Send a message back to the chat if the user is not the one who initiated
    await client.invoke(
      new Api.messages.SetBotCallbackAnswer({
        queryId: callbackQueryId, // Use the query ID from event
        message: "Your are not the one who initiated this message",
        alert: true, // Show as an alert popup
      })
    );

    return; // Return early if the clicked user is different
  }

  console.log("Callback data received:", action);

  // Retrieve the message using the originalUserId from globalchat
  const message = globalchat[originalUserId]?.message;
  console.log("Message retrieved:", message);
  console.log("Action is: " + action);
  switch (action) {
    case "ai-chatbot":
      console.log("ai-chatbot button clicked");
      await client.invoke(
        new Api.messages.SetBotCallbackAnswer({
          queryId: callbackQueryId,
          message:
            "There are 2 ways to ask in any language: \n1. /ask What is the capital of India  \n2. Replying to bot messages will also work. \n\n\n If u got any error like too many requests then please try again.",
          alert: true,
        })
      );
      break;
    case "random-gifs":
      console.log("random gifs button clicked");
      await client.invoke(
        new Api.messages.SetBotCallbackAnswer({
          queryId: callbackQueryId,
          message:
            "Use command /gif \nThis command doesn't need any extra query to be passed , this will generate a random gif",
          alert: true,
        })
      );
      break;
    case "image-gen":
      console.log("image-gen button clicked");
      await client.invoke(
        new Api.messages.SetBotCallbackAnswer({
          queryId: callbackQueryId,
          message:
            "Use /gen command with query params: \ne.g. /gen a cat \nDisclaimer: There is no image censorship filters in Schnell and Replicate model , so it might generate some inappropriate things.",
          alert: true,
        })
      );
      break;
    case "ping":
      console.log("image-gen button clicked");
      await client.invoke(
        new Api.messages.SetBotCallbackAnswer({
          queryId: callbackQueryId,
          message:
            "Use /ping command to check server uptime and response time.",
          alert: true,
        })
      );
      break;
    case "userid":
      console.log("image-gen button clicked");
      await client.invoke(
        new Api.messages.SetBotCallbackAnswer({
          queryId: callbackQueryId,
          message: "1. Use /userid command to get your userid. \n2. Forward any user message directly to bot",
          alert: true,
        })
      );
      break;
    case "song":
      console.log("image-gen button clicked");
      await client.invoke(
        new Api.messages.SetBotCallbackAnswer({
          queryId: callbackQueryId,
          message:
            "Use /song command with query params \n\ne.g. /song angrezi beat yo yo honey \n\nThis will send you mp3 file of that song directly from youtube. \n\nNote: Sometimes it can take 10-15 seconds.",
          alert: true,
        })
      );
      break;
    case "lyrics":
      console.log("image-gen button clicked");
      await client.invoke(
        new Api.messages.SetBotCallbackAnswer({
          queryId: callbackQueryId,
          message:
            "Use /lyrics command with query params \n\ne.g. /lyrics song_name by artist_name \n\nNote: Regional songs are not supported",
          alert: true,
        })
      );
      break;
    case "other":
      console.log("image-gen button clicked");
      await client.invoke(
        new Api.messages.SetBotCallbackAnswer({
          queryId: callbackQueryId,
          message:
            "This bot also sends all my instagram reels from my dm to my telegram channel. (Not for public use as of now) \nOther cmds are: \n1. /about  \n2. /stop secret_password",
          alert: true,
        })
      );
      break;

    // default:
    //   console.log("Unknown callback data:", callbackData);
    //   // await client.sendMessage(chat, {
    //   //   message: "Unknown button clicked. Please try again.",
    //   //   replyTo: msgId,
    //   // });
    //   break;
  }
}
