import axios from "axios";
import { promises as fs } from "fs";
import { client } from "../../client-init.js";
import { overlayTextOnImage } from "./canvas.js";
import ffmpeg from "fluent-ffmpeg";
import { Button } from "telegram/tl/custom/button.js";
import { CallbackQuery } from "telegram/events/CallbackQuery.js";
// Global variable to hold all chat-related data
import { getReplyMessageId } from "../utils/msg-helper.js"
import dotenv from "dotenv"
import { getGlobalValue } from "../utils/global-context.js";
import path from "path";
import { readFile } from 'node:fs/promises';
dotenv.config({ path: path.resolve(".env") })

const globalchat = {};

import { Api } from "telegram";
import { message } from "telegram/client/index.js";
import { redisClient } from "../utils/redis.js";
import { invokeNvidiaApi } from "./gemini/nvidia.js";

export async function handleBtnsMediaHandler(
  chat,
  msgId,
  message,
  isVideo,
  userId,
  isVoiceOrAudio
) {
  // Store data in the globalchat variable
  globalchat[userId] = {
    chatId: chat.chatId,
    message,
    msgId,
    chat,
    initialMsgId: null, // Initialize initialMsgId here
  };

  // Call the gemini AI with classification prompt and user text
  // console.log("doing classification")
  // Check if Nvidia model is active
  const modelMode = getGlobalValue("model_mode");
  if (modelMode !== "nvidia-pro") {
    await client.sendMessage(chat, {
      message: "Please switch to Funwalabot Pro model for image recognition using /set command.",
      replyTo: msgId,
    });
    return;
  }


  if (modelMode === "nvidia-pro" && !isVideo) {
    try {
      // Download media buffer
      const buffer = await client.downloadMedia(message);
      // Convert buffer to base64 string
      // console.log("message", message)
      const base64String = `${buffer.toString("base64")}`;
      // console.log("base64string:", base64String)
      // Store base64 string in globalchat for later use
      globalchat[userId].base64String = base64String;

      const instruction = `Classify the image:`;

      //send the response to the nvidia model
      const response = await invokeNvidiaApi(instruction, base64String)
      // console.log("response from nvidia:", response.choices[0].message)
      await client.sendMessage(chat, {
        message: response.choices[0].message.content || "Can't classify the image",
        replyTo: msgId,

      })
      return
    } catch (error) {
      console.error("Error converting media to base64:", error);
    }
  }


  // // Convert image or video to base64 string if Nvidia Pro model and not video
  // const modelMode = getGlobalValue("model_mode");
  // if (modelMode === "nvidia-pro" && !isVideo) {
  //   try {
  //     // Download media buffer
  //     const buffer = await client.downloadMedia(message);
  //     // Convert buffer to base64 string
  //     console.log("message",message)
  //     const base64String = `data:${message?.media?.document?.mimeType||"image/jpeg"};base64,${buffer.toString("base64")}`;
  //     // console.log("base64string:",base64String)
  //     // Store base64 string in globalchat for later use
  //     globalchat[userId].base64String = base64String;
  //   } catch (error) {
  //     console.error("Error converting media to base64:", error);
  //   }
  // }

  // Create buttons with a reference to the stored userId
  const buttons = [
    [
      Button.inline(
        "Sign",
        Buffer.from(!isVideo ? `sign-image|${userId}` : `sign-video|${userId}`)
      ),
    ],
  ];

  // Add Ask AI button only if model_mode is nvidia-pro
  if (modelMode === "nvidia-pro" && !isVideo) {
    // buttons.push([
    //   Button.inline("Ask AI", Buffer.from(`ask-ai|${userId}`)),
    // ]);
    //do nothing for now I will do something later
  } else if (!isVideo) {
    // If not nvidia-pro and not video, add a button to inform user to switch model
    buttons.push([
      Button.inline("Switch to Nvidia Pro for AI", Buffer.from(`switch-nvidia-pro|${userId}`)),
    ]);
  }

  const buttons2 = [
    [
      Button.inline(
        "Save to my Database",
        Buffer.from(`save-audio|${userId}`)
      ),
    ],
  ];

  // Send a message with buttons to the user
  const initialMsg = await client.sendMessage(chat, {
    message: `What do you want to do with this media?:`,
    replyTo: msgId,
    buttons: isVoiceOrAudio ? buttons2 : buttons,
    parseMode: "md2",
  });

  // Update initialMsgId in globalchat
  globalchat[userId].initialMsgId = initialMsg.id;
  // setvalueData(userId, initialMsg.id);
}



