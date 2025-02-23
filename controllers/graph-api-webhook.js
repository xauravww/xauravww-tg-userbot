import { createRequire } from "module"
const require = createRequire(import.meta.url)
import { client } from "../client-init.js";
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const path = require("path")
const dotenv = require("dotenv")
dotenv.config({ path: path.resolve(".env") })
function handleMessage(event) {
    try {
        const senderId = event.sender.id;
        const messageText = event.message.text;

        // console.log(`Received message from sender ${senderId}: ${messageText}`);

        // Add your logic here to process the incoming message
    } catch (error) {
        console.error("Error occurred while handling message:", error);
    }
}

export function getFromWebhook(req, res) {
    try {
        let mode = req.query["hub.mode"];
        let token = req.query["hub.verify_token"];
        let challenge = req.query["hub.challenge"];

        if (mode && token && mode === "subscribe" && token === VERIFY_TOKEN) {
            console.log("WEBHOOK_VERIFIED");
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    } catch (error) {
        console.error("Error occurred in webhook verification:", error);
        res.sendStatus(500);
    }
}

export async function postToWebHook(req, res) {
    try {
        let body = req.body;
        // console.log(JSON.stringify(body));

        if (body) {
            const msgText = body?.entry[0]?.messaging[0]?.message?.text;

            if (msgText) {
                const modifiedMsgText = msgText.replace(/instagram/g, 'ddinstagram');
                await client.sendMessage(process.env.TELEGRAM_REELS_CHANNEL_USERNAME, { message: modifiedMsgText });
            }
        }

        // Send acknowledgment response
        res.status(200).send("EVENT_RECEIVED");
    } catch (error) {
        console.error("Error occurred in handling webhook post:", error);
        res.sendStatus(500);
    }
}


