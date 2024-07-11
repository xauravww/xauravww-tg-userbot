import { createRequire } from "module";
const require = createRequire(import.meta.url);

var request = require("request");
import { startSeconds, client } from "../../client.js";
import {
  replyToMessage,
  countUptimeServer,
  sendMessageInDM
} from "../utils/msgsUtils.js";

//get this msg from events and startSeconds from client
export async function replyWithPing(chat, msgID, startSeconds) {
  const upTimeMsg = countUptimeServer(startSeconds);

  const url = "http://www.google.com";
  try {
    const startTime = Date.now();

    request(url, (error, response, body) => {
      try {
        if (!error && response.statusCode === 200) {
          const pingTime = Date.now() - startTime;
          client.sendMessage(chat, {
            message: `Pong : ${pingTime} ms \n${upTimeMsg}`,
            replyTo: msgID
          });
        } else {
          console.error("Ping failed");
          client.sendMessage(chat, { message: `Ping Failed`, replyTo: msgID });
        }
      } catch (innerErr) {
        console.error("Error occurred while processing response:", innerErr);
        client.sendMessage(chat, {
          message: `Error occurred while processing response`,
          replyTo: msgID
        });
      }
    });
  } catch (err) {
    console.error("Error occurred while sending request:", err);
    client.sendMessage(chat, {
      message: `Some error occurred while pinging`,
      replyTo: msgID
    });
  }
}
