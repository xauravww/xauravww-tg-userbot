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
 
 
 
 
// Connect the client once at the start of your application

//for uptime

const startSeconds = Date.now() / 1000

client
  .connect()
  .then((data) => {
 
 

    if (client.session.save() == process.env.SESSION_STRING) {
 
    } else {
 
    }
  })
  .catch((err) => {
    console.error("Error connecting to Telegram:", err)
  })

async function connectClient() {
  if (!client.is_connected) {
    await client.connect()
 
  }
 
}

export { client, connectClient, startSeconds }
