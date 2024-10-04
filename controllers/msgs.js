// Import necessary modules
import { createRequire } from "module";
const require = createRequire(import.meta.url);

import debounce from 'debounce';
const { Api, TelegramClient } = require("telegram");
const { NewMessage } = require("telegram/events");
const { CallbackQuery } = require("telegram/events/CallbackQuery");

import { client, connectClient, startSeconds } from "../client.js";
const { Button } = require("telegram/tl/custom/button");

import { replyWithPing } from "./Functions/ping.js";
import { stopServer } from "./Functions/crash.js";
import { mp3Handler } from "./Functions/yt2mp3/mp3.js";
import { replyWithRandomGif } from "./Functions/gifs.js";
import { replyWithFun, replyWithUserId ,replyWithAbout } from "./Functions/miscellaneous.js";
import { gemini } from "./Functions/gemini/query_gemini-api.js";
import { lyricsFinder } from "./Functions/lyrics.js";
import { genImage } from "./Functions/image-gen.js";
import { genImage2 } from "./Functions/image-gen2.js";


async function eventPrint(event) {
  const message = event.message;
  const msgID = event.message.id;
  const msgText = message.text.toLowerCase();
  const peerId = event.message.peerId.chatId || event.message.peerId.channelId;
  const isChannel = event.message.peerId.chatId === undefined;

  const chat = await client.getInputEntity(event.message.peerId);
  const sender = await message.getSender();
  
  if (event.message.mentioned) {
    gemini(chat, msgID, msgText, message.senderId);
  }

  if (msgText.startsWith("/gif") || msgText.startsWith("gif")) {
    replyWithRandomGif(chat, msgID);
  }

  if (msgText.startsWith("/fun") || msgText.startsWith("fun")) {
    replyWithFun(chat, msgID, message, sender);
  }

  if (msgText.startsWith("/ping") || msgText.startsWith("ping")) {
    replyWithPing(chat, msgID, startSeconds);
  }

  if (msgText.startsWith("/userid") || msgText.startsWith("userid")) {
    replyWithUserId(chat, msgID, message);
  }

  if (msgText.startsWith("/stop") || msgText.startsWith("stop")) {
    stopServer(chat, msgID, msgText);
  }

  if (msgText.startsWith("/ask") || msgText.startsWith("ask")) {
    gemini(chat, msgID, msgText);
  }

  
  if (msgText.startsWith("/gen")) {
    genImage(sender.id, chat, msgID, msgText);
  }
  
  
  if (msgText.startsWith("/gen2")) {
    genImage2(sender.id, chat, msgID, msgText);
  }

  if (msgText.startsWith("/mp3") || msgText.startsWith("mp3")) {
    mp3Handler(chat, msgID, msgText);
  }

  if (msgText.startsWith("/lyrics") || msgText.startsWith("lyrics")) {
    lyricsFinder(chat, msgID, msgText);
  }

  if (msgText.startsWith("/about") || msgText.startsWith("about")) {
    replyWithAbout(chat, msgID, msgText);
  }
}


const debouncedEventPrint = debounce(eventPrint, 500);

export { debouncedEventPrint as eventPrint };