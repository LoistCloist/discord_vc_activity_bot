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
                try {
                    if (interaction.replied || interaction.deferred) {
                        await interaction.followUp({ 
                            content: 'Error executing this command', 
                            flags: MessageFlags.Ephemeral
                        });
                    } else {
                        await interaction.reply({
                            content: `There was an error executing this command!`, 
                            flags: MessageFlags.Ephemeral
                        });
                    }
                } catch (replyError) {
                    console.error('Failed to send error message:', replyError);
                }
            }
            return;
        }

        if (interaction.isButton() && interaction.customId !== 'submit_button') {
            // Handle non-submit button interactions (if any)
            try {
                await interaction.reply({
                    content: 'Button pressed!',
                    flags: MessageFlags.Ephemeral
                });
            } catch (error) {
                console.error('Failed to reply to button interaction:', error);
            }
        }
        if (interaction.isButton() && interaction.customId === 'submit_button') {
            const guildId = interaction.guildId;
            const userId = interaction.user.id;
            const selections = userSelections.get(userId);
            
            try {
                // Defer reply to prevent timeout
                await interaction.deferReply({ ephemeral: true });
                
                if (!selections) {
                    await interaction.editReply({
                        content: 'No settings have been set yet.'
                    });
                    return;
                }
                if (!guildId) {
                    await interaction.editReply({
                        content: 'This command can only be used in a server.'
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
                
                await interaction.editReply({
                    content: 'Your settings have been saved!'
                });
            } catch (error) {
                console.error('Failed to handle submit button:', error);
                try {
                    if (!interaction.replied && !interaction.deferred) {
                        await interaction.reply({
                            content: 'Error saving settings. Please try again.',
                            flags: MessageFlags.Ephemeral
                        });
                    } else {
                        await interaction.editReply({
                            content: 'Error saving settings. Please try again.'
                        });
                    }
                } catch (replyError) {
                    console.error('Failed to send error message:', replyError);
                }
            }
        }
        if (interaction.isAnySelectMenu()) {
            // Handle select menu interactions
            console.log('Select menu interaction received:', interaction.customId);
            const userId = interaction.user.id;
            let selections = userSelections.get(userId) || {};
            
            try {
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
                    default:
                        console.log('Unknown select menu:', interaction.customId);
                        return;
                }
                
                userSelections.set(userId, selections);
                
                // // Defer reply to prevent timeout
                // await interaction.deferReply({ ephemeral: true });
                // await interaction.editReply({
                //     content: 'Saved! Submit to save your settings.'
                // });
            } catch (error) {
                console.error('Failed to handle select menu interaction:', error);
                try {
                    if (!interaction.replied && !interaction.deferred) {
                        await interaction.reply({
                            content: 'Error saving selection. Please try again.',
                            flags: MessageFlags.Ephemeral
                        });
                    } else {
                        await interaction.editReply({
                            content: 'Error saving selection. Please try again.'
                        });
                    }
                } catch (replyError) {
                    console.error('Failed to send error message:', replyError);
                }
            }
        }
    }
}