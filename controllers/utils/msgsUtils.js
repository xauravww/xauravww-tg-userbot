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
 
 
 
 
 
  // const files = path.resolve("./output.mp4")
 
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
 
      }
    }
  })
}

async function sendMessageInDM(msgText, senderId) {
  return await client.sendMessage(senderId, {
    message: msgText
  })
}
async function editMessageInDM(msgText, senderId, msgID) {
  return new Api.messages.EditMessage({
    peer: new Api.InputPeerUser({
      userId: senderId
    }),
    id: msgID,

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
  editMessageInDM,
  sendMessageWithFileInDM,
  countUptimeServer
}
