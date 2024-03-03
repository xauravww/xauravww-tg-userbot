import { createRequire } from "module"
const require = createRequire(import.meta.url)

var request = require("request")
import { startSeconds, client } from "../../client.js"
import {
  replyToMessage,
  countUptimeServer,
  sendMessageInDM
} from "../utils/msgsUtils.js"

//get this msg from events and startSeconds from client
export async function replyWithPing(chat, msgID, startSeconds) {
  const upTimeMsg = countUptimeServer(startSeconds)

  const url = "http://www.google.com"
  try {
    const startTime = Date.now()

    request(url, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        const pingTime = Date.now() - startTime
        client.sendMessage(chat, {
          message: `Pong : ${pingTime / 1000} ms \n${upTimeMsg}`,
          replyTo: msgID
        })
      } else {
        console.error("Ping failed")
        client.sendMessage(chat, { message: `Ping Failed`, replyTo: msgID })
      }
    })
  } catch (err) {
    console.log(err)
    client.sendMessage(chat, {
      message: `Some error occured while pinging`,
      replyTo: msgID
    })
  }
}
