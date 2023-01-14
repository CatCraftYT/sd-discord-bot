# Stable Diffusion Discord Bot
This is a discord bot for use with [AUTOMATIC1111's stable diffusion webui](https://github.com/AUTOMATIC1111/stable-diffusion-webui).
## Installation & Usage
- Clone (or download and extract) this repository.
- Install [node.js](https://nodejs.org).
- Setup and download [ngrok](https://ngrok.com) or forward port 3000.
- Download and setup AUTOMATIC1111's Stable Diffusion webui ([installation instructions](https://github.com/AUTOMATIC1111/stable-diffusion-webui#installation-and-running)).
- Create an app and bot in the Discord developer dashboard, and install it to your server ([guide](https://discord.com/developers/docs/getting-started#creating-an-app)). **The bot requires attach files and embed links permissions** (on top of the basic permissions in the guide).
- Create a file in the bot's folder called `.env` and put the following inside it:
```
APP_ID=<YOUR_APP_ID>
GUILD_ID=<YOUR_GUILD_ID>
DISCORD_TOKEN=<YOUR_BOT_TOKEN>
PUBLIC_KEY=<YOUR_PUBLIC_KEY>
```
All of the information can be found in the Discord developer dashboard ([details](https://discord.com/developers/docs/getting-started#adding-credentials)).

The following steps should be done in seperate terminals:
- Start the Stable Diffusion webui.
- Start the app by running the command `node app.js` in the bot's folder.
- Start ngrok using the command `ngrok http 3000` and copy the link into the interactions endpoint URL in the developer dashboard. The changes should save successfully if the node server is running.

The bot should now be online and slash commands available in your server.
