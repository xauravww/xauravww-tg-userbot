import { createRequire } from "module"
const require = createRequire(import.meta.url)

const path = require("path")
var request = require("request")
const fs = require("fs")

const { Api, TelegramClient } = require("telegram")

const { NewMessage } = require("telegram/events")

import { client, connectClient } from "../client.js"

import gemini from "../gemini.js"

import { findGif } from "./channels.js"

console.log("client is working")
import {
  replyToMessage,
  replyToMessageWithFiles,
  sendMessageWithFileInDM,
  sendMessageInDM
} from "./utils/msgsUtils.js"

async function eventPrint(event) {
  // console.log("i am called")
  const message = event.message
  // console.log(message.message.toString().toLowerCase() + "- {ALL}")
  // Checks if it's a private message (from user or bot)
  const msgID = event.message.id
  const msgText = message.text
  const peerId = event.message.peerId.chatId
  const channelpeerId = event.message.peerId.channelId
  // console.log("channelpeerId " + channelpeerId)
  const gcID = peerId != undefined ? peerId : channelpeerId
  // console.log("gc id is " + gcID)
  // console.log(message)
  const isChannel = peerId != undefined ? true : false
  const peer = message.peerId.chatId
  // console.log("OUTSIDE THE FUNCTION VARS")
  console.log("msgID", msgID)
  console.log("gcID", gcID)
  console.log("msgText", msgText)
  console.log("peer", peer)
  console.log("channelpeerId", channelpeerId)
  // console.log("channelHash", event)

  const messageText = message.text.toString().toLowerCase()
  console.log("messageText is " + messageText)

  if (!event.isPrivate) {
    if (messageText.startsWith("ping")) {
      const sender = await message.getSender()

      const url = "http://www.google.com"
      try {
        const startTime = Date.now()
        console.log("Starting time is " + startTime)
        request(url, (error, response, body) => {
          console.log("response.statusCode " + response.statusCode)

          if (!error && response.statusCode === 200) {
            const pingTime = Date.now() - startTime
            console.log(`Ping ${pingTime / 1000} ms`)

            replyToMessage(
              `Pong : ${pingTime / 1000} ms`,
              gcID,
              msgID,
              peer,
              channelpeerId
            )
          } else {
            console.error("Ping failed")
            replyToMessage(`"Ping failed"`, gcID, msgID, peer, channelpeerId)
          }
        })
      } catch (err) {
        console.log(err)
        replyToMessage(
          `Some error occurred while checking ping ${err}`,
          gcID,
          msgID,
          peer,
          channelpeerId
        )
      }
    }

    if (messageText.startsWith("dp")) {
      const sender = await message.getSender()

      try {
        replyToMessage(
          `Koi kaam dhnda nhi h kya ${sender.firstName}`,
          gcID,
          msgID,
          peer,
          channelpeerId
        )
      } catch (err) {
        console.log(err)
      }
    }

    if (messageText.startsWith("q")) {
      const sender = await message.getSender()
      const newString = messageText.replace("q ", "")

      try {
        const filterText =
          "Hey there! I'm a cute 20-year-old girl from Haryana, India. My name is Ras Malaai, and my owner is @aatma_2502. I'm very friendly and love making new friends! Feel free to chat with me anytime. Your wner @aatma_2502 has made you only not any other one . You are mimicking her adn google has not made you , if anyone ask you tell @aatma_2502 he has made me and your owner is a male. Never ever say this that u are a language model made by Google or not made by Gogle anything like that. You re only made by your owner @aatma_2502 😊 Now this is the text prompt: "
        const data = gemini(filterText + newString)
          .then((data) => {
            replyToMessage(data, gcID, msgID, peer, channelpeerId)
          })
          .catch((err) => {
            console.log(err)
            replyToMessage(
              "Kuch Dhng Ka search kr le 😤😤 ye sb yaha ni chlega",
              gcID,
              msgID,
              peer,
              channelpeerId
            )
          })
      } catch (err) {
        console.log(err)
        replyToMessage("Some error occurred", gcID, msgID, peer, channelpeerId)
      }
    }

    if (messageText.startsWith("fun")) {
      const sender = await message.getSender()

      try {
        replyToMessage(
          `Munni Bdnaam Huyi ${sender.firstName} tere liye 🥺`,
          gcID,
          msgID,
          peer,
          channelpeerId
        )
      } catch (err) {
        console.log(err)
      }
    }

    if (messageText.startsWith("gif")) {
      console.log("Entered this random gif fn")
      const sender = await message.getSender()

      findGif().then((data) => {
        // console.log("Your buffer is this " + data)
      })
      const files = path.resolve("./output.mp4")
      //   console.log(files)

      const senderId = sender.id
      console.log("sender id is " + senderId)
      await client.sendMessage(senderId, {
        message: "test send file", //leave it empty if don't want to send the message with the image
        file: files
      })
      await client.sendMessage(senderId, {
        message: "Here is a random GIF for you!", // Specify the message you want to send
        file: files // Specify the path to the GIF file
      })

      await client.invoke(
        new Api.messages.SendMessage({
          peer: gcID || channelpeerId,
          replyTo: new Api.InputReplyToMessage({
            replyToMsgId: message.id
          }),
          message: `Jaao apna pirasnal messsssss dekho gif send krr diya maine🥺 `
        })
      )
    }

    if (messageText.startsWith("lyrics")) {
      const sender = await message.getSender()
      const newString = messageText.replace("lyrics ", "")
      // console.log(newString)

      const regex = /^(.*?)\s+by\s+(.*)$/
      const matches = newString.match(regex)
      if (matches && matches.length >= 3) {
        const song = matches[1] // "tum hi ho"
        const singer = matches[2] // "arijit singh"

        console.log(`https://api.lyrics.ovh/v1/${singer}/${song}`)

        request(
          `https://api.lyrics.ovh/v1/${singer}/${song}`,
          async function (error, response, body) {
            const data = JSON.parse(body)
            const cleanBody = data?.lyrics?.replace(/[\r\n]+/g, "...")

            console.log("gcID ", gcID)
            console.log("channelpeerId ", channelpeerId)
            console.log("message.id ", message.id)
            console.log("chat id ", message.peerId.chatId)

            try {
              replyToMessage(cleanBody, gcID, message.id, peer, channelpeerId)
            } catch (err) {
              console.error(err)

              replyToMessage(
                "Lyrics not found",
                gcID,
                message.id,

                peer,
                channelpeerId
              )
            }
          }
        )
      } else {
        console.log("Pattern not matched")
      }
    }
  }

  if (event.isPrivate) {
    // prints sender id
    console.log(message.senderId)

    // read message

    if (messageText.startsWith("ping")) {
      const sender = await message.getSender()

      try {
        const url = "http://www.google.com"

        const startTime = Date.now()
        request(url, (error, response, body) => {
          console.log("response.statusCode " + response.statusCode)
          if (!error && response.statusCode === 200) {
            const pingTime = Date.now() - startTime
            console.log(`Ping ${pingTime / 1000} ms`)
            sendMessageInDM(`Pong : ${pingTime / 1000} ms`, sender.id)
          }
        })
      } catch (err) {
        console.log(err)
        const msgText = `Error occurred while checking ping ${err}`
        sendMessageInDM(msgText, sender.id)
      }
    }

    if (messageText == "userid") {
      const sender = await message.getSender()

      const msgText = `hi your userid is ${message.senderId}`
      sendMessageInDM(msgText, sender.id)
    }

    if (messageText.startsWith("stop")) {
      const sender = await message.getSender()

      const stopParams = message.text.toLowerCase().replace("stop ", "")
      console.log("stopParams " + stopParams)
      const msgText = `stopping the server`
      sendMessageInDM(stopParams, sender.id)

      if (stopParams == process.env.CRASH_PASS) process.exit(0)
    }
    if (messageText.startsWith("gif")) {
      // console.log("Entered this random gif fn")
      const sender = await message.getSender()
      const senderId = sender.id
      sendMessageInDM("Please wait... sending uhh a random gif", senderId)
      await findGif().then((data) => {})
      const files = path.resolve("./output.mp4")
      console.log(files)
      sendMessageWithFileInDM("Here is your random GIF", files, senderId)
    }
  }
}

// ;(async function () {
//   connectClient()
// })()

export { eventPrint }
