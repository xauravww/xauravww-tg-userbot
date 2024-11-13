import { Api } from "telegram";
import { client } from "../../client-init.js";

// Function to get the replied message

export async function getReplyMessageId(message) {
  if (message.replyTo && message.replyTo.replyToMsgId) {
      const originalMessageId = message.replyTo.replyToMsgId;
return originalMessageId
//       // Retrieve the original message details
//       const originalMessage = await client.invoke(
//           new Api.messages.GetMessages({
//               peer: message.chat,
//               id: [originalMessageId],
//           })
//       );
// console.log(JSON.stringify(message))
//       return originalMessage;
  }
  return null; // Return null if there's no reply
}