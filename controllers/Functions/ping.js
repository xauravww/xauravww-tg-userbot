import { createRequire } from "module"
const require = createRequire(import.meta.url)

var request = require("request")
import { startSeconds } from "../../client.js"
import {
  replyToMessage,
  countUptimeServer,
  sendMessageInDM
} from "../utils/msgsUtils.js"

//get this msg from events and startSeconds from client
export async function pingInGroup(message, gcID, msgID, peer, channelpeerId) {
  const sender = await message.getSender()

  const upTimeMsg = countUptimeServer(startSeconds)
  console.log("uptime msg is " + upTimeMsg)
  const url = "http://www.google.com"
  try {
    const startTime = Date.now()
    console.log("Starting time is " + startTime)
    request(url, (error, response, body) => {
      console.log("response.statusCode " + response.statusCode)

      if (!error && response.statusCode === 200) {
        const pingTime = Date.now() - startTime
        console.log(`Ping ${pingTime / 1000} ms`)

        replyToMessage(
          `Pong : ${pingTime / 1000} ms \n${upTimeMsg}`,
          gcID,
          msgID,
          peer,
          channelpeerId
        )
      } else {
        console.error("Ping failed")
        replyToMessage(`"Ping failed"`, gcID, msgID, peer, channelpeerId)
      }
    })
  } catch (err) {
    console.log(err)
    replyToMessage(
      `Some error occurred while checking ping ${err}`,
      gcID,
      msgID,
      peer,
      channelpeerId
    )
  }
}

export async function pingInDm(message) {
  const sender = await message.getSender()
  const upTimeMsg = countUptimeServer(startSeconds)
  try {
    const url = "http://www.google.com"

    const startTime = Date.now()
    request(url, (error, response, body) => {
      console.log("response.statusCode " + response.statusCode)
      if (!error && response.statusCode === 200) {
        const pingTime = Date.now() - startTime
        console.log(`Ping ${pingTime / 1000} ms`)
        sendMessageInDM(
          `Pong : ${pingTime / 1000} ms \n${upTimeMsg}`,
          sender.id
        )
      }
    })
  } catch (err) {
    console.log(err)
    const msgText = `Error occurred while checking ping ${err}`
    sendMessageInDM(msgText, sender.id)
  }
}
