import axios from "axios";
import { promises as fs } from "fs";
import { client } from "../../client-init.js";
import { overlayTextOnImage } from "./canvas.js";
import ffmpeg from 'fluent-ffmpeg';

// Handle Image with Text Overlay
export async function handleImage(chat, msgID, photoObject, message) {
  try {
    // Log the image URL
    console.log(photoObject);
    const messageToDelete = await client.sendMessage(chat, {
      message:"Sending webm file for the video..",
      replyTo: msgID
    });
    // Ensure the directory exists
    const dirPath = 'img_for_handler';
    await fs.mkdir(dirPath, { recursive: true }); // Create the directory if it doesn't exist

    // Download the image buffery
    const buffer = await client.downloadMedia(message, {
      progressCallback: (data) => {
        console.log(`Downloaded ${data}`);
      },
    });

    console.log(buffer);
    // Save the buffer to the file in the specified directory
    const outputFilePath = `${dirPath}/output-image-${msgID}.webp`;
    // Log the local URL where the image can be accessed
    const imageUrl = `${process.env.RENDER_BACKEND_URL}/img/output-image-${msgID}.webp`;
    console.log(`Image saved to ${outputFilePath}`);
    console.log(`You can access the image at: ${imageUrl}`);
    await fs.writeFile(outputFilePath, buffer);

    console.log(`Image saved to ${outputFilePath}`);


overlayTextOnImage(
  imageUrl,
  "Saurav hu bhai",
  outputFilePath
).then(async (data)=>{
    console.log('Image overlayed successfully')
    console.log(data)
    //send this jpg link to webp
    await client.sendFile(chat, {
      caption: "Image with text overlayed",
      file: outputFilePath,
    });
   
    fs.unlink(outputFilePath); 
}).catch(async (err)=>{
    console.error("Error overlaying image:", err.message);

})
// await client.deleteMessages(chat, messageToDelete); //revoke issue so commenting
    
  } catch (error) {
    console.error("Error downloading image:", error.message);
  }}
  
  export async function handleVideo(chat, msgId, videoObject, message) {
    try {
      const messageToDelete = await client.sendMessage(chat, {
        message: "Sending webm file for the video..",
        replyTo: msgId,
      });
  
      // Ensure the directory exists
      const dirPath = 'img_for_handler';
      await fs.mkdir(dirPath, { recursive: true });
  
      // Download the video buffer
      const buffer = await client.downloadMedia(message, {
        progressCallback: (data) => {
          console.log(`Downloaded ${data}% of video`);
        },
      });
  
      // Save the original buffer to a temporary file
      const inputFilePath = `${dirPath}/input-video-${msgId}.webm`;
      await fs.writeFile(inputFilePath, buffer);
  
      // Define the output path for the processed video
      const outputFilePath = `${dirPath}/output-video-${msgId}.webm`;
  
   
     
      await fs.writeFile(overlayImagePath, Buffer.from(imageResponse.data));
  
      // Use fluent-ffmpeg to apply the overlay
      await new Promise((resolve, reject) => {
        ffmpeg(inputFilePath)
          .outputOptions([
            '-r 30', // Set the frame rate to 30 FPS
            '-t 2.99', // Set the video duration
            '-an', // Disable audio encoding
            '-c:v libvpx-vp9', // Set video codec (VP9)
            '-pix_fmt yuva420p', // Pixel format for transparency
            // Apply drawtext and scale together
            '-vf', `
              drawtext=text=@${process.env.GIFS_CHANNEL_USERNAME}:fontcolor=black:fontsize=35:x=(w-text_w)/2:y=(h-text_h)-20, 
              scale='min(512,iw)':'min(512,ih)'`, // Scale video within 512x512 and keep text centered
            '-b:v 400K', // Video bitrate
          ])
          .on('end', resolve)
          .on('error', (err) => {
            console.error('Error processing video:', err.message);
            reject(err);
          })
          .save(outputFilePath);
      });
      
      // Log the local URL where the video can be accessed
      const videoUrl = `${process.env.RENDER_BACKEND_URL}/img/output-video-${msgId}.webm`;
      console.log(`Video saved to ${videoUrl}`);
  
      // Send the processed video file
      await client.sendFile(chat, {
        file: outputFilePath,
        forceDocument: false,
        replyTo: msgId,
      });
  
      // Clean up: Delete temporary files after sending the message
      await fs.unlink(inputFilePath);
      await fs.unlink(outputFilePath);
      await fs.unlink(overlayImagePath); // Delete the overlay image
  
    } catch (error) {
      console.error("Error handling video:", error.message);
    }
  }
