// Import necessary modules
import { createRequire } from "module";
const require = createRequire(import.meta.url);

import debounce from 'debounce';

import { client, connectClient, startSeconds } from "../client.js";
import { replyWithPing } from "./Functions/ping.js";
import { stopServer } from "./Functions/crash.js";
import { replyWithRandomGif } from "./Functions/gifs.js";
import { replyWithFun, replyWithUserId, replyWithAbout } from "./Functions/miscellaneous.js";
import { gemini } from "./Functions/gemini/query_gemini-api.js";
import { lyricsFinder } from "./Functions/lyrics.js";
import { genButtons } from "./Functions/image-gens/buttons-image-gens.js";
import { songDownloader } from "./Functions/yt2mp3/song.js";

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

// Modify the eventPrint function to be used with the queue
async function eventPrint(event) {
  const message = event.message;
  const msgID = event.message.id;
  const msgText = message.text.toLowerCase();
  const peerId = event.message.peerId.chatId || event.message.peerId.channelId;

  const chat = await client.getInputEntity(event.message.peerId);
  const sender = await message.getSender();

  if (!sender || !sender.id || !chat || !msgID || !msgText || !message) {
    console.log("Invalid event data");
    return;
  }

  if (event.message.mentioned) {
    queueRequest(gemini, chat, msgID, msgText, message.senderId);
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

  if (msgText.startsWith("/userid") || msgText.startsWith("userid")) {
    queueRequest(replyWithUserId, chat, msgID, message);
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
}

// Debounce the eventPrint function to reduce repetitive requests in quick succession
const debouncedEventPrint = debounce(eventPrint, 500);

export { debouncedEventPrint as eventPrint };
