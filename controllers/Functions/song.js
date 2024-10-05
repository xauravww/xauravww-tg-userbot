import { Downloader } from 'ytdl-mp3';
import path from 'path';
import { client } from '../../client.js';

async function main() {
 try {
    const downloader = new Downloader({
        getTags: true,
        outputDir:`${path.resolve("./")}`,
        quality: 'highestaudio',
        progressTimeout: 60000,
        format: 'mp3',
        filter: (video) => video.title.startsWith('Your Song Name'),
        onProgress: (info) => console.log(`${info.percentage}% downloaded`),
      });
      await downloader.downloadSong("https://www.youtube.com/watch?v=7jgnv0xCv-k");
 } catch (error) {
    console.error(error);
 }
}

export async function songDownloader(chat, msgID, msgText){
    // await main();
    await client.sendMessage(chat, { message: "This feature is currently unavailable due to maintenance. I will let you know when it becomes available again", replyTo: msgID });

}

