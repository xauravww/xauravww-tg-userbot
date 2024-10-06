// Import necessary modules
import { createRequire } from "module";
import { Downloader } from "ytdl-mp3";
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

// Main function to download the song
async function main(songUrl) {
  try {
    const outputDir = `${path.resolve(
      "./controllers/Functions/yt2mp3/output"
    )}`;
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const downloader = new Downloader({
      getTags: false,
      verifyTags: false,
      outputDir,
      requestOptions: {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
        },
      },
    });

    const fileName = await downloader.downloadSong(songUrl);
    return fileName; // Return the file name for later use
  } catch (error) {
    console.error("Error in main downloader function:", error);
    return null; // Return null if an error occurs
  }
}

// Function to handle song download and send the MP3 file to the user
export async function songDownloader(chat, msgID, msgText) {
  const songName = msgText.split(" ")[1]; // Extract the song name from the message
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

  const downloadedFileName = await main(songUrl);
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
