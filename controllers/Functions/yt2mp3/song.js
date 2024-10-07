// Import necessary modules
import { createRequire } from "module";
import path from "path";
import fs from "fs";
import { client } from "../../../client-init.js";
import youtubesearchapi from "youtube-search-api";
import {
  setvalueData,
  getvalueData,
  deletevalueData,
} from "../../utils/localStorageUtils.js";
import axios from "axios";

// Global object to store downloaded songs
const songsGlobalObject = {};




async function main(songUrl,songName) {
  try {
    // Fetch stream URL from API
    const apiResponse = await axios.post(process.env.YT_DOWNLOADER_API_URL, {
      filenamePattern: "pretty",
      isAudioOnly: true,
      url: songUrl
    });

    if (apiResponse.data.status !== 'stream') {
      throw new Error("Failed to get stream URL");
    }

    const streamUrl = apiResponse.data.url;
    console.log("Stream URL received:", streamUrl);

    // Define the path for the MP3 file using path.join()
    const mp3FilePath = path.join(process.cwd(), `${songName}.mp3`);

    // Download the MP3 file
    const response = await axios({
      method: 'get',
      url: streamUrl,
      responseType: 'stream'
    });

    // Pipe the response data to a file
    const writer = fs.createWriteStream(mp3FilePath);
    
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        console.log(`MP3 file saved to ${mp3FilePath}`);
        resolve(mp3FilePath); // Return the path of the saved MP3 file
      });
      writer.on('error', (error) => {
        console.error("Error writing MP3 file:", error);
        reject(error); // Reject the promise on error
      });
    });
  } catch (error) {
    console.error("Error in main downloader function:", error);
    return null; // Return null if an error occurs
  }
}
// Function to handle song download and send the MP3 file to the user
export async function songDownloader(chat, msgID, msgText) {
  const songName = msgText.replace(/\/song/, ""); // Extract the song name from the message
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
    console.log(`Sending the previously downloaded file for ${songName}...`);
    await client.sendFile(chat, {
      file: storedFileName,
      caption: `Here is your requested song: ${songName} (previously downloaded)`,
      replyTo: msgID,
    });

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
    setvalueData(songUrl, downloadedFileName);
    songsGlobalObject[songUrl] = downloadedFileName;

    await client.editMessage(chat, {
      message: firstReplyMessage.id,
      text: "File has been downloaded successfully. \n Hold On !!! Sending you in a few seconds.",
    });

    await client.sendFile(chat, {
      file: downloadedFileName,
      caption: `Here is your requested song: ${songName}`,
      replyTo: msgID,
    });

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