import { createRequire } from "module";
const require = createRequire(import.meta.url);

import path from "path";

import { client } from "../../../client.js";

import {
  replyToMessage,
  sendMessageInDM,
  sendMessageWithFileInDM
} from "../../utils/msgsUtils.js";
import { mp3Downloader } from "./yt2mp3.js";

export async function mp3Handler(chat, msgId, messageText) {
  const messageToEdit = await client.sendMessage(chat, {
    message: `Hang tight, the mp3 file is on its way...`,
    replyTo: msgId
  });
  const inputString = messageText.replace("mp3 ", "");
  console.log("messageToEdit id: " + messageToEdit.id);
  const msgToEditId = messageToEdit.id;
  try {
    mp3Downloader(inputString, msgToEditId, chat).then((videoTitle) => {
      const files = path.resolve(
        "./controllers/Functions/yt2mp3/output/file.mp3"
      );

      client.sendFile(chat, {
        caption: `${videoTitle}`,
        file: files,
        replyTo: msgToEditId
      });
    });
  } catch (err) {
    console.error("Error occurred while handling mp3:", err);
    await client.sendMessage(chat, {
      message: `An error occurred 😢`,
      replyTo: msgId
    });
  }
}
