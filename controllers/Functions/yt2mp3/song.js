import { createRequire } from "module";
const require = createRequire(import.meta.url);
const ddownr = require('denethdev-ytmp3');
import path from "path";
import fs from "fs";
import { client } from "../../../client-init.js";
import youtubesearchapi from "youtube-search-api";

// Function to handle song download and send the MP3 file to the user
export async function songDownloader(chat, msgID, msgText) {
  const songName = msgText.replace(/\/song/, "").trim(); // Extract the song name
  const songUrl = await getSongUrl(songName,chat,msgID);
if(songUrl=="VIDEO_LENGTH_EXCEEDS") return
  if (!songUrl) {
    await client.sendMessage(chat, {
      message: "❌ Failed to retrieve the song URL.",
      replyTo: msgID,
    });
    return;
  }

  const progressMessage = await client.sendMessage(chat, {
    message: `🔍 Searching and downloading **"${songName}"** for you...`,
    replyTo: msgID,
    parseMode: "markdown",
  });

  try {
    const response = await ddownr.download(songUrl, 'mp3');


    if (!response || !response.downloadUrl) {
      throw new Error("Failed to get download URL from ddownr");
    }

    const rawTitle = response.title || songName;
    const image = response.image;
    
    // Sanitize the title to create a safe filename
    const sanitizedTitle = rawTitle.replace(/[\/\\:*?"<>|]/g, "_");
    const MAX_FILENAME_LENGTH = 100;
    const safeTitle = sanitizedTitle.length > MAX_FILENAME_LENGTH 
      ? sanitizedTitle.slice(0, MAX_FILENAME_LENGTH) 
      : sanitizedTitle;

    const filePath = path.join(process.cwd(), `${safeTitle}.mp3`);

    // Download the mp3 file
    const downloadedFile = await downloadFile(response.downloadUrl, filePath);

    //delete the progressMessage
    if(progressMessage){
      await client.deleteMessages(chat, [progressMessage.id], {revoke:true});
    }
    // Send the thumbnail image with title
    if (image) {
      await client.sendFile(chat, {
        file: image,
        caption: `🎧 *${rawTitle}*\nSending your song below 👇`,
        replyTo: msgID,
      });
    }

    // Send the downloaded MP3 file
    await client.sendFile(chat, {
      file: downloadedFile,
      caption: `🎧 Here is your requested song: *${rawTitle}*`,
      replyTo: msgID,
      parseMode: "markdown",
    });

    // Clean up the downloaded file after sending
    try {
      await fs.promises.unlink(downloadedFile);
    } catch (err) {
      console.error("❌ Failed to delete file:", err);
    }

  } catch (error) {
    console.error("❌ Error in songDownloader:", error);
    await client.sendMessage(chat, {
      message: "❌ Failed to download the requested song.",
      replyTo: msgID,
    });
  }
}

// Download the file from URL to disk
async function downloadFile(url, filePath) {
  const axios = require('axios');
  const response = await axios({
    method: "get",
    url: url,
    responseType: "stream",
  });

  const writer = fs.createWriteStream(filePath);
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", () => resolve(filePath));
    writer.on("error", reject);
  });
}

// Get YouTube video URL from song name or input
async function getSongUrl(inputString,chat,msgID) {
  try {
    const data = await youtubesearchapi.GetListByKeyword(
      inputString,
      false,
      1,
      { type: "video" }
    );

    if (data?.items?.length > 0) {
      const videoId = data.items[0].id;
      if(parseInt(data.items[0].length.simpleText.split(':')[0])>5) throw new Error("VIDEO_LENGTH_EXCEEDS")
      return `https://www.youtube.com/watch?v=${videoId}`;
    } else {
      console.error("No video found for the input string.");
      return null;
    }
  } catch (error) {
    console.error("Error in getSongUrl:", error.message);
    if(error.message=="VIDEO_LENGTH_EXCEEDS"){
      await client.sendMessage(chat, {message:"Video length is greater than 5 minutes"})
      return error.message
    }
    return null;
  }
}
