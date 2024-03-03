import { startSeconds, client } from "../../client.js"
import request from "request"
export async function lyricsFinder(chat, msgId, messageText) {
  const msgToBeEdited = await client.sendMessage(chat, {
    message: "Wait finding the lyrics for u ... ",
    replyTo: msgId
  })
  const msgToBeEditedId = msgToBeEdited.id
  const newString = messageText.replace("lyrics ", "")

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
        try {
          client.editMessage(chat, {
            message: msgToBeEditedId,
            text: cleanBody,
            replyTo: msgId
          })
        } catch (err) {
          console.error(err)
          client.editMessage(chat, {
            message: msgToBeEditedId,
            text: "Lyrics not found...",
            replyTo: msgId
          })
        }
      }
    )
  } else {
    console.log("Pattern not matched")
  }
}
