// import { client } from "../client.js";
import { getAccessToken } from "./Functions/yt2mp3/song.js"; // Import the function to exchange code for tokens

export async function sendMessage(req, res) {
   const code = req.query.code; 

   if (code) {
       await getAccessToken(code); // Call your function to exchange code for tokens
       res.send('Authentication successful! You can close this tab.');
   } else {
       res.send('Error: No code received.');
   }
}