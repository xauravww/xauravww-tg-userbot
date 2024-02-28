import { createRequire } from "module"
import path from "path"

const require = createRequire(import.meta.url)
const ffmpeg = require("fluent-ffmpeg")
const fs = require("fs")
const ytdl = require("ytdl-core")

const youtubesearchapi = require("youtube-search-api")

function mp3Downloader(inputString) {
  return new Promise((res, rej) => {
    youtubesearchapi
      .GetListByKeyword(inputString, false, 1, { type: "video" })
      .then((data) => {
        const videoLink = `https://www.youtube.com/watch?v=${data.items[0].id}`
        console.log(videoLink)
        const infoVideo = ytdl.getInfo(videoLink)

        infoVideo.then((info) => {
          let audioFormats = ytdl.filterFormats(info.formats, "audioandvideo")
          console.log("Formats with only audio: " + audioFormats)
          // audioFormats.map((item) => {
          //   console.log(item)
          // })
          const format = ytdl.chooseFormat(info.formats, { quality: "18" })

          const outputFilePath = `video.mp4`
          const outputStream = fs.createWriteStream(outputFilePath)

          ytdl.downloadFromInfo(info, { format: format }).pipe(outputStream)

          outputStream.on("finish", () => {
            console.log(`Finished downloading: ${outputFilePath}`)
            convertToMP3().then(() => {
              res("Successfully Exported mp3 file")
            })
          })
          // .catch((err) => {
          //   console.error(err)
          //   rej(err)
          // })
        })
      })
  })
}

function convertToMP3() {
  return new Promise((res, rej) => {
    const video = path.resolve("./video.mp4")
    console.log(video)
    ffmpeg(video)
      .toFormat("mp3")
      .saveToFile(`file.mp3`)
      .on("error", (err) => {
        console.error("An error occurred:", err.message)
        rej(err.message)
      })
      .on("progress", (progress) => {
        // console.log(`Conversion progress: ${JSON.stringify(progress)}%`)
        console.log(`Conversion progress: ${progress.timemark}`)
      })
      .on("end", () => {
        console.log("Conversion completed")
        res("Conversion completed")
      })
  })
}

export { mp3Downloader }
