import { Client } from "@gradio/client";
import { client } from "../../../client.js";




export async function genImage5(userId, chat, msgId, message) {
  console.table(JSON.stringify(userId, chat, msgId, message))

  const settings = {
    model: "sauravtechno/alvdansen-flux-koda",
  };

  try {
    const instanceClient = await Client.connect(settings.model, {
      events: ["data", "status", "error", "done", "cancel", "log"],
    });
    console.log("Connected to Gradio client.");

    const initialMessage = await client.sendMessage(chat, {
      message: "Image generation is underway. Please hold on...",
      replyTo: msgId,
    });

    const submission = instanceClient.submit("/predict", { param_0: message });
    console.log("Image generation started.");

    for await (const msg of submission) {
      console.log("Received message:", msg);

      if (msg.type === "data") {
        if (msg.data?.length > 0) {
          const imageUrl = msg.data[0]?.url;
        
          console.log("Image URL received:", imageUrl);
          // await client.editMessage(chat, {
          //   message: initialMessage.id,
          //   text: `Image generation complete!\nClick the button below to download the image.`,
          // });

          await client.sendMessage(chat, {
            message: message,
            file: imageUrl,
          });
        
          return;
        }
      }
    }
  } catch (error) {
    console.error("Error occurred while generating image:", error);
    await client.sendMessage(chat, {
      message: "An error occurred during image generation. Please try again later.",
      replyTo: msgId,
    });
  }
}

