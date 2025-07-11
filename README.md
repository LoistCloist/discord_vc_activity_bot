# Discord VC Activity Bot

A Discord bot that monitors voice channel activity and notifies users when channels become active or inactive.

## How the Events System Works

### Events Folder Structure

The `events/` folder contains all Discord.js event handlers. Each event file follows this structure:

```javascript
const { Events } = require('discord.js');

module.exports = {
    name: Events.EventName,  // The Discord.js event name
    once: false,             // Set to true for events that should only fire once
    async execute(...args, client) {
        // Event handling logic here
        // The client parameter is automatically passed by the event loader
    }
};
```

### Available Events

- **`onReady.js`** - Handles bot startup and initialization
- **`onMessageCreate.js`** - Handles legacy text commands (!lelper, !lelperStop, etc.)
- **`onInteractionCreate.js`** - Handles all interaction types:
  - Slash commands
  - Button interactions
  - Select menu interactions
  - Modal submissions
  - Autocomplete interactions
  - Context menu commands
- **`onVoiceStateUpdate.js`** - Monitors voice channel activity and sends notifications

### Adding New Events

1. Create a new file in the `events/` folder (e.g., `onGuildMemberAdd.js`)
2. Follow the standard event structure above
3. The event will be automatically loaded when the bot starts

### Event Loading

Events are automatically loaded in `index.js` using this code:

```javascript
// Load events
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
    console.log(`Loaded event: ${event.name}`);
}
```

## Commands

The `commands/` folder contains slash command definitions. Each command file exports:
- `data`: SlashCommandBuilder configuration
- `execute`: Function to handle the command

## Usage

1. Set up your bot token in `config.json`
2. Run `npm install` to install dependencies
3. Start the bot with `node index.js`

## Features

- Monitor voice channel activity
- Send DM notifications when channels become active/inactive
- Legacy text commands for basic functionality
- Modern slash commands for settings
- Interactive components (buttons, select menus)

# discord_vc_activity_bot
This discord bot will notify me if there are any active voice calls in the servers the bot is in.
!lelper - the bot will now notify you of servers that are active.
!lelperStop - the bot will not stop notifying you of servers that are active.
!setBotChannel - the bot will consider this to be the active bot channel.

Features to implement:
    1. Hosting on cloud.
    2. NLP integration for better user experience.
    3. Make sure users are not spammed by multiple joins/leaves.