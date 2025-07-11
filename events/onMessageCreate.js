const { Events, StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const path = require('path');
const { loadUserSettings, saveUserSettings } = require(path.join(__dirname, '../utils/jsonStorage.js'));

// These functions should be moved to a shared utilities file
const fs = require('fs');
const botChannelPath = './data/botChannels.json';
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

module.exports = {
    name: Events.MessageCreate,
    async execute(message, client) {
        if (message.author.bot || !message.guild) return; // don't accept dms or bots.
        
        switch (message.content) {
            case '!lelper':
                if (message.guildId in botChannels) {
                    if (!message.channelId != botChannels[message.guildId]) return;
                    try {
                        await message.author.send('I will start notifying you if there are more than 2 people in a voice channel in this server.');
                        const userSettings = loadUserSettings();
                        userSettings[message.author.id] = true;
                        saveUserSettings(userSettings);
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
                        const userSettings = loadUserSettings();
                        userSettings[message.author.id] = false;
                        saveUserSettings(userSettings);
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
            case '!lelperSettings':
                //prompt user for settings.
                const voice_channels = await message.guild.channels.fetch();
                const members = await message.guild.members.fetch();
                const voiceChannelOptions = voice_channels
                                             .filter(c => c.type === 2)
                                                .map(vc => ({
                                                    label: vc.name,
                                                    value: vc.id
                                                }));
                const voiceSelectMenu = new StringSelectMenuBuilder()
                                            .setCustomId('vc_select_menu')
                                            .setPlaceholder('Select voice channels')
                                            .setMinValues(1)
                                            .setMaxValues(Math.min(25, voiceChannelOptions.length))
                                            .addOptions([...voiceChannelOptions].slice(0,25));
                const memberOptions = members
                                        .filter(m => !m.user.bot)
                                        .map(m => ({
                                            label: m.user.username,
                                            value: m.user.id
                                        }));
                const memberSelectMenu = new StringSelectMenuBuilder()
                                        .setCustomId('member_select_menu')
                                        .setPlaceholder('Select users')
                                        .setMinValues(1)
                                        .setMaxValues(Math.min(25, memberOptions.length))
                                        .addOptions(memberOptions.slice(0,25));
                const triggerWeightSelectMenu = new StringSelectMenuBuilder()
                                                    .setCustomId('trigger_select_menu')
                                                    .setPlaceholder('Notify when [x] users active (optional)')
                                                    .setMinValues(0)
                                                    .setMaxValues(1)
                                                    .addOptions(Array.from({ length: 25 }, (_, i) => ({
                                                                                label: `${i + 1}`,
                                                                                value: `${i + 1}`
                                                                            })));
                const submitButton = new ButtonBuilder()
                                        .setCustomId('submit_button')
                                        .setLabel('Submit')
                                        .setStyle(ButtonStyle.Primary);
                const row1 = new ActionRowBuilder().addComponents(voiceSelectMenu);
                const row2 = new ActionRowBuilder().addComponents(memberSelectMenu);
                const row3 = new ActionRowBuilder().addComponents(triggerWeightSelectMenu);
                const row4 = new ActionRowBuilder().addComponents(submitButton);
                const sentPrompt = await message.reply({
                                        content: 'Configure your settings below, then click submit.',
                                        components: [row1, row2, row3, row4]
                                    });
                const collector = sentPrompt.createMessageComponentCollector({
                    time: 60000
                });
                const selections = {}; //temporary storage for settings.
                
                break;
            default:
                break;
        }
    }
}; 