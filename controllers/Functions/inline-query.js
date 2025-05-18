import { client } from "../../client-init.js";
import { getArr, redisClient } from "../utils/redis.js";
import dotenv from "dotenv";
import { Api } from "telegram";
import path from "path"
import { CallbackQuery } from "telegram/events/CallbackQuery.js";
dotenv.config({ path: path.resolve(".env") })

export async function inlineQueryHandler() {
  client.addEventHandler(async (event) => {
    if (!event.query) return;
    const messageIds = await getArr();

    if (event.query && event.query.startsWith('.audio')) {
      const searchTerm = event.query.substring('.audio'.length).trim();

      const result = await client.invoke(
        new Api.channels.GetMessages({
          channel: process.env.MY_AUDIO_CHANNEL,
          id: messageIds,
        })
      );

      if (result?.messages && result.messages.length > 0) {
        const dummyResults = result.messages.map((message) => {
          const regex = new RegExp(searchTerm, 'i');
          if (regex.test(message?.message)) {
            if (message.media && message.media.document) {
              const media = message.media.document;
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
                  message: `${message?.message || ''}`,
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

        if (dummyResults.length > 0) {
          await client.invoke(
            new Api.messages.SetInlineBotResults({
              results: dummyResults,
              queryId: event.queryId,
              gallery: false,
            })
          );
        } else {
          await client.invoke(
            new Api.messages.SetInlineBotResults({
              results: [new Api.InputBotInlineResult({
                id: "0",
                type: "article",
                title: "No results found",
                description: "Your search returned no results.",
                sendMessage: new Api.InputBotInlineMessageText({
                  message: "No results found for your query.",
                  noWebpage: true
                })
              })],
              queryId: event.queryId,
              gallery: false,
              cacheTime: 10
            })
          );
        }
      }
    }
    else {
      const query = event.query;
      const MAX_WORDS = 200;
      const match = query.match(/(.*?)(@(?:[\w\d_]{5,}|[0-9]{6,}))$/);
      if (match) {
        const secret = match[1].trim();
        const recipient = match[2].trim();

        if (typeof recipient !== 'string' || typeof secret !== 'string') {
          return;
        }

        // console.log("event",event)

        const wordCount = secret.split(/\s+/).length;
        if (wordCount > MAX_WORDS) {
          await client.invoke(
            new Api.messages.SetInlineBotResults({
              results: [new Api.InputBotInlineResult({
                id: "0",
                type: "article",
                title: "Error",
                description: "Whisper message is too long.",
                sendMessage: new Api.InputBotInlineMessageText({
                  message: `Your whisper message exceeds the limit of ${MAX_WORDS} words.`,
                  noWebpage: true
                })
              })],
              queryId: event.queryId,
              gallery: false,
              cacheTime: 10
            })
          );
          return;
        }

       const results = [
  new Api.InputBotInlineResult({
    id: `whisper-${event.queryId}`,
    title: `Whisper for ${recipient}`,
    description: `Private whisper for ${recipient}`,
    type: "article",
    sendMessage: new Api.InputBotInlineMessageText({
      message: `🤫 A whisper has been sent. Only ${recipient} can reveal it.`,
      noWebpage: true,
      replyMarkup: new Api.ReplyInlineMarkup({
        rows: [
          new Api.KeyboardButtonRow({
            buttons: [
              new Api.KeyboardButtonCallback({
                text: "Reveal Whisper",
                data: Buffer.from(`whisper::${recipient}::${secret}::${event.userId}`),
              }),
            ],
          }),
        ],
      }),
    }),
  }),
];

        await client.invoke(
          new Api.messages.SetInlineBotResults({
            queryId: event.queryId,
            results: results,
            gallery: false,
          })
        );
      } else {
        await client.invoke(
          new Api.messages.SetInlineBotResults({
            results: [new Api.InputBotInlineResult({
              id: "0",
              type: "article",
              title: "Invalid Input - Click me",
              description: "Know how to use whisper bot",
              sendMessage: new Api.InputBotInlineMessageText({
                message: "Please use the format: <secret-msg> @<recipient user_name or user_id>\n@funwalabot hello @1223342423 \n @funwalabot hello @username_of_ur_frnd",
                noWebpage: true
              })
            })],
            queryId: event.queryId,
            gallery: false,
            cacheTime: 10
          })
        );
      }
    }





  })
}


client.addEventHandler(ButtonHandler, new CallbackQuery({}));

// Callback handler for button clicks
export async function ButtonHandler(event) {
  const clickedUserId = event.query.userId;
if(!clickedUserId) return
  const callbackData = event.query.data.toString("utf-8").trim();
  const callbackQueryId = event.query.queryId;

  // Expected format: whisper::<recipientId>::<secret>::<senderId>
  if (!callbackData.startsWith("whisper::")) return;

  const parts = callbackData.split("::");
  if (parts.length < 4) return;

  console.log("parts",parts)

  const [, recipientId, secret, senderId] = parts;

  if (
    clickedUserId.toString() !== recipientId.toString() &&
    clickedUserId.toString() !== senderId.toString()
  ) {
    // Not recipient or sender — unauthorized
    await client.invoke(
      new Api.messages.SetBotCallbackAnswer({
        queryId: callbackQueryId,
        message: "Nahi bhai, yeh message tere liye nahi hai. Dusron ke raaz padhna mana hai 😏",
        alert: true,
      })
    );
    return;
  }

  // Authorized: show the whisper
  await client.invoke(
    new Api.messages.SetBotCallbackAnswer({
      queryId: callbackQueryId,
      message: `${secret}`,
      alert: true,
    })
  );
}


