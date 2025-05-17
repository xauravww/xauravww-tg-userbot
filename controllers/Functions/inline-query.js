import { client } from "../../client-init.js";
import { getArr, redisClient } from "../utils/redis.js";
import dotenv from "dotenv";
import { Api } from "telegram";
import path from "path"

dotenv.config({path: path.resolve(".env")})

export async function inlineQueryHandler(){
  client.addEventHandler(async (event) => {
    if (!event.query) return;
    // // console.log("Received inline query:", event.query);
    const messageIds = await getArr(); 

    if (event.query && event.query.startsWith('.audio')) {
      // Extract the query without the '.audio' prefix
      const searchTerm = event.query.substring('.audio'.length).trim();

      const result = await client.invoke(
        new Api.channels.GetMessages({
          channel: process.env.MY_AUDIO_CHANNEL,
          id: messageIds,
        })
      );

      if (result?.messages && result.messages.length > 0) {
        const dummyResults = result.messages.map((message) => {
          // // console.log('message?.message', message?.message);
          // Use the extracted searchTerm for the regex
          const regex = new RegExp(searchTerm, 'i');
          if (regex.test(message?.message)) {
            if (message.media && message.media.document) {
              const media = message.media.document;
              // // console.log(media?.attributes[0]?.title)
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

        // // console.log("Filtered Results:", dummyResults);

        if (dummyResults.length > 0) {
          await client.invoke(
            new Api.messages.SetInlineBotResults({
              results: dummyResults,
              queryId: event.queryId,
              gallery: false,
            })
          );
        } else {
          // If no results found, send a "no results found" message
          await client.invoke(
            new Api.messages.SetInlineBotResults({
              results: [new Api.InputBotInlineResult({ // Use InputBotInlineResult for text-only results
                id: "0", // A unique ID for this result
                type: "article", // or "article", "photo", "gif", "video", "audio", "document", "location", "venue", "contact"
                title: "No results found",
                description: "Your search returned no results.",
                 sendMessage: new Api.InputBotInlineMessageText({
                    message: "No results found for your query.",
                    noWebpage: true // Prevent a web page preview
                })
              })],
              queryId: event.queryId,
              gallery: false,
              cacheTime: 10 // Cache for 10 seconds
            })
          );
        }
      }
    }
  });

}