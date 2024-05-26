import { createRequire } from "module"
const require = createRequire(import.meta.url)
const dotenv = require("dotenv")
const path = require("path")
dotenv.config({ path: path.resolve(".env") })
const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");

const stringSession = ""; // leave this empty for now
const BOT_TOKEN = process.env.BOT_TOKEN; // put your bot token here

const apiId = process.env.API_KEY;
const apiHash = process.env.API_HASH;

(async () => {
  const client = new TelegramClient(
    new StringSession(stringSession),
    apiId,
    apiHash,
    { connectionRetries: 5 }
  );
  await client.start({
    botAuthToken: BOT_TOKEN,
  });
  console.log(client.session.save());
})();