export async function handleFeed(msgText, messageObj, msgId, chat, originalUserId) {
  // console.log("handled feed successfully")
  // console.log(msgText);
  const messageHavingAFile = await client.getMessages(chat, { ids: messageObj.replyTo.replyToMsgId })
  // // console.log(messageObj.replyTo.replyToMsgId)
  // console.log(messageHavingAFile)
  const media = messageHavingAFile[0]?.media?.document

  const msgFwd = await client.invoke(new Api.messages.SendMedia(
    {
      media: new Api.InputDocument({
        accessHash: media.accessHash,
        fileReference: media.fileReference,
        id: media.id,
      }),
      message: msgText,
      peer: process.env.MY_AUDIO_CHANNEL,


    }
  ))
  // console.log("msgFwd", msgFwd)
  await redisClient.lPush('inlineAudioArr', String(msgFwd?.updates[0]?.id)).then(() => {
    // console.log("InlineAudioArr redis updated successfully")
  })
  await client.sendMessage(chat, { message: "Succesfully saved to our database", replyTo: msgId })
}


export async function handleImage(msgText, messageObj, msgId, chat, originalUserId) {
  // Parse options from msgText (messageWithOptions)
  msgText = msgText?.trim();
  const overlayText = msgText.split(",")[0]?.trim() || `@${process.env.GIFS_CHANNEL_USERNAME}`;
  const color = msgText.split(",")[1]?.trim() || "black";
  const fontSize = parseInt(msgText.split(",")[2]?.trim(), 10) || 22;
  const positionY = msgText.split(",")[3]?.trim() || 30;

  try {


    const msgToDelete = await client.sendMessage(chat, {
      message: "Please wait...",
      replyTo: msgId,
      parseMode: "md2",
    });

    const dirPath = "img_for_handler";
    // or
    const msgIdNew = await getReplyMessageId(messageObj)

    // console.log("messageObj?.replyTo?.replyToMsgId || msgIdNew ",messageObj?.replyTo?.replyToMsgId , msgIdNew)
    // console.log("chat: " + JSON.stringify(chat));
    // console.log("process.env.DEV_USERNAME",process.env.DEV_USERNAME)
    // Get messages by ID:
    const msgFwd = await client.getMessages(chat, { ids: msgIdNew })
    // // console.log(" get messages : " + JSON.stringify(msgFwd))
    // const msgFwd = await client.forwardMessages(process.env.DEV_USERNAME, {
    //   messages: messageObj?.replyTo?.replyToMsgId || msgIdNew,
    //   fromPeer: chat,
    // });
    // console.log("msgFwd: " + JSON.stringify(msgFwd[0][0]));
    await fs.mkdir(dirPath, { recursive: true }); // Create the directory if it doesn't exist

    // Download the image buffery
    const buffer = await client.downloadMedia(msgFwd[0], {
      progressCallback: (data) => { },
    });

    // Save the buffer to the file in the specified directory
    const outputFilePath = `${dirPath}/output-image-${msgId}.webp`;
    // Log the local URL where the image can be accessed
    const imageUrl = `${process.env.RENDER_BACKEND_URL}/img/output-image-${msgId}.webp`;

    await fs.writeFile(outputFilePath, buffer);

    overlayTextOnImage(
      imageUrl,
      overlayText || `@${process.env.GIFS_CHANNEL_USERNAME}`,
      outputFilePath,
      color,
      fontSize,
      positionY
    )
      .then(async (data) => {
        //send this jpg link to webp
        await client.sendFile(chat, {
          caption: "Image with text overlayed",
          file: outputFilePath,
        });
        // await client.deleteMessages(chat,msgToDelete)
        fs.unlink(outputFilePath);
      })
      .catch(async (err) => {
        await client.sendMessage(chat, {
          message: "Please reply to img or stickers using /isign cmnd\nSee /help for more detailed information",
          replyTo: msgId,
          parseMode: "md2",
        });
        console.error("Error:", err.message);
      });
    // await client.deleteMessages(chat, messageToDelete); //revoke issue so commenting
  } catch (error) {
    await client.sendMessage(chat, {
      message: "Please reply to img or stickers using /isign cmnd\nSee /help for more detailed information",
      replyTo: msgId,
      parseMode: "md2",
    });
    console.error("Error:", error.message);
  }
}

