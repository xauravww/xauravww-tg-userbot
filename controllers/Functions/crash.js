import { createRequire } from "module"
const require = createRequire(import.meta.url)
const path = require("path")

const dotenv = require("dotenv")
dotenv.config({ path: path.resolve(".env") })

import { sendMessageInDM } from "../utils/msgsUtils.js"

export async function stopServer(message) {
  const sender = await message.getSender()

  const stopParams = message.text.toLowerCase().replace("stop ", "")
  console.log("stopParams " + stopParams)
  const msgText = `Your passowrd is correct and I am stopping the server`
  sendMessageInDM(stopParams, sender.id).then(() => {
    if (stopParams == process.env.CRASH_PASS) process.exit(0)
  })
}
