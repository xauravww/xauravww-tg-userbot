const { StringSession } = require("telegram/sessions")
const { Api, TelegramClient } = require("telegram")
const dotenv = require("dotenv")
dotenv.config({ path: "./env" })

const apiId = parseInt(process.env.API_KEY || "123456")
const apiHash = process.env.API_HASH || "abcdefghijklmnopqrstuvwxyz"

const session = new StringSession(process.env.SESSION_STRING) // You should put your string session here

const client = new TelegramClient(session, apiId, apiHash, {})

// Connect the client once at the start of your application
client
  .connect()
  .then(() => {
    console.log("Connected to Telegram")
  })
  .catch((err) => {
    console.error("Error connecting to Telegram:", err)
  })

async function connectClient() {
  if (!client.is_connected) {
    await client.connect()
    console.log("Connected to Telegram")
  }
}

module.exports = { client, connectClient }