export async function handleVideo(chat, msgId, messageObj, msgWithOptions, originalUserId) {
  msgWithOptions = msgWithOptions?.trim()
  const msgText = msgWithOptions.split(",")[0]?.trim() || `@${process.env.GIFS_CHANNEL_USERNAME}`
  const color = msgWithOptions.split(",")[1]?.trim() || "black"
  const fontSize = msgWithOptions.split(",")[2]?.trim() || 22
  const position = msgWithOptions.split(",")[3]?.trim() || "30"
  const posnStart = position.split(" ")[0]?.trim() || "30"
  const posnVal = position.split(" ")[1]?.trim() || posnStart
  // console.log("position is ", position)
  // console.log("posnStart is ", posnStart)
  // console.log("posnVal is ", posnVal)
  const positionValue = posnStart == "bottom" ? `h-text_h-${posnVal}` : `${posnVal}`
  // console.log("positionvalue is ", positionValue)
  try {
    // const messageToDelete = await client.sendMessage(chat, {
    //   message: "Sending webm file for the video..",
    //   replyTo: msgId,
    // });

    await client.sendMessage(chat, {
      message: "Please wait...",
      replyTo: msgId,
      parseMode: "md2",
    });

    // const msgFwd = await client.forwardMessages(process.env.DEV_USERNAME, {
    //   messages: messageObj?.replyTo?.replyToMsgId,
    //   fromPeer: chat,
    // });

    const msgIdNew = await getReplyMessageId(messageObj)

    const msgFwd = await client.getMessages(chat, { ids: msgIdNew })
    // // console.log(" get messages : " + JSON.stringify(msgFwd))


    // Ensure the directory exists
    const dirPath = "img_for_handler";
    await fs.mkdir(dirPath, { recursive: true });
    // console.log("video file :",msgFwd[0]?.media?.document?.size)
    if (msgFwd[0]?.media?.document?.size && msgFwd[0]?.media?.document?.size > 5242880) {
      //return as video exceeeds 5 mb and i dont want to overload my server

      await client.sendMessage(chat, {
        message: "Video size exceeds 5MB, please send video less than 5MB",
        replyTo: msgId,
        parseMode: "md2",
      });
      return;

    }
    // Download the video buffer
    const buffer = await client.downloadMedia(msgFwd[0], {
      progressCallback: (data) => { },
    });

    // Save the original buffer to a temporary file
    const inputFilePath = `${dirPath}/input-video-${msgId}.webm`;
    await fs.writeFile(inputFilePath, buffer);

    // Define the output path for the processed video
    const outputFilePath = `${dirPath}/output-video-${msgId}.webm`;

    // Use fluent-ffmpeg to apply the overlay
    await new Promise((resolve, reject) => {
      ffmpeg(inputFilePath)
        .outputOptions([
          "-r 30", // Set the frame rate to 30 FPS
          "-t 2.99", // Set the video duration
          "-an", // Disable audio encoding
          "-c:v libvpx-vp9", // Set video codec (VP9)
          "-pix_fmt yuva420p", // Pixel format for transparency
          // Apply drawtext with additional options and scale together
          "-vf",
          `
              drawtext=text='${msgText || '@' + process.env.GIFS_CHANNEL_USERNAME}':fontcolor=${color}:fontsize=${fontSize}:x=(w-text_w)/2:y=${positionValue}:shadowcolor=black:shadowx=2:shadowy=2:borderw=2:bordercolor=white:box=1:boxcolor=black@0.5, 
              scale='min(512,iw)':'min(512,ih)'`, // Scale video within 512x512 and keep text centered
          "-b:v 400K", // Video bitrate
        ])
        .on("end", resolve)
        .on("error", (err) => {
          console.error("Error processing video:", err.message);
          reject(err);
        })
        .save(outputFilePath);
    });


    // Log the local URL where the video can be accessed
    const videoUrl = `${process.env.RENDER_BACKEND_URL}/img/output-video-${msgId}.webm`;

    // Send the processed video file
    await client.sendFile(chat, {
      file: outputFilePath,
      forceDocument: false,
      replyTo: msgId,
    });

    // Clean up: Delete temporary files after sending the message
    await fs.unlink(inputFilePath);
    await fs.unlink(outputFilePath);
  } catch (error) {
    if (error.message.startsWith("ffmpeg")) {
      await client.sendMessage(chat, {
        message: "Invalid arguments provided, try again with correct arguments or see /help",
        replyTo: msgId,
        parseMode: "md2",
      });
      return;
    }
    await client.sendMessage(chat, {
      message: "Please reply to video or gifs using /vsign cmnd\nSee /help for more information",
      replyTo: msgId,
      parseMode: "md2",
    });
    console.error("Error handling video:", error.message);
  }
}

