import { createRequire } from "module";
const require = createRequire(import.meta.url);
const ddownr = require('denethdev-ytmp3');
import path from "path";
import fs from "fs";
import { client } from "../../../client-init.js";
import youtubesearchapi from "youtube-search-api";
import { Button } from "telegram/tl/custom/button.js";
import { CallbackQuery } from "telegram/events/CallbackQuery.js";

// Store search results temporarily
let searchResults = [];

// Function to handle song download and send the MP3 file to the user
export async function songDownloader(chat, msgID, msgText) {
  const songName = msgText.replace(/\/song/, "").trim(); // Extract the song name
  console.log("🔍 Song name extracted:", songName);
  const results = await getSongUrl(songName, chat, msgID);
  console.log("🔍 Results received:", results);
  if (results === "VIDEO_LENGTH_EXCEEDS") return;
  if (!results) {
    await client.sendMessage(chat, {
      message: "❌ Failed to retrieve song results.",
      replyTo: msgID,
    });
    return;
  }

  // Store the results
  searchResults = results;
  console.log("🔍 Results stored in array:", searchResults);

  // For pagination, show 5 results per page
  const PAGE_SIZE = 5;
  const totalPages = Math.ceil(results.length / PAGE_SIZE);
  const currentPage = 1; // Start on the first page
  
  // Get results for the current page
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, results.length);
  const pageResults = results.slice(startIndex, endIndex);
  console.log("🔍 Page results:", pageResults);
  
  // Create buttons for each song result on the current page
  const buttons = pageResults.map((result, index) => [
    Button.inline(`${startIndex + index + 1}. ${result.title} (Duration: ${result.duration})`, 
                 Buffer.from(`select-song|${startIndex + index}`))
  ]);

  // Add pagination buttons
  const paginationButtons = [];
  if (totalPages > 1) {
    if (currentPage > 1) {
      paginationButtons.push(Button.inline("Previous", Buffer.from(`prev-page|${currentPage - 1}`)));
    }
    if (currentPage < totalPages) {
      paginationButtons.push(Button.inline("Next", Buffer.from(`next-page|${currentPage + 1}`)));
    }
  }

  // Send the buttons to the user
  await client.sendMessage(chat, {
    message: `🎶 Here are the top results (Page ${currentPage}/${totalPages}):`,
    replyTo: msgID,
    buttons: [...buttons, paginationButtons],
    parseMode: "markdown",
  });
}

// Function to handle user selection of a song from search results
export async function handleSongSelection(event) {
  // Extract data from the event
  const chat = event.query.peer.userId; // Extract the user ID for private chats
  const msgID = event.query.msgId;
  const callbackData = event.query.data.toString(); // Convert Buffer to string
  
  console.log("🔍 Event received:", event); // Log the entire event for debugging
  console.log("🔍 Callback data received:", callbackData); // Log the incoming callback data
  
  const [action, indexStr] = callbackData.split("|");
  
  if (action === "select-song") {
    const index = parseInt(indexStr);
    
    // Retrieve the stored search results
    const results = searchResults;
    console.log("🔍 Results retrieved from array:", results);
    
    if (!results) {
      await client.sendMessage(chat, {
        message: "❌ Search results not found. Please initiate a new search.",
        replyTo: msgID,
      });
      return;
    }
    
    // Validate the selection
    if (isNaN(index) || index < 0 || index >= results.length) {
      await client.sendMessage(chat, {
        message: `❌ Invalid selection. Please choose a valid song.`,
        replyTo: msgID,
      });
      return;
    }
    
    // Get the selected song
    const selectedSong = results[index];
    const songUrl = `https://www.youtube.com/watch?v=${selectedSong.videoId}`;
    
    // Clear the search results from storage
    searchResults = [];
    console.log("🔍 Results cleared from array:", searchResults);
    
    // Proceed with downloading the selected song
    await downloadSelectedSong(chat, msgID, selectedSong);
  } else if (action === "next-page" || action === "prev-page") {
    const pageNumber = parseInt(indexStr);
    
    // Retrieve the stored search results
    const results = searchResults;
    console.log("🔍 Results retrieved for pagination:", results);
    
    if (!results) {
      await client.sendMessage(chat, {
        message: "❌ Search results not found. Please initiate a new search.",
        replyTo: msgID,
      });
      return;
    }
    
    // For pagination, show 5 results per page
    const PAGE_SIZE = 5;
    const totalPages = Math.ceil(results.length / PAGE_SIZE);
    
    // Validate the page number
    if (isNaN(pageNumber) || pageNumber < 1 || pageNumber > totalPages) {
      await client.sendMessage(chat, {
        message: `❌ Invalid page number. Please choose a valid page.`,
        replyTo: msgID,
      });
      return;
    }
    
    // Get results for the current page
    const startIndex = (pageNumber - 1) * PAGE_SIZE;
    const endIndex = Math.min(startIndex + PAGE_SIZE, results.length);
    const pageResults = results.slice(startIndex, endIndex);
    
    // Create buttons for each song result on the current page
    const buttons = pageResults.map((result, index) => [
      Button.inline(`${startIndex + index + 1}. ${result.title} (Duration: ${result.duration})`, 
                   Buffer.from(`select-song|${startIndex + index}`))
    ]);

    // Add pagination buttons
    const paginationButtons = [];
    if (totalPages > 1) {
      if (pageNumber > 1) {
        paginationButtons.push(Button.inline("Previous", Buffer.from(`prev-page|${pageNumber - 1}`)));
      }
      if (pageNumber < totalPages) {
        paginationButtons.push(Button.inline("Next", Buffer.from(`next-page|${pageNumber + 1}`)));
      }
    }

    // Send the buttons to the user
    await client.editMessage(chat, {
      message: `🎶 Here are the top results (Page ${pageNumber}/${totalPages}):`,
      buttons: [...buttons, paginationButtons],
      parseMode: "markdown",
    });
  }
}

