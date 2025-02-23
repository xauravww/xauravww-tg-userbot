//will later on add btns but for now i am using direct functions



import { client } from "../../client-init.js";
import { Button } from "telegram/tl/custom/button.js";
import { CallbackQuery } from "telegram/events/CallbackQuery.js";
import { Api } from "telegram";
import dotenv from "dotenv"
import { getGlobalValue, setGlobalValue } from "../utils/global-context.js";
dotenv.config({path:'.env'})
// Global variable to hold all btn-related data
const globalchat = {};




export async function replyWithGlobalMenu(chat, msgId, message, userId) {
  globalchat[userId] = {
    chatId: chat.chatId,
    message,
    msgId,
    chat,
    initialMsgId: null, // Initialize initialMsgId here
  };
  const buttons = [
    [
      Button.inline("Change Text Model", Buffer.from(`change-text-model|${userId}`)),
    ]
  ];





  // Send a message with buttons to the user
  const initialMsg = await client.sendMessage(chat, {
    message: `<pre>Choose your option:</pre>
    `,
    replyTo: msgId,
    buttons: buttons,
    parseMode: "md2",
  });

  globalchat[userId].initialMsgId = initialMsg.id


}





client.addEventHandler(ButtonHandler, new CallbackQuery({}));

// Callback handler for button clicks
export async function ButtonHandler(event) {
  // Get the userId from the event (user who clicked the button)
  const clickedUserId = event.query.userId;
  const callbackData = event.query.data.toString("utf-8").trim(); // Get the callback data
  const callbackQueryId = event.query.queryId;
  // // Access chat and msgId from globalchat
  const chat = globalchat[clickedUserId]?.chat || event.query.peer.userId;
  const msgId = globalchat[clickedUserId]?.msgId;

  // Split the callback data to get the action and original userId
  const [action, originalUserId] = callbackData.split("|");
const ownerId = process.env.OWNER_USERID ? process.env.OWNER_USERID.split(" ") : []
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


  // if (!ownerId.includes(clickedUserId)) {
  //   // Send a message back to the chat if the user is not the one who initiated
  //   await client.invoke(
  //     new Api.messages.SetBotCallbackAnswer({
  //       queryId: callbackQueryId, // Use the query ID from event
  //       message: "Only Owner / Sudo Admins can execute this",
  //       alert: true, // Show as an alert popup
  //     })
  //   );

  //   return; // Return early if the clicked user is different
  // }



  // console.log("Callback data received:", action);

  // Retrieve the message using the originalUserId from globalchat
  const message = globalchat[originalUserId]?.message;
  // console.log("Message retrieved:", message);
  // console.log("Action is: " + action);
  switch (action) {
    case "change-text-model":
      // console.log("change text model button clicked");
      // console.log("ownerid: " + +ownerId +  typeof +ownerId)
      // console.log("clickedUserId: " + +clickedUserId +  typeof +clickedUserId)
      if (+ownerId != +clickedUserId) {
        // Send a message back to the chat if the user is not the one who initiated
        await client.invoke(
          new Api.messages.SetBotCallbackAnswer({
            queryId: callbackQueryId, // Use the query ID from event
            message: "Only Owner / Sudo Admins can execute this",
            alert: true, // Show as an alert popup
          })
        );
    
        return; // Return early if the clicked user is different
      }


      const textModelsButtons =[
        [
          Button.inline("Pro", Buffer.from(`change-pro|${originalUserId}`)),
          Button.inline("Flash", Buffer.from(`change-flash|${originalUserId}`)),
        ]
      ];
      
      await client.editMessage(chat,{
        text: `Current model is ${getGlobalValue("textModel") || process.env.GEMINI_MODEL_NAME.split(" ")[0]} \n<pre>Choose your model:</pre>
        `,
        message: globalchat[originalUserId].initialMsgId,
        buttons: textModelsButtons,
        parseMode: "md2",
      })
      
      break;
      case "change-pro":
        setGlobalValue(globalchat, originalUserId, "textModel",process.env.MODEL_NAME_GEMINI.split(" ")[0])
        await client.editMessage(chat,{
          text: `Successfully changed model to ${process.env.MODEL_NAME_GEMINI.split(" ")[0]}
          `,
          message: globalchat[originalUserId].initialMsgId,
          parseMode: "md2",
        })
        break
      case "change-flash":
        setGlobalValue(globalchat, originalUserId,"textModel",process.env.MODEL_NAME_GEMINI.split(" ")[1])
        await client.editMessage(chat,{
          text: `Successfully changed model to ${process.env.MODEL_NAME_GEMINI.split(" ")[1]}
          `,
          message: globalchat[originalUserId].initialMsgId,
          parseMode: "md2",
        })
        break;

    // default:
    //   // console.log("Unknown callback data:", callbackData);
    //   // await client.sendMessage(chat, {
    //   //   message: "Unknown button clicked. Please try again.",
    //   //   replyTo: msgId,
    //   // });
    //   break;
  }
}
