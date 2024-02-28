import { exec } from "child_process"
import { createRequire } from "module"
const require = createRequire(import.meta.url)

const { StringSession } = require("telegram/sessions")
const { Api, TelegramClient } = require("telegram")
const path = require("path")
const dotenv = require("dotenv")
dotenv.config({ path: path.resolve(".env") })

const apiId = parseInt(process.env.API_KEY)
const apiHash = process.env.API_HASH

const session = new StringSession(process.env.SESSION_STRING) // You should put your string session here

const client = new TelegramClient(session, apiId, apiHash, {})
console.log(client)
console.log("API KEY is " + process.env.API_KEY)
console.log("API Hash is " + process.env.API_HASH)
console.log("Session is " + process.env.SESSION_STRING)
// Connect the client once at the start of your application

//for uptime

const startSeconds = Date.now() / 1000

client
  .connect()
  .then((data) => {
    console.log(data)
    console.log(client.session.save())

    if (client.session.save() == process.env.SESSION_STRING) {
      console.log("Both are same")
    } else {
      console.log("Both are different")
    }
  })
  .catch((err) => {
    console.error("Error connecting to Telegram:", err)
  })

async function connectClient() {
  if (!client.is_connected) {
    await client.connect()
    console.log("Connected to Telegram")
  }
  // console.log(client.session.save())
}

export { client, connectClient, startSeconds }
