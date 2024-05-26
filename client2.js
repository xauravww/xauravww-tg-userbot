import { createRequire } from "module"
const require = createRequire(import.meta.url)

const { TelegramClient } = require("telegram")
const { StringSession } = require("telegram/sessions")
const path = require("path")
const input = require("input") // npm i input
const dotenv = require("dotenv")
dotenv.config({ path: path.resolve(".env") })
const apiId = parseInt(process.env.API_KEY || "123456")
const apiHash = process.env.API_HASH || "abcdefghijklmnopqrstuvwxyz"
const stringSession = new StringSession("") // fill this later with the value from session.save()

;(async () => {
 
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5
  })
  await client.start({
    phoneNumber: async () => await input.text("number ?"),
    password: async () => await input.text("password?"),
    phoneCode: async () => await input.text("Code ?"),
 
  })
 
  const session = client.session.save()
  await client.sendMessage("me", { message: "session" })
})()
