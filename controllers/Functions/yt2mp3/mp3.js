import { createRequire } from "module"
const require = createRequire(import.meta.url)

import path from "path"

var request = require("request")

import {
  replyToMessage,
  sendMessageInDM,
  sendMessageWithFileInDM
} from "../../utils/msgsUtils.js"
import { mp3Downloader } from "./yt2mp3.js"

export async function mp3HandlerInGroup(
  message,
  messageText,
  gcID,
  msgID,
  peer,
  channelpeerId
) {
  const sender = await message.getSender()

  const inputString = messageText.replace("mp3 ", "")
  replyToMessage(
    `Thoda sbr kro na File aapko send ho jaayegi `,
    gcID,
    msgID,
    peer,
    channelpeerId
  )
  try {
    mp3Downloader(inputString).then((data) => {
      console.log(data)
      const senderId = sender.id
      const files = path.resolve("./file.mp3")

      sendMessageInDM(
        `Sbr kro thoda mp3 file aa hi rhi hogi , Rasste mein h..`,
        senderId
      ).catch((err) => {
        sendMessageInDM(`err`, senderId)
      })
      sendMessageWithFileInDM(data, files, senderId)
      replyToMessage(
        `Pirasannal mess dekho 🥺 bhej diya maine mp3`,
        gcID,
        msgID,
        peer,
        channelpeerId
      )
    })
  } catch (err) {
    console.log(err)
  }
}


// export async function mp3HandlerInDm() {
    
// }