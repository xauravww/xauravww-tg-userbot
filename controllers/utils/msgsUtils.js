// await client.sendMessage(sender, {
//   message: `hi your id is ${message.senderId}`
// })
import { createRequire } from "module"
const require = createRequire(import.meta.url)

const { StringSession } = require("telegram/sessions")
const { Api, TelegramClient } = require("telegram")

import { client, connectClient } from "../../client.js"
const path = require("path")

async function replyToMessage(msgText, gcID, msgID, peer, channelpeerId) {
  console.log("msgID", msgID)
  console.log("gcID", gcID)
  console.log("msgText", msgText)
  console.log("peer", peer)
  console.log("channelpeerId", channelpeerId)

  if (!client.is_connected) {
    // If not connected, connect to the client
    await client.connect()
  }
  return new Promise(async (res, rej) => {
    if (!channelpeerId) {
      const data = await client.invoke(
        new Api.messages.SendMessage({
          peer: new Api.InputPeerChat({
            chatId: gcID || peer || channelpeerId
          }),
          replyTo: new Api.InputReplyToMessage({
            replyToMsgId: msgID
          }),
          message: msgText
        })
      )
      res(data)
    } else {
      console.log("Channelpeerid undefined")
      try {
        const data = await client.invoke(
          new Api.messages.SendMessage({
            // peer: new Api.InputPeerChannel({
            //   channelId: gcID || peer || channelpeerId
            // }),
            peer: peer || channelpeerId,
            replyTo: new Api.InputReplyToMessage({
              replyToMsgId: msgID
            }),
            message: msgText
          })
        )
        res(data)
      } catch (err) {
        console.log(err)
      }
    }
  })
}

async function replyToMessageWithFiles(
  msgText,
  gcID,
  msgID,
  peer,
  channelpeerId,
  files = path.resolve("./output.mp4")
) {
  console.log("msgID", msgID)
  console.log("gcID", gcID)
  console.log("msgText", msgText)
  console.log("peer", peer)
  console.log("channelpeerId", channelpeerId)
  // const files = path.resolve("./output.mp4")
  console.log(files)
  if (!client.is_connected) {
    // If not connected, connect to the client
    await client.connect()
  }
  return new Promise(async (res, rej) => {
    if (!channelpeerId) {
      const data = await client.invoke(
        new Api.messages.SendMedia({
          peer: new Api.InputPeerChat({
            chatId: gcID || peer || channelpeerId
          }),
          replyTo: new Api.InputReplyToMessage({
            replyToMsgId: msgID
          }),
          message: msgText,
          media: new Api.InputMediaUploadedDocument({
            file: files, // Provide the file data
            mimeType: "video/mp4",
            attributes: [
              new Api.DocumentAttributeVideo({
                duration: 10, // Example duration (in seconds)
                w: 480, // Example width
                h: 854 // Example height
              })
            ]
          })
        })
      )
      res(data)
    } else {
      console.log("Channelpeerid undefined")
      console.log(files)
      try {
        const data = await client.invoke(
          new Api.messages.SendMedia({
            // peer: new Api.InputPeerChannel({
            //   channelId: gcID || peer || channelpeerId
            // }),
            peer: peer || channelpeerId,
            replyTo: new Api.InputReplyToMessage({
              replyToMsgId: msgID
            }),
            message: msgText,
            media: new Api.InputMediaUploadedDocument({
              file: files, // Provide the file data
              mimeType: "video/mp4",
              attributes: [
                new Api.DocumentAttributeVideo({
                  duration: 10, // Example duration (in seconds)
                  w: 480, // Example width
                  h: 854 // Example height
                })
              ]
            })
          })
        )
        res(data)
      } catch (err) {
        console.log(err)
      }
    }
  })
}

async function sendMessageInDM(msgText, senderId) {
  await client.sendMessage(senderId, {
    message: msgText
  })
}

async function sendMessageWithFileInDM(msgText, file, senderId) {
  await client.sendMessage(senderId, {
    message: msgText,
    file: file
  })
}

function countUptimeServer(startSeconds) {
  const startMinutes = startSeconds / 60
  const startHour = startMinutes / 60

  const endSeconds = Date.now() / 1000 - startSeconds
  const endMinutes = endSeconds / 60
  const endHour = endMinutes / 60
  const DaysElapsed = endHour / 24

  const upTimeString = `Uptime: ${Math.floor(DaysElapsed)} Days ${Math.floor(
    endHour % 24
  )} Hr ${Math.floor(endMinutes % 60)} Min ${Math.floor(endSeconds % 60)} Sec`

  return upTimeString
}

export {
  replyToMessage,
  replyToMessageWithFiles,
  sendMessageInDM,
  sendMessageWithFileInDM,
  countUptimeServer
}
