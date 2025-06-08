import { client } from "../../client-init.js";
import { Button } from "telegram/tl/custom/button.js";
import { CallbackQuery } from "telegram/events/CallbackQuery.js";
import { Api } from "telegram";

import fs from 'fs';
import path from 'path';
import axios from 'axios';
import showdown from "showdown";
const converter = new showdown.Converter()

// Global variable to hold all btn-related data
const globalchat = {};

export async function replyWithUserId(chat, msgId, message, fwdFrom) {
  const fwdId = fwdFrom?.fromId?.userId
  try {
    // // console.log(chat)
    if (!fwdFrom) {
      const msgText = `Your userid is <code>${message.senderId}</code>`;
      await client.sendMessage(chat, {
        message: msgText,
        replyTo: msgId,
        parseMode: "md2",
      });
    } else {
      const msgText = fwdId ? `Forwarded message userid: <code>${fwdId}</code> \n[Link to his/her profile](tg://openmessage?user_id=${fwdId}) \nProfile will only open in case you have interacted or visited user profile at least once in a group or using direct messages or whatever.` : `Userid is hidden by user. \nBut you can still get that id using unoffical Telegram apps like Telegraph or using userbots.`;
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
export async function replyWithCustomMessage(chat, msgToBeEditedId,msgId, message) {
  try {
    // const rawInput = message.trim();
    // const cleanedJsonString = rawInput.replace(/^```json\s*|\s*```$/g, '');
    // const response = JSON.parse(cleanedJsonString).response
    const html = converter.makeHtml(message);
    await client.editMessage(chat, { text:html,message:msgToBeEditedId, replyTo: msgId ,parseMode:"html" });
  } catch (error) {
    console.error("Error occurred while replying with message:", error);
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



export async function replyWithAudio(chat, msgToBeEditedId, msgId, message, audioUrl) {
  try {
    // Remove the unnecessary segment from the URL
    const correctedUrl = audioUrl.replace("/call/g/gradio_api", "");
    console.log("correctedUrl", correctedUrl);

    // Create the temp_audio folder if it doesn't exist
    const tempFolder = path.join(process.cwd(), 'temp_audio');
    if (!fs.existsSync(tempFolder)) {
      fs.mkdirSync(tempFolder, { recursive: true });
    }

    // Define the audio file path
    const fileName = `audio_${Date.now()}.mp3`;
    const filePath = path.join(tempFolder, fileName);

    // Download the audio file
    const response = await axios({
      url: correctedUrl,
      method: 'GET',
      responseType: 'stream',
    });

    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    // Send the downloaded file
    // await client.sendFile(chat, { file: filePath, replyTo: msgId, caption: message });
    await client.deleteMessages(chat, [msgToBeEditedId], { revoke: true });
    await client.sendFile(chat, { file: filePath, replyTo: msgId, caption: message || "" });
    // Delete the file after sending
    fs.unlink(filePath, (err) => {
      if (err) console.error("Error deleting file:", err);
      else console.log("File deleted successfully:", filePath);
    });
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
    [Button.inline("Inline Queries", Buffer.from(`inline-queries|${userId}`))],
    [
      Button.inline("Userid", Buffer.from(`userid|${userId}`)),
      Button.inline("Uptime & Ping", Buffer.from(`ping|${userId}`)),
    ],
    [
      Button.inline("Other", Buffer.from(`other|${userId}`)),
      Button.inline("Lyrics", Buffer.from(`lyrics|${userId}`)),
    ],
    [
      Button.inline("Sign Image", Buffer.from(`i-sign|${userId}`)),
      Button.inline("Sign Video", Buffer.from(`v-sign|${userId}`)),
    ],
    [Button.inline("Whisper Bot", Buffer.from(`whisper-bot|${userId}`))],
  ];


  // Send a message with buttons to the user
  const initialMsg = await client.sendMessage(chat, {
    message: `<pre>Choose your option:</pre>
Use the buttons below to get help on each feature. For commands like /gen, /song, /lyrics, please provide a query after the command. For example:
/gen a cat
/song angrezi beat
/lyrics song_name by artist_name

For inline queries, you can use the bot inline mode to search audio or send private whispers.
For whisper bot, use the format: <secret-msg> @recipient or <secret> <user_id>
Use /cgender to toggle your bot's gender (male/female).
`,
    replyTo: msgId,
    buttons: buttons,
    parseMode: "md2",
  });
  globalchat[userId].initialMsgId = initialMsg?.id
}







client.addEventHandler(ButtonHandler, new CallbackQuery({}));

// Callback handler for button clicks
export async function ButtonHandler(event) {
  // Get the userId from the event (user who clicked the button)
  const clickedUserId = event.query.userId;
  if (!clickedUserId) return
  const callbackData = event.query.data.toString("utf-8").trim(); // Get the callback data
  const callbackQueryId = event.query.queryId;
  // // Access chat and msgId from globalchat
  const chat = globalchat[clickedUserId]?.chat || event.query?.peer?.userId;
  const msgId = globalchat[clickedUserId]?.msgId;
  const initialMsgId = globalchat[clickedUserId]?.initialMsgId
  // Split the callback data to get the action and original userId
  const [action, originalUserId] = callbackData.split("|");
  if (!originalUserId && action) return

  const buttons = [
    [
      Button.inline("AI Chatbot", Buffer.from(`ai-chatbot|${clickedUserId}`)),
      Button.inline("Random Gifs", Buffer.from(`random-gifs|${clickedUserId}`)),
    ],

    [Button.inline("Image Generator", Buffer.from(`image-gen|${clickedUserId}`))],
    [Button.inline("Song Downloader", Buffer.from(`song|${clickedUserId}`))],
    [
      Button.inline("Userid", Buffer.from(`userid|${clickedUserId}`)),
      Button.inline("Uptime & Ping", Buffer.from(`ping|${clickedUserId}`)),
    ],
    [
      Button.inline("Other", Buffer.from(`other|${clickedUserId}`)),
      Button.inline("Lyrics", Buffer.from(`lyrics|${clickedUserId}`)),
    ],
    [
      Button.inline("Sign Image", Buffer.from(`i-sign|${clickedUserId}`)),
      Button.inline("Sign Video", Buffer.from(`v-sign|${clickedUserId}`)),
    ],
  ];

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

  // console.log("Callback data received:", action);

  // Retrieve the message using the originalUserId from globalchat
  const message = globalchat[originalUserId]?.message;
  // console.log("Message retrieved:", message);
  // console.log("Action is: " + action);
  switch (action) {
    case "ai-chatbot":
      // console.log("ai-chatbot button clicked");
      await client.editMessage(chat, {
        message: initialMsgId,
        text: `There are 2 ways to ask in any language: \n1. /ask What is the capital of India  \n2. Replying to bot messages will also work. \n\n\n If u got any error like too many requests then please try again.`,
        buttons: [
          Button.inline("Back", Buffer.from(`back|${clickedUserId}`)),
        ],
        parseMode: "md2",
      })
      break;
    case "random-gifs":
      // console.log("random gifs button clicked");
      await client.editMessage(chat, {
        message: initialMsgId,
        text: "Use command /gif \nThis command doesn't need any extra query to be passed , this will generate a random gif",
        buttons: [
          Button.inline("Back", Buffer.from(`back|${clickedUserId}`)),
        ],
        parseMode: "md2",
      })
      break;
    case "image-gen":
      // console.log("image-gen button clicked");
      await client.editMessage(chat, {
        message: initialMsgId,
        text: "Use /gen command with query params: \ne.g. /gen a cat \nDisclaimer: There is no image censorship filters in Schnell and Replicate model , so it might generate some inappropriate things.",
        buttons: [
          Button.inline("Back", Buffer.from(`back|${clickedUserId}`)),
        ],
        parseMode: "md2",
      })
      break;
    case "ping":
      // console.log("image-gen button clicked");
      await client.editMessage(chat, {
        message: initialMsgId,
        text: "Use /ping command to check server uptime and response time.",
        buttons: [
          Button.inline("Back", Buffer.from(`back|${clickedUserId}`)),
        ],
        parseMode: "md2",
      })
      break;
    case "userid":
      // console.log("image-gen button clicked");
      await client.editMessage(chat, {
        message: initialMsgId,
        text: "1. Use /userid command to get your userid. \n2. Forward any user message directly to bot",
        buttons: [
          Button.inline("Back", Buffer.from(`back|${clickedUserId}`)),
        ],
        parseMode: "md2",
      })
      break;
    case "song":
      // console.log("image-gen button clicked");
      await client.editMessage(chat, {
        message: initialMsgId,
        text: "Use /song command with query params \n\ne.g. /song angrezi beat yo yo honey \n\nThis will send you mp3 file of that song directly from youtube. \n\nNote: Sometimes it can take 10-15 seconds.\n\nYou can also send youtube url directly to bot as a message.",
        buttons: [
          Button.inline("Back", Buffer.from(`back|${clickedUserId}`)),
        ],
        parseMode: "md2",
      })
      break;
    case "lyrics":
      // console.log("image-gen button clicked");
      await client.editMessage(chat, {
        message: initialMsgId,
        text: "Use /lyrics command with query params \n\ne.g. /lyrics song_name by artist_name \n\nNote: Regional songs are not supported\n\n😵😵This feature is in maintenance mode",
        buttons: [
          Button.inline("Back", Buffer.from(`back|${clickedUserId}`)),
        ],
        parseMode: "md2",
      })
      break;
    case "i-sign":
      // console.log("img-sign button clicked");
      await client.editMessage(chat, {
        message: initialMsgId,
        text: "Returns sticker file which we can use in @Stickers bot for static stickers\n/isign overlayMsg,color,fontSize\nAll fields are optional\nYou can simply leave blank if you dont want to give specific custom arguments\ne.g. <pre>/isign ,,,100</pre>\n<pre>/isign hello,red,50,100</pre>\n<pre>/isign</pre>\nYou can use any variation you want\nYou can use this in direct message or in any group(having admin rights otherwise it can't access group history and will show unexpected results)\nTry and test any type of color (explained in detail in video sign help) except RGB format",
        buttons: [
          Button.inline("Back", Buffer.from(`back|${clickedUserId}`)),
        ],
        parseMode: "md2",
      })
      break;
    case "v-sign":
      // console.log("video-sign button clicked");
      await client.editMessage(chat, {
        message: initialMsgId,
        text: "Returns webm file which we can use in @Stickers bot for video stickers\n<pre><code>/vsign overlayMsg ,color ,fontSize ,position</code></pre>\nAll fields are optional\nYou can simply leave blank if you dont want to give that custom argument\ne.g. <pre><code>/vsign namastey,,20,100</code></pre>\n<pre><code>/vsign hello,red,20,100</code></pre>\n<pre><code>/vsign</code></pre>\nYou can try out your own variations\nNote: I set a limit of 5MB/upload\nAlso decompresses video and clip it upto 3 seconds for telegram optimized video stickers\nYou can use this in direct message or in any group(having admin rights otherwise it can't access group history and will show unexpected results)\n\nSome popular colors input:\n<pre>black, white, red, green, blue, yellow, cyan, magenta, aqua, fuchsia, gray, lime, maroon, navy, olive, purple, silver, teal or any type of #hex color like #ffffff etc.\nBut RGB color won't work</pre>\n\nPosition can take 2 type of values:\n<pre>1. bottom 50</pre>\n<pre>2. top 50</pre>\nYou can give any value after top or bottom which decides it Y axis position of text overlay.\nPS:Keep it small",
        buttons: [
          Button.inline("Back", Buffer.from(`back|${clickedUserId}`)),
        ],
        parseMode: "md2",
      })
      break;
    case "other":
      // console.log("image-gen button clicked");
      await client.editMessage(chat, {
        message: initialMsgId,
        text: "This bot also sends all my instagram reels from my dm to my telegram channel. (Not for public use as of now) \nOther cmds are: \n1. /about  \n2. /stop secret_password",
        buttons: [
          Button.inline("Back", Buffer.from(`back|${clickedUserId}`)),
        ],
        parseMode: "md2",
      })
      break;
    case "back":
      await client.editMessage(chat, {
        message: initialMsgId,
        text: `<pre>Choose your option:</pre>`,
        buttons: buttons,
        parseMode: "md2",
      })
      break;
    case "inline-queries":
      await client.editMessage(chat, {
        message: initialMsgId,
        text: "Inline Queries let you search audio or send private whispers directly from the chat input.\n\nUse the bot inline mode and type:\n\n1. @funwalabot .audio <search_term> — to search audio\n2.@funwalabot <your secret message> @username or @funwalabot <your secret> @<user_id> — to send a private whisper\n\nExamples:\n.audio never gonna give you up\nI like pancakes @john_doe\nThe code is 1234 @123456789",
        buttons: [
          Button.inline("Back", Buffer.from(`back|${clickedUserId}`)),
        ],
        parseMode: "md2",
      })
      break;
    case "whisper-bot":
      await client.editMessage(chat, {
        message: initialMsgId,
        text: `Whisper Bot allows you to send private messages that only the recipient can reveal.\n\nUse the format:\n<secret-msg> @recipient or <secret> <user_id>\n\nClick the "Reveal Whisper" button to see the message.`,
        buttons: [
          Button.inline("Back", Buffer.from(`back|${clickedUserId}`)),
        ],
        parseMode: "md2",
      })
      break;

    case "inline-queries":
      await client.editMessage(chat, {
        message: initialMsgId,
        text: `Inline Queries allow you to search audio or send private whispers directly from the chat input.\n\nUse the bot inline mode and type:\n1. .audio <search_term> - to search audio\n2. <secret-msg> @recipient or <secret> <user_id> - to send a private whisper\n\nExample:\n.audio hello\nsecret message @username`,
        buttons: [
          Button.inline("Back", Buffer.from(`back|${clickedUserId}`)),
        ],
        parseMode: "md2",
      })
      break;
    case "whisper-bot":
      await client.editMessage(chat, {
        message: initialMsgId,
        text: `Whisper Bot allows you to send private messages that only the recipient can reveal.\n\nUse the format:\n<secret-msg> @recipient or <secret> <user_id>\n\nClick the "Reveal Whisper" button to see the message.`,
        buttons: [
          Button.inline("Back", Buffer.from(`back|${clickedUserId}`)),
        ],
        parseMode: "md2",
      })
      break;
  }
}
