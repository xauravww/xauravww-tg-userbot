import { client } from "../../client-init.js";
import { getArr, redisClient } from "../utils/redis.js";
import dotenv from "dotenv";
import { Api } from "telegram";
import path from "path"
import { CallbackQuery } from "telegram/events/CallbackQuery.js";
import { v4 as uuidv4 } from "uuid";
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
      const query = event.query.trim();
      const MAX_WORDS = 200;
      const MAX_TTL_MINUTES = 2880; // 2 days max TTL
      const match = query.match(/([\s\S]*?)\s+(@[\w\d_]{3,})$/);

      if (match) {
        let secret = match[1].trim();
        let rawRecipient = match[2].trim();  // e.g., "@123456789" or "@username123"
        let recipient = rawRecipient.slice(1); // remove the '@'

        // Check for TTL override in secret, format: #x where x is minutes
        let ttlMinutes = 60; // default 60 minutes
        const ttlMatch = secret.match(/#(\d+)/);
        if (ttlMatch) {
          ttlMinutes = parseInt(ttlMatch[1]);
          if (ttlMinutes > MAX_TTL_MINUTES) {
            await client.invoke(
              new Api.messages.SetInlineBotResults({
                results: [new Api.InputBotInlineResult({
                  id: "0",
                  type: "article",
                  title: "Error",
                  description: `TTL exceeds max limit of ${MAX_TTL_MINUTES} minutes.`,
                  sendMessage: new Api.InputBotInlineMessageText({
                    message: `TTL exceeds max limit of ${MAX_TTL_MINUTES} minutes.`,
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
          // Remove TTL from secret message
          secret = secret.replace(/#\d+/, '').trim();
        }
        let finalRecipient
        try {
          finalRecipient = /^\d+$/.test(recipient)
            ? recipient
            : await client.getPeerId(recipient);
        } catch (err) {
          console.error("Failed to resolve recipient:", recipient, err);
          return await client.invoke(
            new Api.messages.SetInlineBotResults({
              results: [
                new Api.InputBotInlineResult({
                  id: "0",
                  type: "article",
                  title: "User not found",
                  description: `Can't resolve user: ${recipient}`,
                  sendMessage: new Api.InputBotInlineMessageText({
                    message: `User @${recipient} not found or is private.`,
                    noWebpage: true
                  }),
                }),
              ],
              queryId: event.queryId,
              gallery: false,
              cacheTime: 10,
            })
          );
        }

        if (typeof recipient !== 'string' || typeof secret !== 'string') {
          return;
        }

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

        // Generate unique key for whisper message storage
        const whisperKey = `whisper:${uuidv4()}`;

        // Store whisper message in Redis with TTL
        // Store both message, senderId and recipientId as JSON string
        await redisClient.setEx(whisperKey, ttlMinutes * 60, JSON.stringify({ message: secret, senderId: event.userId, recipientId: finalRecipient }));

        // Calculate expiry date/time string
        const expiryDate = new Date(Date.now() + ttlMinutes * 60000);
        const expiryString = expiryDate.toLocaleString();

        const results = [
          new Api.InputBotInlineResult({
            id: `whisper-${event.queryId}`,
            title: `Whisper for ${recipient}`,
            description: `Private whisper for ${recipient}. Expires at ${expiryString}`,
            type: "article",
            sendMessage: new Api.InputBotInlineMessageText({
              message: `🤫 A whisper has been sent. Only ${recipient} can reveal it.\n\n*Expires at:* ${expiryString}`,
              noWebpage: true,
              replyMarkup: new Api.ReplyInlineMarkup({
                rows: [
                  new Api.KeyboardButtonRow({
                    buttons: [
                      new Api.KeyboardButtonCallback({
                        text: "Reveal Whisper",
                        data: Buffer.from(`whisperKey::${whisperKey}::${finalRecipient}`, 'utf-8').slice(0, 64),
                      }),
                    ],
                  }),
                  new Api.KeyboardButtonRow({
                    buttons: [
                      new Api.KeyboardButtonCallback({
                        text: "Send to Bot",
                        data: Buffer.from(`revealInBot::${whisperKey}::${finalRecipient}`, 'utf-8').slice(0, 64),
                      }),
                    ],
                  }),
                  new Api.KeyboardButtonRow({
                    buttons: [
                      new Api.KeyboardButtonUrl({
                        text: "Open Bot",
                        url: `https://t.me/funwalabot`,
                      }),
                    ],
                  }),
                ],
              }),

              parseMode: "markdown"
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
        const queryLength = event.query?.length || 0;

        const title = queryLength >= 255
          ? `Invalid Input – Limit Reached (${queryLength}/255)`
          : `Invalid Input – Length: ${queryLength}/255`;
        await client.invoke(
          new Api.messages.SetInlineBotResults({
            results: [new Api.InputBotInlineResult({
              id: "0",
              type: "article",
              title: title,
              description: "Know how to use whisper bot",
              sendMessage: new Api.InputBotInlineMessageText({
                message: "Please use the format: <secret-msg> @<recipient user_name or user_id>\n@bot secret #x @recipient\n\nWhere #x is optional TTL in minutes (max 2880 = 2 days).\n\nTelegram Max characater limit = 255",
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
  try {
    const clickedUserId = event.query.userId;
    if (!clickedUserId) return;
    const callbackData = event.query.data.toString("utf-8").trim();
    const callbackQueryId = event.query.queryId;

    console.log("callback", callbackData)

    if (callbackData.startsWith("whisperKey::")) {
      const parts = callbackData.split("::");
      if (parts.length < 3) return;

      const [, whisperKey, recipientId] = parts;
      // senderId is stored in Redis, so we fetch it for authorization

      // Fetch whisper message and senderId from Redis
      const storedData = await redisClient.get(whisperKey);
      if (!storedData) {
        await client.invoke(
          new Api.messages.SetBotCallbackAnswer({
            queryId: callbackQueryId,
            message: "Whisper message expired or not found.",
            alert: true,
          })
        );
        return;
      }

      // storedData format: JSON string with { message: string, senderId: string }
      let whisperData;
      try {
        whisperData = JSON.parse(storedData);
      } catch (e) {
        whisperData = { message: storedData, senderId: null };
      }

      if (
        clickedUserId.toString() !== recipientId.toString() &&
        clickedUserId.toString() !== (whisperData.senderId ? whisperData.senderId.toString() : null) &&
        clickedUserId.toString() !== (whisperData.recipientId ? whisperData.recipientId.toString() : null)
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

      // Authorized: show the whisper with expiry info
      await client.invoke(
        new Api.messages.SetBotCallbackAnswer({
          queryId: callbackQueryId,
          message: `${whisperData.message}`,
          alert: true,
        })
      );
    } else if (callbackData.startsWith("revealInBot::")) {
      const parts = callbackData.split("::");
      if (parts.length < 3) return;

      const [, whisperKey, recipientId] = parts;

      // Fetch whisper message and senderId from Redis
      const storedData = await redisClient.get(whisperKey);
      if (!storedData) {
        await client.invoke(
          new Api.messages.SetBotCallbackAnswer({
            queryId: callbackQueryId,
            message: "Whisper message expired or not found.",
            alert: true,
          })
        );
        return;
      }

      let whisperData;
      try {
        whisperData = JSON.parse(storedData);
      } catch (e) {
        whisperData = { message: storedData, senderId: null };
      }

      if (
        clickedUserId.toString() !== recipientId.toString() &&
        clickedUserId.toString() !== (whisperData.senderId ? whisperData.senderId.toString() : null) &&
        clickedUserId.toString() !== (whisperData.recipientId ? whisperData.recipientId.toString() : null)
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

      // Authorized: send the whisper message in the bot chat (not alert)
      await client.sendMessage(clickedUserId, {
        message: `🤫 Whisper message:\n\n${whisperData.message}`,
        parseMode: "markdown",
      });

      // Show alert that message was sent to bot chat
      await client.invoke(
        new Api.messages.SetBotCallbackAnswer({
          queryId: callbackQueryId,
          message: "Message sent to bot chat. Now click 'Open Bot' button to reveal.",
          alert: true,
        })
      );

      // Edit the original message in the group chat to replace buttons with three buttons: Reveal, Send to Bot, Open Bot
      try {
        const originalMessage = event.message;
        if (originalMessage) {
          const chat = originalMessage.peerId;
          const msgId = originalMessage.id;
          const botUsername = "funwalabot"; // Replace with your bot username if different
          const newButtons = new Api.ReplyInlineMarkup({
            rows: [
              new Api.KeyboardButtonRow({
                buttons: [
                  new Api.KeyboardButtonCallback({
                    text: "Reveal",
                    data: Buffer.from(`whisperKey::${whisperKey}::${recipientId}`, 'utf-8').slice(0, 64),
                  }),
                ],
              }),
              new Api.KeyboardButtonRow({
                buttons: [
                  new Api.KeyboardButtonCallback({
                    text: "Send to Bot",
                    data: Buffer.from(`revealInBot::${whisperKey}::${recipientId}`, 'utf-8').slice(0, 64),
                  }),
                ],
              }),
              new Api.KeyboardButtonRow({
                buttons: [
                  new Api.KeyboardButtonUrl({
                    text: "Open Bot",
                    url: `https://t.me/${botUsername}`,
                  }),
                ],
              }),
            ],
          });
          await client.invoke(
            new Api.messages.EditMessage({
              peer: chat,
              id: msgId,
              replyMarkup: newButtons,
            })
          );
        }
      } catch (editError) {
        console.error("Failed to edit original message after revealInBot callback:", editError);
      }


    }
  } catch (error) {
    if (error.code === 400 && error.errorMessage === 'MESSAGE_TOO_LONG') {
      // Show alert that message is too large to display here
      await client.invoke(
        new Api.messages.SetBotCallbackAnswer({
          queryId: event.query.queryId,
          message: "Message too large to display here. Please reveal it in the bot chat.",
          alert: true,
        })
      );
    } else {
      console.error("Error handling button callback:", error);
    }
  }
}
