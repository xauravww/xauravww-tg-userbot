// Import necessary modules
import { createRequire } from "module";
import ytstream from 'yt-stream'; 
import path from "path";
import fs from "fs";
import { client } from "../../../client.js";
import youtubesearchapi from "youtube-search-api";
import {
  setvalueData,
  getvalueData,
  deletevalueData,
} from "../../utils/localStorageUtils.js";

// Global object to store downloaded songs
const songsGlobalObject = {};

// Main function to download the song using yt-stream
async function main(songUrl,songName) {
  try {
    const outputDir = `${path.resolve(
      "./controllers/Functions/yt2mp3/output"
    )}`;
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // const songId = new URL(songUrl).searchParams.get('v'); // Extract video ID from URL
    const filePath = path.join(outputDir, `${songName}.mp3`); 

    const stream = await ytstream.stream(songUrl, {
      quality: 'high',
      type: 'audio',
      highWaterMark: 1048576 * 32,
      download: true,
    });

    // Pipe the stream to a file
    const writeStream = fs.createWriteStream(filePath);
    stream.stream.pipe(writeStream);

    return new Promise((resolve, reject) => {
      writeStream.on('finish', () => {
        console.log(`Downloaded file at ${filePath}`);
        resolve(filePath); 
      });

      writeStream.on('error', (error) => {
        console.error("Error writing file:", error);
        reject(error); 
      });
    });
  } catch (error) {
    console.error("Error in main downloader function:", error);
    return null; 
  }
}

// Function to handle song download and send the MP3 file to the user
export async function songDownloader(chat, msgID, msgText) {
  const songName = msgText.replace(/\/song/, "");
  const songUrl = await getSongUrl(msgText);

  if (!songUrl) {
    console.error("Failed to get song URL");
    await client.sendMessage(chat, {
      message: "Failed to retrieve the song URL.",
      replyTo: msgID,
    });
    return;
  }

  // Check if the song already exists in localStorage
  const storedFileName = getvalueData(songUrl);
  if (storedFileName && fs.existsSync(storedFileName)) {
    // Send the previously downloaded file
    console.log(`Sending the previously downloaded file for ${songName}...`);

    await client.sendFile(chat, {
      file: storedFileName,
      caption: `Here is your requested song: ${songName} (previously downloaded)`,
      replyTo: msgID,
    });

    // Remove the song from localStorage after sending
    deletevalueData(songUrl);
    console.log(`Deleted ${songName} from localStorage after sending.`);
    return;
  }

  const firstReplyMessage = await client.sendMessage(chat, {
    message: "Downloading the song for you...",
    replyTo: msgID,
  });

  const downloadedFileName = await main(songUrl,songName);
  console.log("Downloaded file at " + downloadedFileName);

  if (downloadedFileName && fs.existsSync(downloadedFileName)) {
    // Store the song in localStorage and global object
    setvalueData(songUrl, downloadedFileName);
    songsGlobalObject[songUrl] = downloadedFileName;

    // Send the MP3 file to the user
    await client.editMessage(chat, {
      message: firstReplyMessage.id,
      text: "File has been downloaded successfully. \n Hold On !!! Sending you in a few seconds.",
    });

    await client.sendFile(chat, {
      file: downloadedFileName,
      caption: `Here is your requested song: ${songName}`,
      replyTo: msgID,
    });

    // Remove the MP3 file after sending
    try {
      await fs.promises.unlink(downloadedFileName);
      console.log(`Successfully deleted file: ${downloadedFileName}`);
    } catch (err) {
      console.error("Failed to delete file:", err);
    }
  } else {
    await client.sendMessage(chat, {
      message: "Failed to download the requested song.",
      replyTo: msgID,
    });
  }
}

// Function to get the YouTube URL based on the song name or input string
async function getSongUrl(inputString) {
  try {
    const data = await youtubesearchapi.GetListByKeyword(
      inputString,
      false,
      1,
      { type: "video" }
    );

    if (data?.items?.length > 0) {
      const videoLink = `https://www.youtube.com/watch?v=${data.items[0].id}`;
      return videoLink;
    } else {
      console.error("No video found for the given input string.");
      return null;
    }
  } catch (error) {
    console.error("Error in getting song URL:", error);
    return null; // Return null in case of any error
  }
}