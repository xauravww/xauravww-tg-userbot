# 🌟 @xaurav_assistant_bot 🌟

## Telegram Bot Designed for @shhhhhfirkoih

Welcome to the official repository of `@xaurav_assistant_bot` This bot is designed to cater to a variety of tasks and functionalities for Telegram users, whether in group chats, channels, or direct messages.

---

## 📜 Commands

The bot supports the following commands (case-insensitive):

1. `/ping`: Check the bot's uptime and latency.
2. `/song song_name`: Convert any YouTube video to MP3 by providing the song or video name.
3. `/ask any_query`: Use the Google Gemini API for querying (AI chatbot).
4. `/gif`: Generate random gifs from the channel.
5. `/lyrics song_name by singer_name`: Find the lyrics of a song (mostly for popular or foreign songs).
6. `/fun`: Trigger a fun response. (Please don't use this)
7. `/stop secret_password`: Stop the server (restricted to the owner).
8. `/userid`: Get the user's Telegram ID.
9. `/about`: Get information about the bot.
10. `/gen <prompt>` : to generate high quality ai images

---

## 📲 Features

- Reels Transfer: Transfers all Instagram reels to a Telegram channel with meta tags, allowing easy retrieval via queries.
- High Uptime: 99.999% uptime rate and bug-free operation.
- AI Integration: Utilizes the Google Gemini API for advanced querying capabilities uisng `/ask <prompt>`.
- Random GIFs: Generates random GIFs using `/gif` from the specified channel.
- YouTube to MP3: Downloads any YouTube video as an MP3 file by just providing the name of the song or video `/song <song_name>`.
- User ID Retrieval: `/userid` Allows users to retrieve their Telegram user ID.
- Lyrics Finder: Searches and provides `/lyrics <song_name> by <singer_name>` for songs, especially popular and foreign ones.
- Owner Commands: Special commands like `/stop <password>` are restricted to the owner for security.
- Latency Check: Use the `/ping` command to check the bot's responsiveness and uptime.
- AI Image Generation: Use the `/gen` command followed by a prompt to generate high quality AI images.

---

## 🚧 Status

- Bot Status: The bot is currently operational and not running as a userbot.
- UserBot Status: The UserBot is temporarily shut down for maintenance. Please check back later for updates.

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
       TELEGRAM_REELS_CHANNEL_USERNAME="username without @ "
       GIFS_CHANNEL_USERNAME="username of channel without @ containing only gifs"
       FILTERED_TEXT_GEMINI="add extra prompt text to apply filters to gemini output"
       FREE_IMG_GEN_API = "paste endpoint url here"
    
4. Run the Bot
        node msgs.js
    


    ---

## ℹ️ (Note)

- To use reels forwarding, you need to have your own webhooks verified through the Instagram Graph API. If you are not familiar with it, you can contact me for assistance.

  Currently, this bot sends reels to `TELEGRAM_REELS_CHANNEL_USERNAME` telegram channel  . As I do not have a business-approved account, I can only access reels shared to Instagram accounts added to my Meta app.

  For demonstration you can send your reels to my instagram account [@alpha_engineerz](https://instagram.com/alpha_engineerz) to see the reels in the telegram channel.
  Please make sure to provide the link along with the video with meta tags.

  e.g ► 

  send a reel with this text content

  reel link , some tags seperated by command for that reel.
- Make sure to install ffmpeg separately from the internet as it is not available in npm
- You can login using bot as well as user account
- You have to join the TELEGRAM_REELS_CHANNEL_USERNAME channel using bot/user account to forward reels to that channel.



## 🦾 Get Session String for User or Bot Account
    https://gram.js.org/getting-started/authorization

If you have any doubt feel free to contact me on my telegram account
@shhhhhfirkoih




