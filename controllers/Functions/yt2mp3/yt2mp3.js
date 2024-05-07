import { createRequire } from "module";
import path from "path";

const require = createRequire(import.meta.url);
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const ytdl = require("ytdl-core");
import { client } from "../../../client.js";
const youtubesearchapi = require("youtube-search-api");

function mp3Downloader(inputString, msgToEditId, chat) {
  return new Promise((res, rej) => {
    try {
      youtubesearchapi
        .GetListByKeyword(inputString, false, 1, { type: "video" })
        .then((data) => {
          const videoLink = `https://www.youtube.com/watch?v=${data.items[0].id}`;
          const infoVideo = ytdl.getInfo(videoLink);

          infoVideo.then((info) => {
            const videoTitle = info.videoDetails.title;

            client.editMessage(chat, {
              message: msgToEditId,
              text: `Downloading this video:\n${videoTitle}`
            });

            let audioFormats = ytdl.filterFormats(info.formats, "audioandvideo");
            const format = ytdl.chooseFormat(info.formats, { quality: "18" });
            const outputFilePath = `./controllers/Functions/yt2mp3/output/video.mp4`;

            if (outputFilePath) {
              const outputStream = fs.createWriteStream(outputFilePath);

              ytdl.downloadFromInfo(info, { format: format }).pipe(outputStream);

              outputStream.on("finish", () => {
                client.editMessage(chat, {
                  message: msgToEditId,
                  text: `Finished downloading mp4, now converting to mp3...`
                });
                convertToMP3(msgToEditId, chat)
                  .then(() => {
                    client.editMessage(chat, {
                      message: msgToEditId,
                      text: `Now sending you the file.mp3...wait...`
                    });
                    res(videoTitle);
                  })
                  .catch((err) => {
                    rej("Some error occurred while exporting mp3");
                  });
              });
              outputStream.on("error", (err) => {
                console.error(err);
                rej(err);
              });
            } else {
              rej("Some error occurred: no video found");
            }
          });
        })
        .catch((err) => {
          rej(err);
        });
    } catch (error) {
      rej("Some error occurred while exporting mp3");
    }
  });
}

function convertToMP3(msgToEditId, chat) {
  return new Promise((res, rej) => {
    try {
      const video = path.resolve("./controllers/Functions/yt2mp3/output/video.mp4");

      ffmpeg(video)
        .toFormat("mp3")
        .saveToFile(`./controllers/Functions/yt2mp3/output/file.mp3`)
        .on("error", (err) => {
          console.error("An error occurred:", err.message);
          rej(err.message);
        })
        .on("progress", (progress) => {
          client.editMessage(chat, {
            message: msgToEditId,
            text: `Conversion progress: ${progress.timemark}`
          });
        })
        .on("end", () => {
          console.log("Conversion completed");
          client.editMessage(chat, {
            message: msgToEditId,
            text: `Conversion completed....Wait...`
          });
          res("Conversion completed");
        });
    } catch (error) {
      rej(error);
    }
  });
}

export { mp3Downloader };
