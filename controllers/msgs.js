import { createRequire } from "module"
const require = createRequire(import.meta.url)

const path = require("path")
var request = require("request")
const fs = require("fs")

const { Api, TelegramClient } = require("telegram")

const { NewMessage } = require("telegram/events")
const { CallbackQuery } = require("telegram/events/CallbackQuery")
import { client, connectClient, startSeconds } from "../client.js"
const { Button } = require("telegram/tl/custom/button")
 

import { replyWithPing } from "./Functions/ping.js"

import { stopServer } from "./Functions/crash.js"
import { mp3Handler } from "./Functions/yt2mp3/mp3.js"

import { replyWithRandomGif } from "./Functions/gif.js"
import { replyWithFun, replyWithUserId } from "./Functions/miscellaneous.js"
import { gemini } from "./Functions/gemini/query_gemini.js"
import { lyricsFinder } from "./Functions/lyrics.js"
import BotClient from "../botclient.js"
async function eventPrint(event) {
  const message = event.message

  const msgID = event.message.id
  const msgText = message.text
  const peerId = event.message.peerId.chatId
  const channelpeerId = event.message.peerId.channelId

  const gcID = peerId != undefined ? peerId : channelpeerId

  const isChannel = peerId != undefined ? true : false
  const peer = message.peerId.chatId
  const chat = await client.getInputEntity(event.message.peerId)
  const sender = await message.getSender()
 
 
 
 
 
  const messageText = message.text.toString().toLowerCase()
 
 

  if (messageText.startsWith("t")) {
    // const dialogs = await client.getDialogs({})
    // const first = dialogs[0]
 

    // dialogs.forEach((item) => {
 
    // })

    client.sendMessage("ras_malaai_bot", { message: "hi" })
  }

  if (messageText.startsWith("gif")) {
    replyWithRandomGif(chat, msgID)
  }

  if (messageText.startsWith("fun")) {
    replyWithFun(chat, msgID, message, sender)
  }

  if (messageText.startsWith("ping")) {
    replyWithPing(chat, msgID, startSeconds)
  }

  if (messageText == "userid") {
    replyWithUserId(chat, msgID, message)
  }
  if (messageText.startsWith("stop")) {
    stopServer(chat, msgID, messageText)
  }
  if (messageText.startsWith("q")) {
    gemini(chat, msgID, messageText)
  }
  if (messageText.startsWith("mp3")) {
    mp3Handler(chat, msgID, msgText)
  }

  if (messageText.startsWith("lyrics")) {
    lyricsFinder(chat, msgID, messageText)
  }
}

export { eventPrint }
