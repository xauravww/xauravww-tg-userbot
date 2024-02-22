const path = require("path")
var request = require("request")
const fs = require("fs")
const dotenv = require("dotenv")
dotenv.config({ path: "./env" })

const { Api, TelegramClient } = require("telegram")
const { StringSession } = require("telegram/sessions")
const { NewMessage } = require("telegram/events")
const { NewMessageEvent } = require("telegram/events/NewMessage")
const { Message } = require("telegram/tl/custom/message")

const { client, connectClient } = require("../client")

const { findGif } = require("./channels")
const {
  replyToMessage,
  replyToMessageWithFiles,
  sendMessageWithFileInDM
} = require("./utils/msgsUtils")

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
  console.log("channelHash", event)

  const messageText = message.text.toString().toLowerCase()
  console.log("messageText is " + messageText)
  if (!event.isPrivate) {
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
              if (channelpeerId) {
                // If it's a channel, use channelpeerId
                console.log("channelpeerid executed")

                replyToMessage(cleanBody, gcID, message.id, channelpeerId)
              } else if (peerId) {
                console.log("peerid executed")

                replyToMessage(
                  cleanBody,
                  gcID,
                  message.id,
                  message.peerId.chatId || channelpeerId
                )
              } else {
                // Handle other cases or provide a default behavior
                console.error("Unknown chat type")
              }
            } catch (err) {
              console.error(err)
              await client.invoke(
                new Api.messages.SendMessage({
                  peer: gcID,
                  replyTo: new Api.InputReplyToMessage({
                    replyToMsgId: message.id
                  }),
                  message: "Lyrics not found"
                })
              )

              replyToMessage(
                "Lyrics not found",
                gcID,
                message.id,
                message.peerId.chatId || channelpeerId || gcID
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
    if (messageText == "userid") {
      const sender = await message.getSender()
      console.log("sender is", sender)
      await client.sendMessage(sender, {
        message: `hi your userid is ${message.senderId}`
      })
    }
    if (messageText.startsWith("gif")) {
      // console.log("Entered this random gif fn")
      const sender = await message.getSender()
      sendMessageInDM("Please wait... sending uhh a random gif", senderId)
      findGif().then((data) => {})
      const files = path.resolve("./output.mp4")
      const senderId = sender.id
      sendMessageWithFileInDM("Here is your random GIF", files, senderId)
    }
  }
}

;(async function () {
  await connectClient()

  client.addEventHandler(async (event) => {
    await eventPrint(event)
  }, new NewMessage({}))
})()

module.exports = { eventPrint }
