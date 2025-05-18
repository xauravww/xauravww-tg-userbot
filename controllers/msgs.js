// Import necessary modules
import { createRequire } from "module";
const require = createRequire(import.meta.url);

import debounce from 'debounce';

import { client, connectClient, startSeconds } from "../client-init.js";
import { replyWithPing } from "./Functions/ping.js";
import { stopServer } from "./Functions/crash.js";
import { replyWithRandomGif } from "./Functions/gifs.js";
import { replyWithFun, replyWithUserId, replyWithAbout, replyWithStart, replyWithHelp, replyWithAudio } from "./Functions/miscellaneous.js";
import { gemini } from "./Functions/gemini/query_gemini-api.js";
import { lyricsFinder } from "./Functions/lyrics.js";
import { genButtons } from "./Functions/image-gens/buttons-image-gens.js";
import { songDownloader } from "./Functions/yt2mp3/song.js";
import { replyWithGlobalMenu } from "./Functions/global-settings-menu.js";
import { handleBtnsMediaHandler, handleImage, handleVideo, handleFeed } from "./Functions/media-handler.js";
import axios from "axios";

// Queue for incoming events
const queue = [];
let isProcessingQueue = false;

// Function to add a request to the queue
export function queueRequest(func, ...args) {
  queue.push({ func, args });
  processQueue();
}



// Function to process the queue
async function processQueue() {
  if (isProcessingQueue) return;
  isProcessingQueue = true;

  while (queue.length > 0) {
    const { func, args } = queue.shift();
    try {
      await func(...args);  // Execute the function with its arguments
    } catch (error) {
      console.error("Error processing request:", error);
    }
  }

  isProcessingQueue = false;
}

// function  returnSignedPromise(msg,sender){
//   return new Promise((resolve, reject) => {
//     if(msg=="#signed"){
//       resolve(sender.id)
//     }
//   });
// }

