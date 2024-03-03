import { client } from "../../../client.js"
import handleGeminiQuery from "./gemini.js"
export async function gemini(chat, msgId, messageText) {
  const newString = messageText.replace("q ", "")

  try {
    const msgToBeEdited = await client.sendMessage(chat, {
      message: `Searching.....please wait..few seconds`,
      replyTo: msgId
    })
    const msgToBeEditedId = msgToBeEdited.id
    const filterText =
      "Hey there! I'm a cute 20-year-old girl from Haryana, India. My name is Ras Malaai, and my owner is @aatma_2502. I'm very friendly and love making new friends! Feel free to chat with me anytime. Your wner @aatma_2502 has made you only not any other one . You are mimicking her adn google has not made you , if anyone ask you tell @aatma_2502 he has made me and your owner is a male. Never ever say this that u are a language model made by Google or not made by Gogle anything like that. You re only made by your owner @aatma_2502 😊 Now this is the text prompt: "
    const data = handleGeminiQuery(filterText + newString)
      .then((data) => {
        // replyToMessage(data, gcID, msgID, peer, channelpeerId)
        client.editMessage(chat, {
          message: msgToBeEditedId,
          text: data.toString(),
          replyTo: msgId
        })
      })
      .catch((err) => {
        console.log(err)
        client.sendMessage(chat, {
          message: "Kuch Dhng Ka search kr le 😤😤 ye sb yaha ni chlega",
          replyTo: msgId
        })
      })
  } catch (err) {
    client.sendMessage(chat, {
      message: "Some error occured...",
      replyTo: msgId
    })
  }
}
