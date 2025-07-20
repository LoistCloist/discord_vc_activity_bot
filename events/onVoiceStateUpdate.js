const { Events } = require('discord.js');
const path = require('path');
const { saveActiveChannels } = require('../utils/jsonStorage');
const { loadUserSettings, loadActiveChannels } = require(path.join(__dirname, '../utils/jsonStorage.js'));
const { sendDM, makeChannelDormant, makeChannelActive } = require(path.join(__dirname, '../utils/helperMethods.js'));

function checkStateConditions(voiceState, userSettings, guildId, userId) { // checks if VIP, member_count, and channels are satisfied.
    if (!voiceState || !voiceState.channel) return false;
    if (!userSettings || !userSettings.tracking) return false;

    const channelsSatisfied = userSettings.channels.includes('ANY') || userSettings.channels.includes(voiceState.channel.id);
    if (!channelsSatisfied) return false;
    console.log('13');

    const memberCount = voiceState.channel.members.size;
    console.log(`memberCount: ${memberCount}`);
    console.log(`triggerCount: ${userSettings.trigger}`);
    const triggerSatisfied = memberCount >= parseInt(userSettings.trigger);
    if (!triggerSatisfied) return false;
    console.log('14');

    const vipSatisfied = userSettings.VIPS.includes('ANY') || userSettings.VIPS.some(vipId => voiceState.channel.members.has(vipId));
    if (channelsSatisfied && triggerSatisfied && vipSatisfied) return true;
    console.log('15');
    return false;
    console.log('17');

}

function checkPrevStateConditions(oldState, userSettings, guildId, userId) {
    if (!oldState || !oldState.channel) return false;
    if (!userSettings || !userSettings.tracking) return false;

    const leaverId = oldState.id;
    const previousMemberIds = [...oldState.channel.members.keys(), leaverId];
    const previousMemberCount = oldState.channel.members.size + 1;

    const channelsSatisfied = userSettings.channels.includes('ANY') || userSettings.channels.includes(voiceState.channel.id);
    if (!channelsSatisfied) return false;


    const triggerSatisfied = previousMemberCount >= parseInt(userSettings.trigger);
    if (!triggerSatisfied) return false;

    const vipSatisfied = userSettings.VIPS.includes('ANY') || userSettings.VIPS.some(vipId => previousMemberIds.has(vipId));
    if (channelsSatisfied && triggerSatisfied && vipSatisfied) return true;
    return false;
}

function getVipNameSet(newState, userSettings, guildId, userId) {
    const vipSet = new Set();
    const unfilteredVips = userSettings.VIPS;
    newState.channel.members.forEach((member, userId) => {
        // If VIPS is 'ANY', everyone is a VIP
        if (unfilteredVips.includes('ANY') || unfilteredVips.includes(userId)) {
            vipSet.add(member.user.username);
        }
    });
    return vipSet;
}
// This function gets a set of UserIds that have toggled on tracking using LelperOn.
function getTrackingUserIds(userSettings) {
    let trackingUserIds = new Set();
    for (const guildId in userSettings) {
        const guildUsers = userSettings[guildId];
        for (const userId in guildUsers) {
            if (guildUsers[userId].tracking == true) {
                trackingUserIds.add(userId);
            }
        }
    }
    return trackingUserIds;
}

module.exports = {
    name: Events.VoiceStateUpdate,
    async execute(oldState, newState, client) {
        const allUserSettings = loadUserSettings();
        const trackingUserIds = getTrackingUserIds(allUserSettings);
        const guildId = newState.guild.id;
        const activeChannels = loadActiveChannels();

        const isJoin = (oldState.channel == null) && newState.channel;
        const isLeave = oldState.channel && (newState.channel == null);
        const isMove = oldState.channel !== newState.channel && oldState.channel !== null && newState.channel !== null;
        
        if (!isJoin && !isLeave && !isMove) return;

        console.log(`Voice state change detected: ${isJoin ? 'JOIN' : isLeave ? 'LEAVE' : 'MOVE'} - User: ${newState.member?.user?.username || oldState.member?.user?.username}`);
        for (const userId of trackingUserIds) {
            const userSettings = allUserSettings[guildId]?.[userId];
            const isPrevStateSatisfied = checkPrevStateConditions(oldState, userSettings, oldState.guild.id, oldState.member.user.id);
            const isNewStateSatisfied = checkStateConditions(newState, userSettings, newState.guild.id, newState.member.user.id);
            const activeChannels = loadActiveChannels();
            if (!activeChannels[guildId]) activeChannels[guildId] = {};
            if (!activeChannels[guildId][userId]) activeChannels[guildId][userId] = [];

            // Step 1: conditions are met
            // Channel inactive -> active
            if (!isPrevStateSatisfied && isNewStateSatisfied) {
                const isCurrChannelAlreadyActive = (
                    activeChannels[guildId] &&
                    activeChannels[guildId]?.[userId] &&
                    activeChannels[guildId]?.[userId].includes(newState.channel.id)
                );
                if (!isCurrChannelAlreadyActive) {
                    makeChannelActive(activeChannels, guildId, userId, newState.channel.id);
                    const vipNameSet = getVipNameSet(newState, userSettings, guildId, userId);
                    const message = `${newState.channel.name} has gone active with the following VIPs: ${Array.from(vipNameSet).join(', ')}`;
                    sendDM(client, userId, message);
                }
                else {// Channel active -> active
                    //find a list of VIPs that just joined.
                    // Additional vips have joined!
                    // Current VIP list
                    const vipNameSet = getVipNameSet(newState, userSettings, guildId, userId);
                    const message = `Additional VIPs have just joined ${newState.channel.name}!\nCurrent VIPS: ${Array.from(vipNameSet).join(',')}`;
                    sendDM(client,userId,message);
                }
        }
            console.log('isOldStateSatisfied:', isPrevStateSatisfied);
            console.log('isNewStateSatisfied:', isNewStateSatisfied);
            if (isPrevStateSatisfied && !isNewStateSatisfied) {
                const isPrevChannelActive = (
                    activeChannels[guildId] &&
                    activeChannels[guildId][userId] &&
                    activeChannels[guildId][userId].includes(oldState.channel.id)
                );
                console.log('isPrevChannelActive:', isPrevChannelActive);      
                // Channel has gone dormant!
                if (isPrevChannelActive) {
                    makeChannelDormant(activeChannels, guildId, userId, oldState.channel.id);
                    const message = `${oldState.channel.name} just went dormant!`;
                    sendDM(client, userId, message);
                }
            }
            //Channel active -> inactive:
        }
    }
    }
