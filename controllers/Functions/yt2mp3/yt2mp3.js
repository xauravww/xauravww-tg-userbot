import { createRequire } from "module"
import path from "path"

const require = createRequire(import.meta.url)
const ffmpeg = require("fluent-ffmpeg")
const fs = require("fs")
const ytdl = require("ytdl-core")
import { client } from "../../../client.js"
const youtubesearchapi = require("youtube-search-api")

function mp3Downloader(inputString, msgToEditId, chat) {
  try {
    return new Promise((res, rej) => {
      youtubesearchapi
        .GetListByKeyword(inputString, false, 1, { type: "video" })
        .then((data) => {
          const videoLink = `https://www.youtube.com/watch?v=${data.items[0].id}`
          // console.log(videoLink)
          const infoVideo = ytdl.getInfo(videoLink)

          infoVideo.then((info) => {
            // console.log(info.videoDetails.title)
            const videoTitle = info.videoDetails.title

            client.editMessage(chat, {
              message: msgToEditId,
              text: `Downloading this video : \n${videoTitle}`
            })

            let audioFormats = ytdl.filterFormats(info.formats, "audioandvideo")
            console.log("Formats with only audio: " + audioFormats)
          
            const format = ytdl.chooseFormat(info.formats, { quality: "18" })

            const outputFilePath = `./controllers/Functions/yt2mp3/output/video.mp4`


            if (outputFilePath) {
              const outputStream = fs.createWriteStream(outputFilePath)

              ytdl.downloadFromInfo(info, { format: format }).pipe(outputStream)

              outputStream.on("finish", () => {
                console.log(`Finished downloading: ${outputFilePath}`)
                client.editMessage(chat, {
                  message: msgToEditId,
                  text: `Finished downloading mp4 , now converting to mp3 ...`
                })
                convertToMP3(msgToEditId, chat)
                  .then(() => {
                    client.editMessage(chat, {
                      message: msgToEditId,
                      text: `Now sending you the file.mp3...wait...`
                    })
                    res(videoTitle)
                  })
                  .catch((err) => {
                    rej("Some error occured while exporting mp3")
                  })
              })
              outputStream.on("error", (err) => {
                console.log(err)
                return
              })
            } else {
              rej("Some error occured : no video found 2")
            }
          })
        })
        .catch((err) => {
          if (!fs.existsSync(videoPath)) {
            sendMessageInDM(`No mp4 found`, senderId)
            return
          }
          sendMessageInDM(err, senderId)
        })
    })
  } catch (error) {
    rej("Some error occured while exporting mp3")
  }
}

function convertToMP3(msgToEditId, chat) {
  try {
    return new Promise((res, rej) => {
      const video = path.resolve(
        "./controllers/Functions/yt2mp3/output/video.mp4"
      )
      console.log(video)
      ffmpeg(video)
        .toFormat("mp3")
        .saveToFile(`./controllers/Functions/yt2mp3/output/file.mp3`)
        .on("error", (err) => {
          console.error("An error occurred:", err.message)
          rej(err.message)
        })
        .on("progress", (progress) => {
          client.editMessage(chat, {
            message: msgToEditId,
            text: `Conversion progress: ${progress.timemark}`
          })
        })
        .on("end", () => {
          console.log("Conversion completed")
          client.editMessage(chat, {
            message: msgToEditId,
            text: `Conversion completed....Wait...`
          })
          res("Conversion completed")
        })
    }).catch((err) => {
      console.log(err)
      rej(err)
    })
  } catch (error) {
    rej(error)
  }
}

export { mp3Downloader }
