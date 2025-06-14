// Require the necessary discord.js classes
const { Client, Events, GatewayIntentBits, Partials } = require('discord.js');
const { token } = require('./config.json');

//loading botChannels.json into memory
const fs = require('fs');
const botChannelPath = './botChannels.json';
let botChannels = {};
function loadBotChannels() {
    if (fs.existsSync(botChannelPath)) {
        botChannels = JSON.parse(fs.readFileSync(botChannelPath));
    }
}
function saveBotChannels() {
    fs.writeFileSync(botChannelPath, JSON.stringify(botChannels, null, 2));
}
loadBotChannels();

//loading userSettings.json into memory
const userSettingsPath = './userSettings.json';
let userSettings = {};
function loadUserSettings() {
    if (fs.existsSync(userSettingsPath)) {
        userSettings = JSON.parse(fs.readFileSync(userSettingsPath));
    }
}
function saveUserSettings() {
    fs.writeFileSync(userSettingsPath, JSON.stringify(userSettings, null, 2));
}
loadUserSettings();

async function messageHandler(message) {
    if (message.author.bot || !message.guild) return; //makes sure the dm is not a 
    switch (message.content) {
        case '!lelper':
            if (message.guildId in botChannels) {
                if (!message.channelId == botChannels[message.guildId]) return;
                try {
                    await message.author.send('I will start notifying you if there are more than 2 people in a voice channel in this server.');
                    userSettings[message.author.id] = true;
                    saveUserSettings();
                } catch (err) {
                    console.error('Failed to DM user: ', err);
                    await message.reply('I couldnt DM you!');
                }
            }
            else {
                message.reply('A bot channel has not been set for this server or this is not the bot channel. \
                    Set botchannel by typing !setLelperBotChannel in the channel you want to set as the bot channel.');
            }
            break;
        case '!lelperStop':
            if (message.guildId in botChannels) {
                if (!message.channelId == botChannels[message.guildId]) return;
                try {
                    await message.author.send('I will STOP notifying you if there are more than 2 people in a voice channel in this server.');
                    userSettings[message.author.id] = false;
                    saveUserSettings();
                } catch (err) {
                    console.error('Failed to DM user: ', err);
                    await message.reply('I couldnt DM you!');
                }
            }
            else {
                message.reply('A bot channel has not been set for this server or this is not the bot channel. \
                    Set botchannel by typing !setLelperBotChannel in the channel you want to set as the bot channel.');
            }
            break;
        case '!setLelperBotChannel':
            if (!message.member.permissions.has('ManageGuild')) {
                message.reply("You need manage server permissions.");
                return;
            }
            botChannels[message.guildId] = message.channelId;
            saveBotChannels();
            break;
        default:
            break;
    }
}

// Create a new client instance
const client = new Client({ intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
    ],
    partials: [Partials.Channel] 
});

client.once(Events.ClientReady, readyClient => {console.log(`Ready! Logged in as ${readyClient.user.tag}`);});

client.on(Events.MessageCreate, async message => {
    messageHandler(message);
});

client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
    console.log("three voice state updates?");
    if (oldState.channelId === null && newState.channelId != null) { //join
        //check if new server is now active.
        if (newState.channel.members.size >= 2) {
            const activeChannelName = newState.channel.name;
            const activeGuildName = newState.guild.name;
            for (const userId in userSettings) {
                if (userSettings[userId] === true) {
                    const userToDm = await client.users.fetch(userId);
                    await userToDm.send(`${activeChannelName} in ${activeGuildName} is just went active!`);
                }
            }
        }
    }
    else if (oldState.channelId != null && newState.channelId === null) {//leave
        //check if oldstate is still active.
        if (oldState.channel.members.size < 2) {
            const activeChannelName = oldState.channel.name;
            const activeGuildName = oldState.guild.name;
            for (const userId in userSettings) {
                if (userSettings[userId] === true) {
                    const userToDm = await client.users.fetch(userId);
                    await userToDm.send(`${activeChannelName} in ${activeGuildName} is no longer active!`);
                    await userToDm.send
                }
            }
        }
    }
    else if (oldState.channelId === newState.channelId) {// not join/leave/move
        return; //do nothing
    }
    else { //moves
        //check both
        if (newState.channel.members.size >= 2) {
            const activeChannelName = newState.channel.name;
            const activeGuildName = newState.guild.name;
            for (const userId in userSettings) {
                if (userSettings[userId] === true) {
                    const userToDm = await client.users.fetch(userId);
                    await userToDm.send(`${activeChannelName} in ${activeGuildName} is just went active!`);
                    await userToDm.send
                }
            }
        }
        if (oldState.channel.members.size < 2) {
            const activeChannelName = oldState.channel.name;
            const activeGuildName = oldState.guild.name;
            for (const userId in userSettings) {
                if (userSettings[userId] === true) {
                    const userToDm = await client.users.fetch(userId);
                    await userToDm.send(`${activeChannelName} in ${activeGuildName} is no longer active!`);
                    await userToDm.send
                }
            }
        }
    }
});

// Log in to Discord with your client's token
client.login(token);