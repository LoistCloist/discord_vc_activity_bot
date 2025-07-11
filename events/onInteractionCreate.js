const { ComponentType, BaseInteraction, InteractionResponse, MessageFlags } = require('discord.js');
const path = require('path');
const { loadUserSettings, saveUserSettings } = require(path.join(__dirname, '../utils/jsonStorage.js'));
const userSelections = new Map(); //stores user selections until submit button is pressed.
module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;
            
            try {
                await command.execute(interaction, client);
            } catch (error) {
                console.error(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'Error executing this command',   flags: MessageFlags.Ephemeral
                    });

                }
                else {
                    await interaction.reply({content: `There was an error executing this command!`,   flags: MessageFlags.Ephemeral
                    });
                }
            }
            return;
        }

        if (interaction.isButton() && !interaction.customId === 'submit_button') { //settings button
            //handle select menu interactions
            const menuCustomId = interaction.customId;
            let selections = userSelections.get(userId) || {};
            switch (menuCustomId) {
                case 'vc_select_menu':
                    selections.voiceChannels = interaction.values;
                    break;
                case 'member_select_menu':
                    selections.VIPS = interaction.values;
                    break;
                case 'trigger_select_menu':
                    selections.trigger = interaction.values[0];
                    break;
            }
            userSelections.set(userId, selections);
            await interaction.reply({
                content: 'Saved! Submit to save your settings.',
                flags: MessageFlags.Ephemeral
            });
        }
        if (interaction.isButton() && interaction.customId === 'submit_button') {
            const guildId = interaction.guildId;
            const userId = interaction.user.id;
            const selections = userSelections.get(userId);
            if (!selections) {
                await interaction.reply({
                    content: 'No settings have been set yet.',
                    flags: MessageFlags.Ephemeral

                });
                return;
            }
            if (!guildId) {
                await interaction.reply({
                    content: 'This command can only be used in a server.',
                    flags: MessageFlags.Ephemeral

                });
                return;
            }
            const userSettings = loadUserSettings();
            if (!userSettings[guildId]) {
                userSettings[guildId] = {};
            }
            userSettings[guildId][userId] = {
                trigger: selections.trigger,
                channels: selections.voiceChannels,
                VIPS: selections.VIPS,
                tracking: false
            };
            saveUserSettings(userSettings);
            userSelections.delete(userId);
            await interaction.reply({
                content: 'Your settings have been saved!',
                flags: MessageFlags.Ephemeral

            });
        }
        if (interaction.isAnySelectMenu()) {
            //handle button interactions
            console.log('Select menu interaction received.');
            const userId = interaction.user.id;
            let selections = userSelections.get(userId) || {};
            switch (interaction.customId) {
                case 'vc_select_menu':
                    console.log('Matched vc');
                    selections.voiceChannels = interaction.values;
                    break;
                case 'member_select_menu':
                    console.log('Matched member');

                    selections.VIPS = interaction.values;
                    break;
                case 'trigger_select_menu':
                    console.log('Matched trigger');

                    selections.trigger = interaction.values[0];
                    break;
            }
            userSelections.set(userId, selections);
            await interaction.reply({
                content: 'Saved! Submit to save your settings.',
                flags: MessageFlags.Ephemeral

            });
        }
    }
}