import { createRequire } from "module";
const require = createRequire(import.meta.url);
const path = require("path");
import { client } from "../../client-init.js";
const dotenv = require("dotenv");
dotenv.config({ path: path.resolve(".env") });

import { sendMessageInDM } from "../utils/msgsUtils.js";

export async function stopServer(chat, msgId, messageText) {
  try {
    const stopParams = messageText.replace("stop ", "");

    const msgText = `Your password is correct and I am stopping the server`;

    await client.sendMessage(chat, { message: msgText, replyTo: msgId })
      .then(() => {
        if (stopParams == process.env.CRASH_PASS) process.exit(0);
      });
  } catch (error) {
    console.error("Error occurred while stopping server:", error);
  }
}
