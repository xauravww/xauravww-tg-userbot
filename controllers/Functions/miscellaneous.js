import { client } from "../../client.js"

export async function replyWithUserId(chat, msgId, message) {
  const msgText = `hi your userid is ${message.senderId}`

  await client.sendMessage(chat, { message: msgText, replyTo: msgId })
}

export async function replyWithFun(chat, msgId, message, sender) {
  const msgText = `Munni Bdnaam Huyi ${sender.firstName} tere liye 🥺`

  await client.sendMessage(chat, { message: msgText, replyTo: msgId })
}
