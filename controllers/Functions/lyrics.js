import { startSeconds, client } from "../../client-init.js";
import request from "request";

export async function lyricsFinder(chat, msgId, messageText) {
  try {
    const msgToBeEdited = await client.sendMessage(chat, {
      message: "Wait finding the lyrics for you...",
      replyTo: msgId
    });
    const msgToBeEditedId = msgToBeEdited.id;
    const newString = messageText.replace("lyrics ", "");

    const regex = /^(.*?)\s+by\s+(.*)$/;
    const matches = newString.match(regex);
    if (matches && matches.length >= 3) {
      const song = matches[1];
      const singer = matches[2];

      // console.log(`https://api.lyrics.ovh/v1/${singer}/${song}`);

      request(
        `https://api.lyrics.ovh/v1/${singer}/${song}`,
        async function (error, response, body) {
          try {
            const data = JSON.parse(body);
            const cleanBody = data?.lyrics?.replace(/[\r\n]+/g, "...");
            await client.editMessage(chat, {
              message: msgToBeEditedId,
              text: cleanBody,
              replyTo: msgId
            });
          } catch (innerErr) {
            console.error("Error occurred while parsing lyrics data:", innerErr);
            await client.editMessage(chat, {
              message: msgToBeEditedId,
              text: "Lyrics not found...",
              replyTo: msgId
            });
          }
        }
      );
    } else {
      // console.log("Pattern not matched");
    }
  } catch (err) {
    console.error("Error occurred while finding lyrics:", err);
  }
}
