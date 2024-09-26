import { Client } from "@gradio/client";
import { client } from "../../client.js";
import { Button } from "telegram/tl/custom/button.js";
import { CallbackQuery } from "telegram/events/CallbackQuery.js";
import { promises as fs } from "fs";
import path from "path";
import axios from "axios";
import { message } from "telegram/client/index.js";
let globalETA = 0; // Global variable to track ETA
let intervalId = null; // Variable to store the interval ID for progress updates
let globalChat = null; // Global variable for chat context
let editCount = 0; // Counter for message edits
let imageUrl = ""; // Variable to store the generated image URL
let globalMessage = ""; 
let globalInitialMessage = "";
export async function genImage(chat, msgId, message) {
  console.log(chat, msgId, message);
  globalChat = chat; // Assign the chat to the global variable
  globalMessage = message
  const settings = {
    // model: "sauravtechno/black-forest-labs-FLUX.1-dev",
    model: "sauravtechno/alvdansen-flux-koda",
  };

  try {
    // Connect to the Gradio client
    const instanceClient = await Client.connect(settings.model, {
      events: ["data", "status", "error", "done", "cancel", "log"],
    });
    console.log("Connected to Gradio client.");

    // Send the initial message to inform the user that the image generation has started
    const initialMessage = await client.sendMessage(globalChat, {
      message: "Image generation is underway. Please hold on...",
      replyTo: msgId,
    });
    globalInitialMessage = initialMessage; // Store the initial message ID for later use
    console.log("Initial message sent: Image generation is underway.");

    // Call the predict method to start image generation
    const submission = instanceClient.submit("/predict", { param_0: message });
    console.log("Image generation started.");

    // Handle progress and status updates
    for await (const msg of submission) {
      console.log("Received message:", msg); // Log the received message

      if (msg.type === "data") {
        if (msg.data?.length > 0) {
          imageUrl = msg.data[0]?.url; // Extract the image URL
          console.log("Image URL received:", imageUrl);

          // Clear the interval when the image is generated
          clearInterval(intervalId);

          // Set final message when the image is ready
          const markup = client.buildReplyMarkup(
            Button.inline("Download Image", Buffer.from("download_image"))
          );
          const btnToDownloadImg = await client.editMessage(globalChat, {
            message: initialMessage.id,
            text: `Image generation complete!\nClick the button below to download the image as a file.`,
            buttons: markup,
          });

          const mess = await client.sendMessage(globalChat, {
            message: message,
            file: imageUrl,
            // forceDocument: true, // Send the image as a document (not as a photo)
          });

          console.log("Final message sent to chat with buttons.");
          return;
        }
      }

      if (msg.type === "status") {
        const currentStatus = `Image generation status: ${msg.stage}`;
        const progressStatus = msg.eta
          ? `Estimated time: ${msg.eta.toFixed(2)} seconds`
          : "No ETA available";

        // Get the ETA and add buffer time
        globalETA = msg.eta ? msg.eta + 6 : 1; // Add a 6-second buffer to ETA

        // Start progress update if the edit count is less than the limit
        if (editCount < 5) {
          editCount++; // Increment the edit count
          startProgressUpdate(initialMessage.id, currentStatus, progressStatus);
        }
      }
    }
  } catch (error) {
    console.error("Error occurred while generating image:", error);
    await client.sendMessage(globalChat, {
      message:
        "An error occurred during image generation. Please try again later.",
      replyTo: msgId,
    });
  }
}

// Function to update progress text based on ETA
function startProgressUpdate(messageId, currentStatus, progressStatus) {
  // Clear any existing interval to prevent multiple timers
  if (intervalId) {
    clearInterval(intervalId);
  }

  let elapsedTime = 0; // Track elapsed time
  intervalId = setInterval(async () => {
    elapsedTime += 10; // Increment elapsed time in seconds

    // Prepare new status messages to simulate progress with ETA
    let newStatusMessage = `Generating your image...\nEstimated time left: ${
      globalETA - elapsedTime
    } seconds.`;

    if (elapsedTime >= 10 && elapsedTime < 20) {
      newStatusMessage = `Still working on your image...\nEstimated time remaining: ${
        globalETA - elapsedTime
      } seconds.`;
    } else if (elapsedTime >= 20 && elapsedTime < 30) {
      newStatusMessage = `Almost there! Your image is being finalized...\nEstimated time left: ${
        globalETA - elapsedTime
      } seconds.`;
    } else if (elapsedTime >= 30) {
      clearInterval(intervalId); // Stop updating after 30 seconds
    }

    // Update the message with new status
    await client.editMessage(globalChat, {
      message: messageId,
      text: `${currentStatus}\n${newStatusMessage}`,
    });
  }, 10000); 
}

// Add event handler for button click using CallbackQuery
client.addEventHandler(ButtonHandler, new CallbackQuery({}));

async function ButtonHandler(event) {
  const callbackQuery = event.query;
  const callbackData = callbackQuery.data.toString("utf-8");

  switch (callbackData) {
    case "download_image":
      // When "Download Image" button is clicked, send the image as a document
      
      // const buffer = await client.downloadMedia(mess, {});
      // console.log(buffer.toJSON());
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer'  // Get the response as a buffer
      });
  
      const buffer = Buffer.from(response.data, 'binary');  // Create a buffer from the data
      console.log("Image downloaded and saved to buffer.");
      await fs.writeFile("file.png", buffer);
      await client.sendMessage(globalChat, {
        message: globalMessage,
        file: path.resolve('./file.png'),
        // forceDocument: true, // Send the image as a document (not as a photo)
      });
      await fs.unlink(path.resolve('./file.png'));
      await client.editMessage(globalChat, {
        message: globalInitialMessage.id,
        text: `Image Downloaded Successfully.`,
        buttons: null,
      });
      break;
    default:
      console.log("Unknown Button Clicked");
  }
}
