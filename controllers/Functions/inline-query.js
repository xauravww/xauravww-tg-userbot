import { client } from "../../client-init.js";
import { getArr, redisClient } from "../utils/redis.js";
import dotenv from "dotenv";
import { Api } from "telegram";
import path from "path"

dotenv.config({path: path.resolve(".env")})

export async function inlineQueryHandler(){
  client.addEventHandler(async (event) => {
    if (!event.query) return;
    // console.log("Received inline query:", event.query);
    const messageIds = await getArr(); 

    if (event.query) {
      const result = await client.invoke(
        new Api.channels.GetMessages({
          channel: process.env.MY_AUDIO_CHANNEL,
          id: messageIds,
        })
      );

      if (result?.messages && result.messages.length > 0) {
        const dummyResults = result.messages.map((message) => {
          // console.log('message?.message', message?.message);
          const regex = new RegExp(event.query, 'i');
          if (regex.test(message?.message)) {
            if (message.media && message.media.document) {
              const media = message.media.document;
              // console.log(media?.attributes[0]?.title)
              return new Api.InputBotInlineResultDocument({
                id: String(message.id),
                type: "voice",
                title: `${media?.attributes[0]?.title} - ${media?.attributes[1]?.fileName}` || "Dummy Result",
                description: `${media?.attributes[0]?.performer || ''} -> ${message?.message || ''}` || "This is a dummy inline result for testing purposes.",
                document: new Api.InputDocumentFileLocation({
                  accessHash: media.accessHash,
                  fileReference: media.fileReference,
                  id: media.id,
                  thumbSize: "134",
                }),
                sendMessage: new Api.InputBotInlineMessageMediaAuto({
                  message: `${message?.message|| ''}`,
                  entities: [],
                  replyMarkup: null,
                  noWebpage: false,
                  invertMedia: false,
                }),
              });
            }
          }
          return null;
        }).filter(result => result !== null);

        // console.log("Filtered Results:", dummyResults);

        if (dummyResults.length > 0) {
          await client.invoke(
            new Api.messages.SetInlineBotResults({
              results: dummyResults,
              queryId: event.queryId,
              gallery: false,
            })
          );
        }
      }
    }
  });

}