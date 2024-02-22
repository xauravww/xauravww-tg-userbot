const { Api, TelegramClient } = require("telegram")
const { StringSession } = require("telegram/sessions")

const dotenv = require("dotenv")
dotenv.config({ path: "./env" })

const fs = require("fs")
const apiId = parseInt(process.env.API_KEY)
const apiHash = process.env.API_HASH

const session = new StringSession(process.env.SESSION_STRING) // You should put your string session here
const client = new TelegramClient(session, apiId, apiHash, {})

async function findGif() {
  await client.connect() // This assumes you have already authenticated with .start()
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
  console.log(result.messages[0].media)
  const media = result.messages[0].media
  if (media) {
    const buffer = await client.downloadMedia(media, {
      workers: 1
    })

    // console.log(media)

    // const mimetype = result.messages[0].media.document.mimeType
    const filePath = `output.mp4`
    // const bufferData = result.messages[0].media.document.fileReference

    return new Promise((resolve, reject) => {
      fs.writeFile(filePath, buffer, (err) => {
        if (err) {
          console.error("Error writing file:", err)
          reject(err)
          return
        }
        console.log("Video saved successfully!")
        resolve(buffer)
      })
    })
  }
}

module.exports = { findGif }