//code for buttons handling

// Add the button callback handler for the image generation buttons
client.addEventHandler(ButtonHandler, new CallbackQuery({ func: (event) => {
  const callbackData = event.query.data.toString();
  return !(callbackData.startsWith('select-song') || callbackData.startsWith('next-page') || callbackData.startsWith('prev-page'));
}}));

// Callback handler for button clicks
async function ButtonHandler(event) {
  // Get the userId from the event (user who clicked the button)
  const clickedUserId = event.query.userId;
  if (!clickedUserId) return
  const callbackData = event.query.data.toString("utf-8").trim(); // Get the callback data
  const callbackQueryId = event.query.queryId;
  // Access chat and msgId from globalchat
  const chat = globalchat[clickedUserId]?.chat || event.query?.peer?.userId;
  const msgId = globalchat[clickedUserId]?.msgId;
  const photoObject = globalchat[clickedUserId]?.photoObject;
  const msgText = globalchat[clickedUserId]?.msgText;
  const isVideo = globalchat[clickedUserId]?.isVideo;
  const messageObj = globalchat[clickedUserId]?.message;

  // Split the callback data to get the action and original userId
  const [action, originalUserId] = callbackData.split("|");
  if (!originalUserId && action) return

  // Ensure that only the user who initiated the process can click the button
  if (clickedUserId.toString() !== originalUserId.toString()) {
    // Send a message back to the chat if the user is not the one who initiated
    await client.invoke(
      new Api.messages.SetBotCallbackAnswer({
        queryId: callbackQueryId, // Use the query ID from event
        message: "Your are not the one who initiated this message",
        alert: true, // Show as an alert popup
      })
    );

    return; // Return early if the clicked user is different
  }

  // Retrieve the message using the originalUserId from globalchat
  const message = globalchat[originalUserId]?.message;

  switch (action) {
    case "sign-image":
      const signGenMessage = await client.editMessage(chat, {
        text: "Reply this img/sticker with the sign message \ne.g. <pre>/isign hello world,white,50</pre>\nSee /help for more detailed information",
        message: globalchat[originalUserId]?.initialMsgId,
        parseMode: "md2",
      });

      break;
    case "sign-video":
      await client.editMessage(chat, {
        text: "Reply this video/gif with the sign message \nCommand: <pre>/vsign hello world,white,50,50</pre>\nUse /help for more detailed information",
        message: globalchat[originalUserId]?.initialMsgId,
        parseMode: "md2",
      });

      break;
    case "save-audio":
      await client.editMessage(chat, {
        text: "Reply this audio with the captions to easy searching \nCommand: <pre>/feed your_captions </pre>\nUse /help for more detailed information",
        message: globalchat[originalUserId]?.initialMsgId,
        parseMode: "md2",
      });

      break;
    // case "ask-ai":
    //   await client.editMessage(chat, {
    //   text: "Reply this message with information u wanna ask",
    //   message: globalchat[originalUserId]?.initialMsgId,
    //   parseMode: "md2",
    // });
  }
}
