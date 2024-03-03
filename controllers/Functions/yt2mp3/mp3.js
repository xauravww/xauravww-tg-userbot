import { createRequire } from "module"
const require = createRequire(import.meta.url)

import path from "path"

import { client } from "../../../client.js"

import {
  replyToMessage,
  sendMessageInDM,
  sendMessageWithFileInDM
} from "../../utils/msgsUtils.js"
import { mp3Downloader } from "./yt2mp3.js"

export async function mp3Handler(chat, msgId, messageText) {
  const messageToEdit = await client.sendMessage(chat, {
    message: `Sbr kro thoda mp3 file aa hi rhi hogi , Rasste mein h..`,
    replyTo: msgId
  })
  const inputString = messageText.replace("mp3 ", "")
  console.log("messageToEdit id: " + messageToEdit.id)
  const msgToEditId = messageToEdit.id
  try {
    mp3Downloader(inputString, msgToEditId, chat).then((videoTitle) => {
      // console.log(data)

      const files = path.resolve(
        "./controllers/Functions/yt2mp3/output/file.mp3"
      )

      client.sendFile(chat, {
        caption: `${videoTitle}`,
        file: files,
        replyTo: msgToEditId
      })
    })
  } catch (err) {
    await client.sendMessage(chat, {
      message: `Error aagya yr 🥺`,
      replyTo: msgId
    })
  }
}
