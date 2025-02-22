# 🌟 @funwalabot 🌟

## Telegram Bot Designed for @shhhhhfirkoih

Live Link : `https://t.me/funwalabot`

Welcome to the official repository of `@funwalabot` (formerly 🪦xaurav_assistant_bot 🪦) This bot is designed to cater to a variety of tasks and functionalities for Telegram users, whether in group chats, channels, or direct messages.

---

use `/help` for all commands

<details>
<summary>Expand to View Demo</summary>
<img src="https://cdn.jsdelivr.net/gh/sauravtechno/main-d@main/assets/test/help_menu.webp" alt="Help Menu">
</details>

# 📜 Features and Commands

### Latency Check

`/ping` — Check the bot's uptime and responsiveness.

<details>
<summary>Expand to View Demo</summary>
<img src="https://cdn.jsdelivr.net/gh/sauravtechno/main-d@main/assets/test/ping.webp" alt="Ping Command">
</details>

### YouTube to MP3

`/song <song_name>` — Convert YouTube videos to MP3 by providing the song or video name.

<details>
<summary>Expand to View Demo</summary>
<img src="https://cdn.jsdelivr.net/gh/sauravtechno/main-d@main/assets/test/SONG.webp" alt="Song Command">
</details>

### AI Chatbot

`/ask <query>` — Query the Google Gemini API for answers or assistance.

<details>
<summary>Expand to View Demo</summary>
<img src="https://cdn.jsdelivr.net/gh/sauravtechno/main-d@main/assets/test/ai-chat.webp" alt="AI Chat Command">
</details>

### GIF Generator

`/gif` — Retrieve random GIFs from a specific channel.

<details>
<summary>Expand to View Demo</summary>
<img src="https://cdn.jsdelivr.net/gh/sauravtechno/main-d@main/assets/test/GIF.webp" alt="GIF Command">
</details>

### Lyrics Finder

`/lyrics <song_name> by <singer_name>` — Find the lyrics of popular or foreign songs.

### AI Image Generation

`/gen <prompt>` — Generate high-quality AI images.

<details>
<summary>Expand to View Demo</summary>
<img src="https://cdn.jsdelivr.net/gh/sauravtechno/main-d@main/assets/test/ai-chat.webp" alt="Generate AI Image">
</details>

### Reel Transfer

Transfer Instagram reels to Telegram channels with meta tags for easy querying.

<details>
<summary>Expand to View Demo</summary>
<img src="https://cdn.jsdelivr.net/gh/sauravtechno/main-d@main/assets/test/main-reel-webp.webp" alt="Reel Forwarding">
</details>

### User ID Retrieval

`/userid` — Retrieve your Telegram user ID.

### Owner Commands

`/stop <password>` — Stop the server (restricted access).

### Fun Commands

`/fun` — Trigger a fun response (use sparingly).

---

## 🚧 Status

- Bot Status: The bot is currently operational and running
- Live Link : `https://t.me/funwalabot`

---

## ⚙️ Installation

Follow these steps to set up and run the bot:

1. Clone the Repository
   git clone https://github.com/xauravww/xauravww-tg-userbot.git
   cd xauravww-tg-userbot

2. Install Dependencies
   Make sure you have Node.js installed. Then, install the required dependencies:
   npm install

3. Setup Environment Variables
   Create a .env file in the root directory and add the following variables:

## 🗂 Environment Structure

      API_KEY="your_api_key"
      API_HASH="your_api_hash"
      SESSION_STRING="your_session_string"
      CRASH_PASS="your_crash_password"
      GEMINI_API_KEY="your_gemini_api_key"
      RENDER_BACKEND_URL="your_render_backend_url"
      VERIFY_TOKEN="saurav"
      BOT_STATUS_MESSAGE="Bot live status and about information"
      TELEGRAM_REELS_CHANNEL_USERNAME="username without @"
      GIFS_CHANNEL_USERNAME="username of channel without @ containing only gifs"
      FILTERED_TEXT_GEMINI="add extra prompt text to apply filters to gemini output"
      FREE_IMG_GEN_API="paste endpoint url here"
      REPLICATE_API_VERSION="some_api_version"
      REPLICATE_API_ENDPOINT="paste endpoint here"
      FLUX_SCHNELL_API_ENDPOINT="paste endpoint here"
      FLUX_SCHNELL_API_MODEL_SUFFIX="paste endpoint here"
      DEV_USERNAME="@shhhhhfirkoih"
      YT_DOWNLOADER_API_URL="api endpoint here"
      MODEL_NAME_GEMINI="model name"
      SYSTEM_INSTRUCTIONS_GEMINI="paste your system instructions"
      OWNER_USERID="paste userid"
      DEV2_USERNAME ="aatma_2502"
      MY_AUDIO_CHANNEL ="username"
      REDIS_USERNAME = "username"
      REDIS_PASSWORD = "password"
      REDIS_HOST = "host url"
      REDIS_PORT = "port number"

1. Run the Bot
   node server.js

   ***

## ℹ️ (Note)

- To use reels forwarding, you need to have your own webhooks verified through the Instagram Graph API. If you are not familiar with it, you can contact me for assistance.

- Currently, this bot sends reels to `TELEGRAM_REELS_CHANNEL_USERNAME` telegram channel . As I do not have a business-approved account, I can only access reels shared to Instagram accounts added to my Meta app.

- For demonstration you can send your reels to my instagram account [@alpha_engineerz](https://instagram.com/alpha_engineerz) to see the reels in the telegram channel.
  Please make sure to provide the link along with the video with meta tags.
- You can login using bot as well as user account
- You have to join the TELEGRAM_REELS_CHANNEL_USERNAME channel using bot/user account to forward reels to that channel.

## 🦾 Get Session String for User or Bot Account

    https://gram.js.org/getting-started/authorization

If you have any doubt feel free to contact me on my telegram account
@shhhhhfirkoih
