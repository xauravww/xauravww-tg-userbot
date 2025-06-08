import { createRequire } from "module";
const require = createRequire(import.meta.url);

import debounce from 'debounce';

import { client, connectClient, startSeconds } from "../client-init.js";
import { replyWithPing } from "./Functions/ping.js";
import { stopServer } from "./Functions/crash.js";
import { replyWithRandomGif } from "./Functions/gifs.js";
import { replyWithFun, replyWithUserId, replyWithAbout, replyWithStart, replyWithHelp, replyWithAudio, replyWithCustomMessage } from "./Functions/miscellaneous.js";
import { gemini } from "./Functions/gemini/query_gemini-api.js";
import { lyricsFinder } from "./Functions/lyrics.js";
import { genButtons } from "./Functions/image-gens/buttons-image-gens.js";
import { songDownloader } from "./Functions/yt2mp3/song.js";
import { replyWithGlobalMenu } from "./Functions/global-settings-menu.js";
import { handleBtnsMediaHandler, handleImage, handleVideo, handleFeed } from "./Functions/media-handler.js";
import axios from "axios";
import { replyWithYtdlDownloadButtons } from "./Functions/image-gens/ytdlmp3-handler.js";
import { getGlobalValue, setGlobalObject, setGlobalValue, setUserSpecificValue, getUserSpecificValue } from "./utils/global-context.js";
import geminiChatHistoryManager from "./Functions/gemini/geminiChatHistoryManager.js";
import chatHistoryManager from "./Functions/gemini/chatHistoryManager.js";

// Queue for incoming events
const priorityQueue = [];
let isProcessingQueue = false;

// Enqueue with priority (lower number = higher priority)
export function queueRequest(func, priority = 5, ...args) {
  priorityQueue.push({ func, args, priority, timestamp: Date.now() });
  // Sort by priority and timestamp (FIFO within same priority)
  priorityQueue.sort((a, b) => a.priority - b.priority || a.timestamp - b.timestamp);
  processQueue();
}

// Function to process the queue
async function processQueue() {
  if (isProcessingQueue) return;
  isProcessingQueue = true;

  while (priorityQueue.length > 0) {
    const { func, args } = priorityQueue.shift(); // Pull highest-priority task
    try {
      await func(...args);
    } catch (error) {
      console.error("Error processing request:", error);
    }
  }

  isProcessingQueue = false;
}

