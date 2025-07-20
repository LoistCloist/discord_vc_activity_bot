const { saveActiveChannels, loadActiveChannels } = require('../utils/jsonStorage.js');

async function sendDM(client, targetUserId, message) {
    try {
        const user = await client.users.fetch(targetUserId);
        await user.send(message);
        console.log(`DM sent to user ${targetUserId} - ${user.username}`);
    } catch (error) {
        console.error(`Failed to send DM to user ${targertUserId} - ${user.username}: `, error);
    }
}
function makeChannelActive(activeChannels, guildId, userId, targetChannelId) {
    if (!activeChannels[guildId]) activeChannels[guildId] = {};
    if (!Array.isArray(activeChannels[guildId][userId])) activeChannels[guildId][userId] = [];
    activeChannels[guildId][userId].push(targetChannelId);
    saveActiveChannels(activeChannels);
}
function makeChannelDormant(activeChannels, guildId, userId, targetChannelId) {
    if (!activeChannels[guildId]) return;
    if (!Array.isArray(activeChannels[guildId][userId])) return;
    activeChannels[guildId][userId] = activeChannels[guildId][userId].filter(id => id !== targetChannelId);
    saveActiveChannels(activeChannels);
}
module.exports = { 
    sendDM,
    makeChannelActive,
    makeChannelDormant
}