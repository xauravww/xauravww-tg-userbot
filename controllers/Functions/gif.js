import { client } from "../../client.js"
import { Api } from "telegram"
export async function replyWithRandomGif(chat, msgID) {
  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  const randomNumber = getRandomInt(0, 1000)
  const result = await client.invoke(
    new Api.channels.GetMessages({
      channel: "aatmakacollection",
      id: [randomNumber]
    })
  )
  await client
    .sendFile(chat, {
      file: `https://t.me/aatmakacollection/${randomNumber}`,
      caption: "Ye lO tumhari Gif",
      replyTo: msgID
    })
    .then(() => {
      console.log("Successfully Replied with Gif")
    })
}
