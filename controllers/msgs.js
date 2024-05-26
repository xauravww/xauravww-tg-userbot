import { createRequire } from "module";
const require = createRequire(import.meta.url);

const path = require("path");
var request = require("request");
const fs = require("fs");

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

async function eventPrint(event) {
  const message = event.message;
  const msgID = event.message.id;
  const msgText = message.text.toLowerCase();
  const peerId = event.message.peerId.chatId;
  const channelpeerId = event.message.peerId.channelId;
  const gcID = peerId !== undefined ? peerId : channelpeerId;
  const isChannel = peerId !== undefined;
  const chat = await client.getInputEntity(event.message.peerId);
  const sender = await message.getSender();

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

  if (msgText.startsWith("/q") || msgText.startsWith("q")) {
    gemini(chat, msgID, msgText);
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

export { eventPrint };
