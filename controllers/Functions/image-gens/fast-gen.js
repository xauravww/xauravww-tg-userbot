import { client } from "../../../client-init.js";
import axios from "axios";

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



// Function to generate images based on user input
export async function generateImage4(userId, chat, msgId, message, initialMessageId) {
    if (!userId || !chat || !msgId || !message) {
        console.error("Invalid parameters:", { userId, chat, msgId, message });
        return;
    }

    try {
        const initialMessage = await client.sendMessage(chat, {
            message: `Generating image using Fast Gen Model...`,
            replyTo: msgId,
        });



        const apiData = {
            "prompt": message.replace("/\/gen", ""),
        }

        let response;

        // Using correct API endpoint based on modelVersion
        const url = process.env.FAST_GEN_ENDPOINT;

        response = await axios.post(url, apiData, {
            headers: {
                'Content-Type': 'application/json',
            }
        });
        const imgUrl = response?.data?.data?.imageUrl
        // if (imgUrl) {
        //     await client.sendFile(chat, {
        //         file: imgUrl,
        //         caption: `<code>${apiData.prompt}</code>`,
        //         replyTo: msgId,
        //         parseMode: "md2",
        //     });
        // }



        let resp2 = await axios.get(imgUrl, {
            headers: {
              'Content-Type': 'application/json',
            },
            responseType: 'arraybuffer',
          });
      
          // Log the response to check if it contains valid data
          // // console.log("API response length:", response.data.byteLength);
          if (resp2.data.byteLength === 0) {
            throw new Error("Received empty image data.");
          }
      
       
      
          const tempDir = path.join(__dirname, 'temp_img');
          if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir);
          }
      
          const tempImagePath = path.join(tempDir, `${userId}.png`);
          
          // Ensure the buffer is correctly written as an image file
          fs.writeFileSync(tempImagePath, Buffer.from(resp2.data));
          // await client.editMessage(chat, {
          //   message: initialMessageId,
          //   text: `Image generation complete!`,
          // });
          await client.deleteMessages(chat, [initialMessageId,initialMessage], {revoke:true});
          await client.sendFile(chat, {
            file: tempImagePath,
            caption: `<code>${apiData.prompt}</code>`,
            replyTo: msgId,
            parseMode: "html",
          });
      
          fs.unlinkSync(tempImagePath); // Clean up
          // console.log("Image sent and temp file deleted.");
      
    } catch (error) {
        console.error("Error generating image:", error.message);
        await client.sendMessage(chat, {
            message: "Error during image generation. \nOr try again using another model",
            replyTo: msgId,
        });
    }
}

