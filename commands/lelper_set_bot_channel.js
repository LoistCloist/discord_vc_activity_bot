const { SlashCommandBuilder } = require('discord.js');
const { loadBotChannels, saveBotChannels } = require('../utils/jsonStorage');
// get methods to get and set bot channels.
module.exports = {
    data: new SlashCommandBuilder()
            .setName('lelper_set_bot_channel')
            .setDescription('Set this channel as the bot channel for Lelper.'),
    async execute(interaction) {
        const guildID = interaction.guildId;
        const channelID = interaction.channelId;
        const botChannels = loadBotChannels();
        botChannels[guildID] = channelID;
        saveBotChannels(botChannels);
        
        await interaction.reply({
            content: `This channel has been set as the bot channel for this server.`,
            ephemeral: true
        })
    }
}