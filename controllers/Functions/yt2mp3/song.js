// Import necessary modules
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
import dotenv from 'dotenv';
import { google } from 'googleapis';

dotenv.config();

// Global object to store downloaded songs
const songsGlobalObject = {};

// Configure OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

// Load tokens from local storage or create a new tokens.json if it doesn't exist
const tokenFilePath = './tokens.json';

if (fs.existsSync(tokenFilePath)) {
    const storedTokens = JSON.parse(fs.readFileSync(tokenFilePath, 'utf-8'));
    if (storedTokens.access_token) {
        oauth2Client.setCredentials(storedTokens);
    }
} else {
    // Initialize the tokens.json file if it doesn't exist
    fs.writeFileSync(tokenFilePath, JSON.stringify({}));
}

// Generate authentication URL
function getAuthUrl() {
  const scopes = [
    'https://www.googleapis.com/auth/youtube.readonly', // Adjust scopes as necessary
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
  });
}

// Handle OAuth2 callback and get access token
export async function getAccessToken(code) {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  // Store tokens securely (e.g., in a file)
  fs.writeFileSync(tokenFilePath, JSON.stringify(tokens));
  console.log('Tokens acquired:', tokens);
}

// Refresh token if needed before making requests
async function refreshAccessTokenIfNeeded() {
    const { credentials } = oauth2Client;
    if (credentials.expiry_date && credentials.expiry_date < Date.now()) {
        const newTokens = await oauth2Client.refreshAccessToken();
        oauth2Client.setCredentials(newTokens.credentials);
        
        // Update stored tokens after refreshing
        fs.writeFileSync(tokenFilePath, JSON.stringify(newTokens.credentials));
        console.log('Access token refreshed:', newTokens.credentials);
    }
}

// Main function to download the song using yt-stream
async function main(songUrl, songName) {
  try {
    const outputDir = `${path.resolve("./controllers/Functions/yt2mp3/output")}`;
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

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
  // Check if user needs to authenticate first
  if (!oauth2Client.credentials.access_token) {
    const authUrl = getAuthUrl();
    await client.sendMessage(chat, {
      message: `Please authorize this app by visiting this URL: ${authUrl} \n\n\n This is one time process after deployment.\n\n Please tell the developer ${process.env.DEV_USERNAME} to complete this process`,
      replyTo: msgID,
    });
    return;
  }

  // Refresh token if needed before proceeding
  await refreshAccessTokenIfNeeded();

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

  const downloadedFileName = await main(songUrl, songName);
  
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