// Modify the eventPrint function to be used with the queue
async function eventPrint(event) {
  // // console.log(event);
  // // console.log("event.className",event?.originalUpdate?.className)

  if (!event.message) {
    // console.log("no msg defined for event");
    return;
  }

  const message = event.message;


  const msgID = event.message.id;
  const msgText = message.text.toLowerCase();
  const peerId = event.message.peerId.chatId || event.message.peerId.channelId;
  // // console.log(event)

  const chat = await client.getInputEntity(event.message.peerId);
  const sender = await message.getSender();
  // // console.log("typeof event.message" ,typeof event.message)
  const isVideo = event?.message?.media?.document?.mimeType == "video/mp4" || event?.message?.media?.document?.mimeType == "video/webm"
  const isWebp = event?.message?.media?.document?.mimeType == "image/webp"
  const isNormalPhoto = event?.message?.photo
  const isVoiceOrAudio = event?.message?.media?.document?.mimeType == "audio/mpeg" || event?.message?.media?.document?.mimeType == "audio/ogg"
  const isSenderABot = event?.message?.viaBotId == null
  // // console.log(event?.message?.media?.document?.mimeType)
  // audio/mpeg or audio/ogg
  if (!isVoiceOrAudio && !event.message.photo && !isWebp && !isVideo && (!sender || !sender.id || !chat || !msgID || !msgText || !message)) {
    // console.log("Invalid event data");
    return;
  }

  if (isVoiceOrAudio && isSenderABot) {
    queueRequest(handleBtnsMediaHandler, chat, msgID, event.message, isVideo, sender.id, isVoiceOrAudio)
  }


  if ((isNormalPhoto || isWebp || isVideo) && event.message.isPrivate && isSenderABot) {
    queueRequest(handleBtnsMediaHandler, chat, msgID, event.message, isVideo, sender.id, isVoiceOrAudio);
  }


  //will use this for separate messages

  // if (!isVoiceOrAudio && !isNormalPhoto && !isWebp && !isVideo && (event.message.mentioned || (event.message.isPrivate)) && !msgText.startsWith("/")) {
  //   queueRequest(gemini, chat, msgID, msgText, message.senderId);
  // }

  const allCommands = [
    '/feed', '/isign', '/vsign', '/gif', 'gif', '/fun', 'fun', '/ping', 'ping',
    '/userid', 'userid', '/stop', 'stop', '/ask', 'ask', '/gen', '/song',
    '/lyrics', 'lyrics', '/about', 'about', '/start', 'start', '/help', 'help',
    '/set', 'set'
  ];

  // Function to check if the message text starts with any command
  function startsWithAnyCommand(msgText, commands) {
    return commands.some(command => msgText.startsWith(command));
  }

  if (msgText.startsWith("/feed")) {
    queueRequest(handleFeed, msgText.replace("/feed", ""), message, msgID, chat, sender.id);
  }
  if (msgText.startsWith("/isign")) {
    queueRequest(handleImage, msgText.replace("/isign", ""), message, msgID, chat, sender.id);
  }
  if (msgText.startsWith("/vsign")) {
    queueRequest(handleVideo, chat, msgID, message, msgText.replace("/vsign", ""), sender.id);
  }
  if (msgText.startsWith("/gif") || msgText.startsWith("gif")) {
    queueRequest(replyWithRandomGif, chat, msgID);
  }

  if (msgText.startsWith("/fun") || msgText.startsWith("fun")) {
    queueRequest(replyWithFun, chat, msgID, message, sender);
  }

  if (msgText.startsWith("/ping") || msgText.startsWith("ping")) {
    queueRequest(replyWithPing, chat, msgID, startSeconds);
  }

  if (msgText.startsWith("/userid") || msgText.startsWith("userid") || event.message.fwdFrom != null) {
    queueRequest(replyWithUserId, chat, msgID, message, event.message?.fwdFrom);
  }

  if (msgText.startsWith("/stop") || msgText.startsWith("stop")) {
    queueRequest(stopServer, chat, msgID, msgText);
  }

  if (msgText.startsWith("/ask") || msgText.startsWith("ask")) {
    queueRequest(gemini, chat, msgID, msgText);
  }

  if (msgText.startsWith("/gen")) {
    queueRequest(genButtons, sender.id, chat, msgID, msgText);
  }

  if (msgText.startsWith("/song")) {
    queueRequest(songDownloader, chat, msgID, msgText);
  }

  if (msgText.startsWith("/lyrics") || msgText.startsWith("lyrics")) {
    queueRequest(lyricsFinder, chat, msgID, msgText);
  }

  if (msgText.startsWith("/about") || msgText.startsWith("about")) {
    queueRequest(replyWithAbout, chat, msgID, msgText);
  }
  if (msgText.startsWith("/start") || msgText.startsWith("start")) {
    queueRequest(replyWithStart, chat, msgID, msgText);
  }
  if (msgText.startsWith("/help") || msgText.startsWith("help")) {
    queueRequest(replyWithHelp, chat, msgID, msgText, sender.id);
  }
  if (msgText.startsWith("/set") || msgText.startsWith("set")) {
    queueRequest(replyWithGlobalMenu, chat, msgID, msgText, sender.id);
  }
  if (!startsWithAnyCommand(msgText, allCommands)) {
    try {
      //call to n8n
      if(msgText.startsWith("🤫 a whisper has been sent")) return
      const data = await axios.post(process.env.N8N, { message: msgText })
      const flag = data?.data[0]?.endpoint || data?.data?.endpoint
      const translatedMsg = data?.data[0]?.message || data?.data?.message
      const needsDownloading = data?.data[0]?.download || data?.data?.download
      // console.log("flag", data?.data[0]?.endpoint)

      if (flag == "/help") {
        queueRequest(replyWithHelp, chat, msgID, msgText, sender.id);
      }
      else if (flag == "/about") {
        queueRequest(replyWithAbout, chat, msgID, msgText);
      }
      else if (flag == "/start") {
        queueRequest(replyWithStart, chat, msgID, msgText);
      }
      else if (flag == "/set") {
        queueRequest(replyWithGlobalMenu, chat, msgID, msgText, sender.id);
      }
      else if (flag == "/gen") {
        queueRequest(genButtons, sender.id, chat, msgID, translatedMsg || msgText);
      }
      else if (flag == "/song" && needsDownloading) {
        queueRequest(songDownloader, chat, msgID, msgText);
      }
      else if (flag == "/lyrics") {
        queueRequest(lyricsFinder, chat, msgID, msgText);
      }
      else if (flag == "/stop") {
        queueRequest(stopServer, chat, msgID, msgText);
      }
      else if (flag == "/ask") {
        queueRequest(gemini, chat, msgID, msgText);
      }
      else if (flag == "/userid") {
        queueRequest(replyWithUserId, chat, msgID, message, event.message?.fwdFrom);
      }
      else if (flag == "/ping") {
        queueRequest(replyWithPing, chat, msgID, startSeconds);
      }
      else if (flag == "/gif") {
        queueRequest(replyWithRandomGif, chat, msgID);
      }
      else if (flag == "/fun") {
        queueRequest(replyWithFun, chat, msgID, message, sender);
      }
      else if (flag == "/isign") {
        queueRequest(handleImage, msgText.replace("/isign", ""), message, msgID, chat, sender.id);
      }
      else if (flag == "/vsign") {
        queueRequest(handleVideo, chat, msgID, message, msgText.replace("/vsign", ""), sender.id);
      }
      else if (flag == "/feed") {
        queueRequest(handleFeed, msgText.replace("/feed", ""), message, msgID, chat, sender.id);
      }
      else {
        queueRequest(gemini, chat, msgID, msgText, message.senderId);
        // // console.log("Invalid flag from N8N:", flag);
      }
    } catch (error) {
      console.error("Error sending message to N8N:", error);

      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
        console.error("Response headers:", error.response.headers);

        // Check if the response data contains a message
        if (error.response.data && error.response.data.message) {
          console.error("Error message:", error.response.data.message);
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error("No response received:", error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error("Error setting up the request:", error.message);
      }
    }
  }


}

// Debounce the eventPrint function to reduce repetitive requests in quick succession
const debouncedEventPrint = debounce(eventPrint, 500);



export { debouncedEventPrint as eventPrint };
