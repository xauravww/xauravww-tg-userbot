// Import necessary modules
import { createRequire } from "module";
const require = createRequire(import.meta.url);

import debounce from 'debounce';

import { client, connectClient, startSeconds } from "../client-init.js";
import { replyWithPing } from "./Functions/ping.js";
import { stopServer } from "./Functions/crash.js";
import { replyWithRandomGif } from "./Functions/gifs.js";
import { replyWithFun, replyWithUserId, replyWithAbout,replyWithStart, replyWithHelp } from "./Functions/miscellaneous.js";
import { gemini } from "./Functions/gemini/query_gemini-api.js";
import { lyricsFinder } from "./Functions/lyrics.js";
import { genButtons } from "./Functions/image-gens/buttons-image-gens.js";
import { songDownloader } from "./Functions/yt2mp3/song.js";
import { replyWithGlobalMenu } from "./Functions/global-settings-menu.js";
import { handleBtnsMediaHandler, handleImage ,handleVideo } from "./Functions/media-handler.js";
import { Api } from "telegram";
import { setvalueData } from "./utils/localStorageUtils.js";

// Queue for incoming events
const queue = [];
let isProcessingQueue = false;

// Function to add a request to the queue
function queueRequest(func, ...args) {
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
  const message = event.message;
  

  const msgID = event.message.id;
  const msgText = message.text.toLowerCase();
  const peerId = event.message.peerId.chatId || event.message.peerId.channelId;
  // console.log(event)

  const chat = await client.getInputEntity(event.message.peerId);
  const sender = await message.getSender();
// console.log("typeof event.message" ,typeof event.message)
console.log("mimeType" ,event?.message?.media?.document?.mimeType)
const isVideo = event?.message?.media?.document?.mimeType=="video/mp4" || "video/webm"
const isWebp = event?.message?.media?.document?.mimeType=="image/webp"
const isNormalPhoto = event?.message?.photo
  if (!event.message.photo && !isWebp && !isVideo && (!sender || !sender.id || !chat || !msgID || !msgText || !message)) {
    console.log("Invalid event data");
    return;
  }
//You reply bot with img

  if((isNormalPhoto || isWebp || isVideo)&& event.message.isPrivate && !msgText.startsWith("/")){
    queueRequest(handleBtnsMediaHandler, chat, msgID,event.message,isVideo,sender.id);
  }

  

  if (!isNormalPhoto && !isWebp && !isVideo && (event.message.mentioned || (event.message.isPrivate)) && !msgText.startsWith("/")) {
    queueRequest(gemini, chat, msgID, msgText, message.senderId);
  }


  if (msgText.startsWith("/isign")) {
    queueRequest(handleImage, msgText.replace("/isign",""),message,msgID,chat,sender.id);
  }
  if (msgText.startsWith("/vsign")) {
    queueRequest(handleVideo,chat, msgID,message,msgText.replace("/vsign",""),sender.id);
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

  if (msgText.startsWith("/userid") || msgText.startsWith("userid") || event.message.fwdFrom!=null) {
    queueRequest(replyWithUserId, chat, msgID, message,event.message?.fwdFrom);
  }

  if (msgText.startsWith("/stop") || msgText.startsWith("stop")) {
    queueRequest(stopServer, chat, msgID, msgText);
  }

  if (msgText.startsWith("/ask") || msgText.startsWith("ask")) {
    queueRequest(gemini, chat, msgID, msgText);
  }

  if (msgText.startsWith("/gen")) {
    console.log(msgText);
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
    queueRequest(replyWithHelp, chat, msgID, msgText,sender.id);
  }
  if (msgText.startsWith("/set") || msgText.startsWith("set")) {
    queueRequest(replyWithGlobalMenu, chat, msgID, msgText,sender.id);
  }


}

// Debounce the eventPrint function to reduce repetitive requests in quick succession
const debouncedEventPrint = debounce(eventPrint, 500);



export { debouncedEventPrint as eventPrint };
