import { Client } from "@gradio/client";
import { client } from "../../client.js";
import { Button } from "telegram/tl/custom/button.js";
import { CallbackQuery } from "telegram/events/CallbackQuery.js";
import { promises as fs } from "fs";
import path from "path";
import axios from "axios";
import { LocalStorage } from "node-localstorage";
import { Api } from 'telegram'
const localStorage = new LocalStorage('./scratch'); // Folder to store data

// Function to set data to local storage for a specific user
function setUserData(userId, key, value) {
  let userData = JSON.parse(localStorage.getItem(userId)) || {};
  userData[key] = value;
  localStorage.setItem(userId, JSON.stringify(userData));
}

// Function to get data from local storage for a specific user
function getUserData(userId, key) {
  let userData = JSON.parse(localStorage.getItem(userId)) || {};
  return userData[key];
}

export async function genImage(userId, chat, msgId, message) {
  console.table(JSON.stringify(userId, chat, msgId, message))
  // Store data for the specific user
  setUserData(userId, 'globalChat', chat);
  setUserData(userId, 'globalMessage', message.replace(/\/ben/, ""));

  const settings = {
    model: "sauravtechno/alvdansen-flux-koda",
  };

  try {
    const instanceClient = await Client.connect(settings.model, {
      events: ["data", "status", "error", "done", "cancel", "log"],
    });
    console.log("Connected to Gradio client.");

    const initialMessage = await client.sendMessage(chat, {
      message: "Image generation is underway. Please hold on...",
      replyTo: msgId,
    });

    setUserData(userId, 'globalInitialMessage', initialMessage); // Store initial message
    console.log("Initial message sent: Image generation is underway.");

    const submission = instanceClient.submit("/predict", { param_0: message });
    console.log("Image generation started.");

    for await (const msg of submission) {
      console.log("Received message:", msg);

      if (msg.type === "data") {
        if (msg.data?.length > 0) {
          const imageUrl = msg.data[0]?.url;
          setUserData(userId, 'imageUrl', imageUrl); // Store image URL
          console.log("Image URL received:", imageUrl);

          clearInterval(getUserData(userId, 'intervalId')); // Clear interval when done
          
          const markup = client.buildReplyMarkup(
            Button.inline("Download Image", Buffer.from("download_image"))
          );
          await client.editMessage(chat, {
            message: initialMessage.id,
            text: `Image generation complete!\nClick the button below to download the image.`,
            buttons: markup,
          });

          await client.sendMessage(chat, {
            message: message,
            file: imageUrl,
          });
          console.log("Final message sent with buttons.");
          return;
        }
      }

      if (msg.type === "status") {
        const currentStatus = `Image generation status: ${msg.stage}`;
        const progressStatus = msg.eta
          ? `Estimated time: ${msg.eta.toFixed(2)} seconds`
          : "No ETA available";

        // Store ETA with buffer time for the user
        setUserData(userId, 'globalETA', msg.eta ? msg.eta + 6 : 1);

        if (getUserData(userId, 'editCount') < 5) {
          setUserData(userId, 'editCount', (getUserData(userId, 'editCount') || 0) + 1);
          startProgressUpdate(userId, initialMessage.id, currentStatus, progressStatus);
        }
      }
    }
  } catch (error) {
    console.error("Error occurred while generating image:", error);
    await client.sendMessage(chat, {
      message: "An error occurred during image generation. Please try again later.",
      replyTo: msgId,
    });
  }
}

function startProgressUpdate(userId, messageId, currentStatus, progressStatus) {
  // Clear any existing interval for the user
  if (getUserData(userId, 'intervalId')) {
    clearInterval(getUserData(userId, 'intervalId'));
  }

  let elapsedTime = 0;
  const intervalId = setInterval(async () => {
    elapsedTime += 10;
    let newStatusMessage = `Generating your image...\nEstimated time left: ${getUserData(userId, 'globalETA') - elapsedTime} seconds.`;

    if (elapsedTime >= 10 && elapsedTime < 20) {
      newStatusMessage = `Still working on your image...\nEstimated time remaining: ${getUserData(userId, 'globalETA') - elapsedTime} seconds.`;
    } else if (elapsedTime >= 20 && elapsedTime < 30) {
      newStatusMessage = `Almost there! Your image is being finalized...\nEstimated time left: ${getUserData(userId, 'globalETA') - elapsedTime} seconds.`;
    } else if (elapsedTime >= 30) {
      clearInterval(intervalId);
    }

    await client.editMessage(getUserData(userId, 'globalChat'), {
      message: messageId,
      text: `${currentStatus}\n${newStatusMessage}`,
    });
  }, 10000);

  setUserData(userId, 'intervalId', intervalId); // Store interval ID for the user
}

client.addEventHandler(ButtonHandler, new CallbackQuery({}));
// ButtonHandler for handling download_image button press
async function ButtonHandler(event) {
  const userId = event.query.userId; // Assuming userId is in the event
  const callbackQueryId = event.query.queryId; // Get the callback query ID
  console.log(JSON.stringify(event.query))
  const callbackData = event.query.data.toString("utf-8");

  switch (callbackData) {
    case "download_image":
      const imageUrl = getUserData(userId, 'imageUrl');
      const globalChat = getUserData(userId, 'globalChat');
      const globalInitialMessage = getUserData(userId, 'globalInitialMessage');

      // Ensure imageUrl exists
      if (!imageUrl) {
        console.error("Error: imageUrl is undefined.");
        await client.sendMessage(globalChat.chatId || globalInitialMessage.peerId.userId, {
          message: "Error: Image URL not found. Please try again.",
        });
        return; // Exit the handler if no imageUrl
      }

      try {
        // Show an alert to the user about the download starting
        await client.invoke(new Api.messages.SetBotCallbackAnswer({
          queryId: callbackQueryId, // Use the query ID from event
          message: "Your image download is starting...",
          alert: true, // Show as an alert popup
        }));

        // Perform image download and save the file
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data, 'binary');
        const fileName = `${userId}.png`; // Use userId for file name

        // Save image to file system
        await fs.writeFile(fileName, buffer);

        // Send the downloaded image back to the chat
        await client.sendMessage(globalChat.chatId || globalInitialMessage.peerId.userId, {
          message: getUserData(userId, 'globalMessage'),
          file: path.resolve(`./${fileName}`),
        });

        // Delete the image file after sending
        if (path.resolve(`./${fileName}`)) {
          await fs.unlink(path.resolve(`./${fileName}`));
        }

        // Update the original message to confirm success
        await client.editMessage(globalChat.chatId || globalInitialMessage.peerId.userId, {
          message: getUserData(userId, 'globalInitialMessage').id,
          text: `Image Downloaded Successfully`,
          buttons: null, // Remove buttons after download
        });

      } catch (error) {
        console.error("Error occurred while downloading the image:", error);

        // Show an alert in case of error
        await client.invoke(new Api.messages.SetBotCallbackAnswer({
          queryId: callbackQueryId,
          message: "Failed to download image. Please try again.",
          alert: true,
        }));
      }
      break;

    default:
      console.log("Unknown Button Clicked");
  }
}