// Function to download a selected song directly
async function downloadSelectedSong(chat, msgID, selectedSong) {
  const songUrl = `https://www.youtube.com/watch?v=${selectedSong.videoId}`;
  const songName = selectedSong.title;
  
  const progressMessage = await client.sendMessage(chat, {
    message: `🔍 Downloading **"${songName}"** for you...`,
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
    console.error("❌ Error in downloadSelectedSong:", error);
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
async function getSongUrl(inputString, chat, msgID) {
  try {
    console.log("🔍 Searching for:", inputString);
    const data = await youtubesearchapi.GetListByKeyword(
      inputString,
      false,
      5, // Fetch top 5 results
      { type: "video" }
    );

    console.log("📊 Raw data received from YouTube API:", JSON.stringify(data, null, 2));

    if (data?.items?.length > 0) {
      console.log(`✅ Found ${data.items.length} items, processing...`);
      const results = data.items.map((item, index) => {
        console.log(`📦 Processing item ${index}:`, JSON.stringify(item, null, 2));
        
        const videoId = item.id;
        const title = item.title;
        
        // Log individual properties for debugging
        console.log(`📍 Item ${index} - ID:`, videoId);
        console.log(`📝 Item ${index} - Title:`, title);
        console.log(`🖼️ Item ${index} - Thumbnails:`, item.thumbnail);
        console.log(`⏱️ Item ${index} - Length:`, item.length);
        
        // Check if thumbnails exist and have at least one element
        // The API returns "thumbnail" (singular) not "thumbnails" (plural)
        const thumbnail = item.thumbnail && item.thumbnail.thumbnails && item.thumbnail.thumbnails.length > 0 
          ? item.thumbnail.thumbnails[0].url 
          : "https://via.placeholder.com/120x90.png?text=No+Thumbnail"; // Fallback thumbnail
        const duration = item.length?.simpleText || "Unknown duration"; // Get duration if available
        
        console.log(`🖼️ Item ${index} - Selected thumbnail:`, thumbnail);
        console.log(`⏱️ Item ${index} - Duration:`, duration);
        
        return { videoId, title, thumbnail, duration };
      });

      console.log("✅ Processed results:", JSON.stringify(results, null, 2));
      return results; // Return an array of results
    } else {
      console.error("❌ No video found for the input string.");
      return null;
    }
  } catch (error) {
    console.error("💥 Error in getSongUrl:", error);
    if(error.message=="VIDEO_LENGTH_EXCEEDS"){
      await client.sendMessage(chat, {message:"Video length is greater than 5 minutes"})
      return error.message
    }
    return null;
  }
}
