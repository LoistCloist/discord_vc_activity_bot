const { SlashCommandBuilder } = require('discord.js');
const path = require('path');
const { loadUserSettings, saveUserSettings } = require(path.join(__dirname, '../utils/jsonStorage.js'));

module.exports = {
    data: new SlashCommandBuilder()
                .setName('lelper_on')
                .setDescription('Turns tracking off for Lelper.'),
    async execute(interaction) {
        const userSettings = loadUserSettings();
        const guildId = interaction.guildId;
        const userId = interaction.user.id;
        if (userSettings[guildId] && userSettings[guildId][userId]) {
            userSettings[guildId][userId].tracking = true;
            saveUserSettings(userSettings);
            await interaction.reply({content: 'Tracking has been turned on for you in this server.', ephemeral: true});
        }
        else {
            await interaction.reply({ content: 'No settings were found for you in this server. Use /lelperSettings to set up tracking first.', ephemeral: true});
        }
    }
}