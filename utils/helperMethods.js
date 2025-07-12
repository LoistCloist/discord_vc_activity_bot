const { loadUserSettings, storeDMMessage, getDMMessage, removeDMMessage } = require('./jsonStorage.js');

/**
 * Send or edit a DM notification to a user
 * @param {Object} user - Discord user object
 * @param {string} guildId - Guild ID
 * @param {string} channelId - Voice channel ID
 * @param {string} content - Message content
 * @param {Object} client - Discord client
 * @returns {Promise<boolean>} - Success status
 */
async function sendOrEditDM(user, guildId, channelId, content, client) {
    try {
        // Check if we have a stored message ID for this user/channel
        const storedMessageId = getDMMessage(guildId, user.id, channelId);
        
        if (storedMessageId) {
            // Try to edit existing message
            try {
                const dmChannel = await user.createDM();
                const message = await dmChannel.messages.fetch(storedMessageId);
                await message.edit(content);
                return true;
            } catch (error) {
                // Message might be too old or deleted, fall back to sending new message
                console.log(`Could not edit message ${storedMessageId}, sending new message`);
                removeDMMessage(guildId, user.id, channelId);
            }
        }
        
        // Send new message
        const dmChannel = await user.createDM();
        const message = await dmChannel.send(content);
        
        // Store the new message ID
        storeDMMessage(guildId, user.id, channelId, message.id);
        return true;
        
    } catch (error) {
        console.error('Failed to send/edit DM:', error);
        return false;
    }
}

/**
 * Clear stored DM message for a user/channel
 * @param {string} guildId - Guild ID
 * @param {string} userId - User ID
 * @param {string} channelId - Voice channel ID
 */
function clearDMMessage(guildId, userId, channelId) {
    removeDMMessage(guildId, userId, channelId);
}

module.exports = {
    sendOrEditDM,
    clearDMMessage
};
