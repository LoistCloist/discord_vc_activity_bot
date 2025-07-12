# Discord VC Activity Bot 🎧

A smart Discord bot that monitors voice channel activity and sends you personalized notifications when your favorite channels become active or inactive. Perfect for staying connected with your community!

## ✨ Features

- **Smart Voice Channel Monitoring** - Tracks activity in specific voice channels
- **VIP User Tracking** - Get notified when specific users join/leave channels
- **Customizable Triggers** - Set minimum member count requirements
- **Real-time DM Notifications** - Receive instant updates via private messages
- **Interactive Settings** - Easy-to-use slash commands and menus
- **Multi-Server Support** - Works across all servers where the bot is present

## 🚀 Quick Start

### Invite the Bot to Your Server

1. **Click the invite link below to add the bot to your Discord server:**
   ```
   [BOT_INVITE_LINK_WILL_GO_HERE]
   ```

2. **Grant the necessary permissions:**
   - Read Messages/View Channels
   - Send Messages
   - Use Slash Commands
   - Connect to Voice Channels
   - View Voice Channels

3. **Start using the bot!**
   - Use `/lelper_on` to enable activity tracking
   - Use `/lelper_settings` to customize your preferences
   - The bot will start monitoring voice channels and send you DM notifications

### Bot Permissions Required

The bot needs the following permissions to function properly:
- **Send Messages** - To respond to commands
- **Use Slash Commands** - For the interactive command system
- **Connect to Voice Channels** - To monitor voice activity
- **View Voice Channels** - To see who's in voice channels
- **Send Direct Messages** - To send you notifications

## 📋 Commands

### Slash Commands

| Command | Description |
|---------|-------------|
| `/lelper_on` | Enable activity tracking for yourself |
| `/lelper_off` | Disable activity tracking |
| `/lelper_settings` | Configure your tracking preferences |
| `/lelper_set_bot_channel` | Set the bot's command channel |

### Legacy Text Commands

| Command | Description |
|---------|-------------|
| `!lelper` | Enable activity tracking |
| `!lelperStop` | Disable activity tracking |
| `!setBotChannel` | Set bot channel |

## ⚙️ Configuration

Use `/lelper_settings` to customize your experience:

### Voice Channels
- Select specific voice channels to monitor
- Choose "Any" to monitor all voice channels

### VIP Users
- Select specific users to track
- Choose "Any" to track all users
- Get notified when VIP users join/leave

### Trigger Settings
- Set minimum member count (1-25 users)
- Bot will only notify when this threshold is met

## 🔧 How It Works

The bot works by monitoring voice channels in your Discord server and sending you personalized notifications when activity changes. Here's what happens:

1. **Setup**: You configure which channels, users, and conditions to monitor
2. **Monitoring**: The bot watches voice channel activity in real-time
3. **Detection**: When your criteria are met, the bot detects the change
4. **Notification**: You receive a DM with details about the activity change

### What You'll Get Notified About

- **Channel Active**: When a voice channel becomes active according to your settings
- **Channel Inactive**: When a voice channel is no longer active
- **VIP Changes**: When important users join or leave monitored channels

## 🏗️ For Developers

This section is for developers who want to contribute to the bot or run their own instance.

### Prerequisites
- Node.js (v16 or higher)
- A Discord Bot Token
- Discord.js v14

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/LoistCloist/discord_vc_activity_bot.git
   cd discord_vc_activity_bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up your bot token**
   Create a `config.json` file in the root directory:
   ```json
   {
     "token": "YOUR_DISCORD_BOT_TOKEN_HERE"
   }
   ```

4. **Deploy slash commands** (choose one):
   ```bash
   # For global deployment (takes up to 1 hour to propagate)
   node deploy-commands-global.js
   
   # For local testing (immediate)
   node deploy-commands-local.js
   ```

5. **Start the bot**
   ```bash
   node index.js
   ```

### Project Structure

```
discord_vc_activity_bot/
├── commands/           # Slash command definitions
├── events/            # Discord.js event handlers
├── utils/             # Helper functions and utilities
├── data/              # JSON storage files
├── index.js           # Main bot entry point
├── deploy-commands-*.js # Command deployment scripts
└── README.md          # This file
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/LoistCloist/discord_vc_activity_bot/issues) page
2. Create a new issue with detailed information
3. Include your Node.js version and Discord.js version

## 🔮 Future Features

- [ ] Cloud hosting support
- [ ] NLP integration for better user experience
- [ ] Anti-spam protection for notifications
- [ ] Web dashboard for settings management
- [ ] Analytics and activity reports

---

**Made with ❤️ for the Discord community**