async function eventPrint(event) {
  if (!event.message) {
    return;
  }

  const message = event.message;
  const msgID = event.message.id;
  const msgText = message.text.toLowerCase();
  const peerId = event.message.peerId.chatId || event.message.peerId.channelId;
  const chat = await client.getInputEntity(event.message.peerId);
  const sender = await message.getSender();

  const isVideo = event?.message?.media?.document?.mimeType == "video/mp4" || event?.message?.media?.document?.mimeType == "video/webm";
  const isWebp = event?.message?.media?.document?.mimeType == "image/webp";
  const isNormalPhoto = event?.message?.photo;
  const isVoiceOrAudio = event?.message?.media?.document?.mimeType == "audio/mpeg" || event?.message?.media?.document?.mimeType == "audio/ogg";
  const isSenderABot = event?.message?.viaBotId == null;

  if (!isVoiceOrAudio && !event.message.photo && !isWebp && !isVideo && (!sender || !sender.id || !chat || !msgID || !msgText || !message)) {
    return;
  }

  // **Media Handling Section**
  if (isVoiceOrAudio && isSenderABot) {
    queueRequest(handleBtnsMediaHandler, 2, chat, msgID, event.message, isVideo, sender.id, isVoiceOrAudio);
  }

  if ((isNormalPhoto || isWebp || isVideo) && event.message.isPrivate && isSenderABot) {
    // // Check if Nvidia model is active
    // const modelMode = getGlobalValue("model_mode");
    // if (modelMode !== "nvidia-pro") {
    //   await client.sendMessage(chat, {
    //     message: "Please switch to Nvidia Pro model for image recognition using /set command.",
    //     replyTo: msgID,
    //   });
    //   return;
    // }
    // // If Nvidia model is active, proceed with handling image
    queueRequest(handleBtnsMediaHandler, 2, chat, msgID, event.message, isVideo, sender.id, isVoiceOrAudio);
  }

  const allCommands = [
    '/feed', '/isign', '/vsign', '/gif', 'gif', '/fun', 'fun', '/ping', 'ping',
    '/userid', 'userid', '/stop', 'stop', '/ask', 'ask', '/gen', '/song',
    '/lyrics', 'lyrics', '/about', 'about', '/start', 'start', '/help', 'help',
    '/set', 'set', '/cgender'
  ];

  // Function to check if the message text starts with any command
  function startsWithAnyCommand(msgText, commands) {
    return commands.some(command => msgText.startsWith(command));
  }

  // **YouTube Link Detection**
  const youtubeUrlPattern = /https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]{11}/i;
  if (youtubeUrlPattern.test(msgText)) {
    queueRequest(replyWithYtdlDownloadButtons, 2, chat, msgID, msgText, sender.id);
    return;
  }

  // **Direct Command Handlers**
  if (msgText.startsWith("/feed")) {
    queueRequest(handleFeed, 4, msgText.replace("/feed", ""), message, msgID, chat, sender.id);
  }
  if (msgText.startsWith("/isign")) {
    queueRequest(handleImage, 4, msgText.replace("/isign", ""), message, msgID, chat, sender.id);
  }
  if (msgText.startsWith("/vsign")) {
    queueRequest(handleVideo, 4, chat, msgID, message, msgText.replace("/vsign", ""), sender.id);
  }
  if (msgText.startsWith("/gif")) {
    queueRequest(replyWithRandomGif, 5, chat, msgID);
  }
  if (msgText.startsWith("/fun") ) {
    queueRequest(replyWithFun, 5, chat, msgID, message, sender);
  }
  if (msgText.startsWith("/ping")) {
    queueRequest(replyWithPing, 2, chat, msgID, startSeconds);
  }
  if (msgText.startsWith("/userid")  || event.message.fwdFrom != null) {
    queueRequest(replyWithUserId, 2, chat, msgID, message, event.message?.fwdFrom);
  }
  if (msgText.startsWith("/stop")) {
    queueRequest(stopServer, 1, chat, msgID, msgText);
  }
  if (msgText.startsWith("/ask")) {
    queueRequest(gemini, 1, chat, msgID, msgText, true);
  }
  if (msgText.startsWith("/gen")) {
    if (msgText.trim() === "/gen") {
      await client.sendMessage(chat, {
        message: "Please provide a query with /gen command. Example: /gen a cat",
        replyTo: msgID,
      });
    } else {
      queueRequest(genButtons, 1, sender.id, chat, msgID, msgText);
    }
  }
  if (msgText.startsWith("/song")) {
    if (msgText.trim() === "/song") {
      await client.sendMessage(chat, {
        message: "Please provide a query with /song command. Example: /song angrezi beat",
        replyTo: msgID,
      });
    } else {
      queueRequest(songDownloader, 1, chat, msgID, msgText);
    }
  }
  if (msgText.startsWith("/lyrics") || msgText.startsWith("lyrics")) {
    if (msgText.trim() === "/lyrics" || msgText.trim() === "lyrics") {
      await client.sendMessage(chat, {
        message: "Please provide a query with /lyrics command. Example: /lyrics song_name by artist_name",
        replyTo: msgID,
      });
    } else {
      queueRequest(lyricsFinder, 3, chat, msgID, msgText);
    }
  }
  if (msgText.startsWith("/about") || msgText.startsWith("about")) {
    queueRequest(replyWithAbout, 3, chat, msgID, msgText);
  }
  if (msgText.startsWith("/start") || msgText.startsWith("start")) {
    // Normal /start command handler
    queueRequest(replyWithStart, 3, chat, msgID, msgText);
  }

  else if (msgText.startsWith("/reveal")) {
    const parts = msgText.split(" ");
    if (parts.length > 1) {
      const whisperKey = parts[1].trim();
      // Fetch whisper message from Redis
      const storedData = await redisClient.get(whisperKey);
      if (!storedData) {
        await client.sendMessage(chat, {
          message: "Whisper message expired or not found.",
          replyTo: msgID,
        });
        return;
      }
      let whisperData;
      try {
        whisperData = JSON.parse(storedData);
      } catch (e) {
        whisperData = { message: storedData, senderId: null };
      }
      // Check if user is authorized (sender or recipient)
      if (
        sender.id.toString() !== (whisperData.senderId ? whisperData.senderId.toString() : null) &&
        sender.id.toString() !== (whisperData.recipientId ? whisperData.recipientId.toString() : null)
      ) {
        await client.sendMessage(chat, {
          message: "You are not authorized to view this whisper message.",
          replyTo: msgID,
        });
        return;
      }
      // Send the whisper message without length limit
      await client.sendMessage(chat, {
        message: `🤫 Whisper message:\n\n${whisperData.message}`,
        replyTo: msgID,
        parseMode: "markdown",
      });
    } else {
      await client.sendMessage(chat, {
        message: "Please provide a whisper key to reveal. Usage: /reveal <whisperKey>",
        replyTo: msgID,
      });
    }
  }
  else if (msgText.startsWith("/reveal")) {
    const parts = msgText.split(" ");
    if (parts.length < 2) {
      await client.sendMessage(chat, {
        message: "Please provide a whisper key. Usage: /reveal <whisperKey>",
        replyTo: msgID,
      });
      return;
    }
    const whisperKey = parts[1].trim();
    const storedData = await redisClient.get(whisperKey);
    if (!storedData) {
      await client.sendMessage(chat, {
        message: "Whisper message expired or not found.",
        replyTo: msgID,
      });
      return;
    }
    let whisperData;
    try {
      whisperData = JSON.parse(storedData);
    } catch (e) {
      whisperData = { message: storedData, senderId: null };
    }
    if (
      sender.id.toString() !== (whisperData.senderId ? whisperData.senderId.toString() : null) &&
      sender.id.toString() !== (whisperData.recipientId ? whisperData.recipientId.toString() : null)
    ) {
      await client.sendMessage(chat, {
        message: "You are not authorized to view this whisper message.",
        replyTo: msgID,
      });
      return;
    }
    await client.sendMessage(chat, {
      message: `🤫 Whisper message:\n\n${whisperData.message}`,
      replyTo: msgID,
      parseMode: "markdown",
    });
  }
  if (msgText.startsWith("/help") || msgText.startsWith("help")) {
    queueRequest(replyWithHelp, 3, chat, msgID, msgText, sender.id);
  }
  if (msgText.startsWith("/set") || msgText.startsWith("set")) {
    queueRequest(replyWithGlobalMenu, 3, chat, msgID, msgText, sender.id);
  }
  if (msgText.startsWith("/cgender")) {
    queueRequest(async (chat, msgID, senderId) => {
      let currentGender = getUserSpecificValue(senderId, "gender");
      let newGender;
      if (currentGender === "male") {
        newGender = "female";
      } else {
        newGender = "male";
      }
      setUserSpecificValue(senderId, "gender", newGender);

      // Clear chat histories for both Gemini and Nvidia models
      geminiChatHistoryManager.clearHistory(senderId);
      chatHistoryManager.clearHistory(senderId);

      await client.sendMessage(chat, {
        message: `Gender changed to ${newGender}.`,
        replyTo: msgID,
      });
    }, 3, chat, msgID, sender.id);
  }

  // **Catch-All Section (N8N Flags)**
  if (!startsWithAnyCommand(msgText, allCommands)) {
    try {
      if(!event.isPrivate && !event.message.mentioned){
        return;
      }
      if (msgText.startsWith("🤫 a whisper has been sent")) return;
      const voiceToggle = getGlobalValue("voice_toggle");
      const loadingtext = voiceToggle
        ? "🙊Speaking •၊၊||၊|။||||။၊|။• Hold On.."
        : "✎Typing •၊၊||၊|။||||။၊|။•";
      let msgToBeEditedId;

      // If chat or msgId is null or invalid, skip sending loading message to avoid errors
      let msgToBeEdited;
      if (chat && msgID && typeof chat !== 'string' && typeof msgID !== 'string') {
        msgToBeEdited = await client.sendMessage(chat, {
          message: loadingtext,
          replyTo: msgID,
        });
        msgToBeEditedId = msgToBeEdited.id;
      } else {
        msgToBeEditedId = null;
      }
      // Use AI-based classification function
      const { classifyAI } = await import("./Functions/classify-ai.js");
      const classification = await classifyAI(msgText, message, sender.id);
      // console.log("classification mgs.js", classification)
      if (!classification) return
      const flag = classification.endpoint;
      const translatedMsg = classification.message;
      const needsDownloading = classification.download;
      queueRequest(replyWithCustomMessage, 1, chat, msgToBeEditedId, msgID, classification)

      // console.log("flag",flag)

      //commented all classifications will use one  by one if needed some

      // if (flag == "/help") {
      //   queueRequest(replyWithHelp, 3, chat, msgID, msgText, sender.id);
      // } else if (flag == "/about") {
      //   queueRequest(replyWithAbout, 3, chat, msgID, msgText);
      // } else if (flag == "/start") {
      //   queueRequest(replyWithStart, 3, chat, msgID, msgText);
      // } else if (flag == "/set") {
      //   queueRequest(replyWithGlobalMenu, 3, chat, msgID, msgText, sender.id);
      // } else if (flag == "/gen") {
      //   queueRequest(genButtons, 1, sender.id, chat, msgID, translatedMsg || msgText);
      // } else if (flag == "/song" && needsDownloading) {
      //   queueRequest(songDownloader, 1, chat, msgID, msgText);
      // } else if (flag == "/lyrics") {
      //   queueRequest(lyricsFinder, 3, chat, msgID, msgText);
      // } else if (flag == "/stop") {
      //   queueRequest(stopServer, 1, chat, msgID, msgText);
      // } else if (flag == "/ask") {
      //   queueRequest(replyWithCustomMessage, 1, chat, msgID, classification);
      // } else if (flag == "/userid") {
      //   queueRequest(replyWithUserId, 2, chat, msgID, message, event.message?.fwdFrom);
      // } else if (flag == "/ping") {
      //   queueRequest(replyWithPing, 2, chat, msgID, startSeconds);
      // } else if (flag == "/gif") {
      //   queueRequest(replyWithRandomGif, 5, chat, msgID);
      // } else if (flag == "/fun") {
      //   queueRequest(replyWithFun, 5, chat, msgID, message, sender);
      // } else if (flag == "/isign") {
      //   queueRequest(handleImage, 4, msgText.replace("/isign", ""), message, msgID, chat, sender.id);
      // } else if (flag == "/vsign") {
      //   queueRequest(handleVideo, 4, chat, msgID, message, msgText.replace("/vsign", ""), sender.id);
      // } else if (flag == "/feed") {
      //   queueRequest(handleFeed, 4, msgText.replace("/feed", ""), message, msgID, chat, sender.id);
      // } else {
      //   queueRequest(gemini, 1, chat, msgID, msgText, message.senderId);
      // }
    } catch (error) {
      console.error("Error in AI-based message classification:", error);
      // Error handling remains unchanged; omitted for brevity
    }
  }
}

// Debounce the eventPrint function to reduce repetitive requests in quick succession
const debouncedEventPrint = debounce(eventPrint, 500);

export { debouncedEventPrint as eventPrint };
