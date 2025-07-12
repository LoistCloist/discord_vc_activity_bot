const { SlashCommandBuilder, StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const path = require('path');
const { loadUserSettings, saveUserSettings } = require(path.join(__dirname, '../utils/jsonStorage.js'));

module.exports = {
    data: new SlashCommandBuilder()
                .setName('lelper_settings')
                .setDescription('Change your Lelper bot settings.'),
    async execute(interaction) {
        // Defer the reply immediately to prevent timeout
        await interaction.deferReply({ ephemeral: true });
        
        try {
            // Fetch only voice channels and members, with limits
            const voice_channels = await interaction.guild.channels.fetch();
            const members = await interaction.guild.members.fetch({ limit: 100 }); // Limit to 100 members for performance
        const voiceChannelOptions = [
            {label: 'Any', value: 'ANY'}, 
            ...voice_channels
                .filter(c => c.type === 2)
                .map(vc => ({
                    label: vc.name,
                    value: vc.id
                }))
        ];
        const voiceSelectMenu = new StringSelectMenuBuilder()
                                    .setCustomId('vc_select_menu')
                                    .setPlaceholder('Select voice channels')
                                    .setMinValues(1)
                                    .setMaxValues(Math.min(25, voiceChannelOptions.length))
                                    .addOptions(voiceChannelOptions.slice(0,25));
        const memberOptions = [
            {label: 'Any', value: 'ANY'}, 
            ...members
                .filter(m => !m.user.bot)
                .map(m => ({
                    label: m.user.username,
                    value: m.user.id
                }))
        ];
        const memberSelectMenu = new StringSelectMenuBuilder()
                                .setCustomId('member_select_menu')
                                .setPlaceholder('Select users')
                                .setMinValues(1)
                                .setMaxValues(Math.min(25, memberOptions.length))
                                .addOptions(memberOptions.slice(0,25));
        const triggerWeightSelectMenu = new StringSelectMenuBuilder()
                                            .setCustomId('trigger_select_menu')
                                            .setPlaceholder('Notify when [x] users active (optional)')
                                            .setMinValues(1)
                                            .setMaxValues(1)
                                            .addOptions(Array.from({ length: 25 }, (_, i) => ({label: `${i + 1}`,value: `${i + 1}`})));
        const submitButton = new ButtonBuilder()
                                .setCustomId('submit_button')
                                .setLabel('Submit')
                                .setStyle(ButtonStyle.Primary);
        const row1 = new ActionRowBuilder().addComponents(voiceSelectMenu);
        const row2 = new ActionRowBuilder().addComponents(memberSelectMenu);
        const row3 = new ActionRowBuilder().addComponents(triggerWeightSelectMenu);
        const row4 = new ActionRowBuilder().addComponents(submitButton);
        
        await interaction.editReply({
            content: 'Select your preferences.',
            components: [row1, row2, row3, row4]
        });
        } catch (error) {
            console.error('Error in lelper_settings command:', error);
            try {
                await interaction.editReply({
                    content: 'There was an error setting up the settings menu. Please try again.',
                });
            } catch (editError) {
                console.error('Failed to send error message:', editError);
            }
        }
    }
};

