import { createRequire } from "module"
const require = createRequire(import.meta.url)

import { sendMessageInDM } from "../utils/msgsUtils.js"

export async function getUserIdInDm(message) {
  const sender = await message.getSender()

  const msgText = `hi your userid is ${message.senderId}`
  sendMessageInDM(msgText, sender.id)
}
