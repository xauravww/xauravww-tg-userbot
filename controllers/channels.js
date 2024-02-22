const { Api, TelegramClient } = require("telegram")
const { StringSession } = require("telegram/sessions")

const dotenv = require("dotenv")
dotenv.config({ path: "./env" })

const fs = require("fs")
const { client, connectClient } = require("../client")

async function findGif() {
  connectClient()
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
