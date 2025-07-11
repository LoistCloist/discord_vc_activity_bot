const { SlashCommandBuilder, StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const path = require('path');
const { loadUserSettings, saveUserSettings } = require(path.join(__dirname, '../utils/jsonStorage.js'));

module.exports = {
    data: new SlashCommandBuilder()
                .setName('lelper_settings')
                .setDescription('Change your Lelper bot settings.'),
    async execute(interaction) {
        const voice_channels = await interaction.guild.channels.fetch();
        const members = await interaction.guild.members.fetch();
        const voiceChannelOptions = [{label: 'Any', value: 'ANY'}, voice_channels
                                        .filter(c => c.type === 2)
                                        .map(vc => ({
                                            label: vc.name,
                                            value: vc.id
                                        }))];
        const voiceSelectMenu = new StringSelectMenuBuilder()
                                    .setCustomId('vc_select_menu')
                                    .setPlaceholder('Select voice channels')
                                    .setMinValues(1)
                                    .setMaxValues(Math.min(25, voiceChannelOptions.length))
                                    .addOptions([...voiceChannelOptions].slice(0,25));
        const memberOptions = [{label: 'Any', value: 'ANY'}, ...members
                                .filter(m => !m.user.bot)
                                .map(m => ({
                                    label: m.user.username,
                                    value: m.user.id
                                }))];
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
        await interaction.reply({
            content: 'Select your preferences.',
            components: [row1, row2, row3, row4],
            ephemeral: true
        });
    }
};

