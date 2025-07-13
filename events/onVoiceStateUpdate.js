const { Events, NewsChannel } = require('discord.js');
const path = require('path');
const { loadUserSettings, sendOrEditDM } = require(path.join(__dirname, '../utils/jsonStorage.js'));

function checkStateConditions(voiceState, userSettings, guildId, userId, excludeUserId) { // checks if VIP, member_count, and channels are satisfied.
    const userConfig = userSettings[guildId]?.[userId];
    if (!voiceState || !voiceState.channel || !userConfig) return false;
    
    const channelsSatisfied = userConfig.channels.includes('ANY') || userConfig.channels.includes(voiceState.channel.id);
    if (!channelsSatisfied) return false;
    
    // Count members excluding the specified user if provided
    let memberCount = voiceState.channel.members.size;
    console.log(`Initial member count: ${memberCount}, excludeUserId: ${excludeUserId}`);
    if (excludeUserId && voiceState.channel.members.has(excludeUserId)) {
        memberCount--;
        console.log(`Member count after excluding ${excludeUserId}: ${memberCount}`);
    }
    const triggerSatisfied = memberCount >= parseInt(userConfig.trigger);
    console.log(`Trigger check: ${memberCount} >= ${userConfig.trigger} = ${triggerSatisfied}`);
    if (!triggerSatisfied) return false;

    // Check VIPs excluding the specified user if provided
    let vipSatisfied;
    if (userConfig.VIPS.includes('ANY')) {
        vipSatisfied = true;
    } else {
        vipSatisfied = userConfig.VIPS.some(vipId => {
            if (excludeUserId && vipId === excludeUserId) return false;
            return voiceState.channel.members.has(vipId);
        });
    }
    
    if (channelsSatisfied && triggerSatisfied && vipSatisfied) return true;
    return false;
}

function hasVIPListChanged(oldState, newState, userSettings, guildId, userId) {
    const oldVIPs = new Set(); const newVIPs = new Set();
    const userConfig = userSettings[guildId]?.[userId];
    if (!userConfig || !userConfig.VIPS || userConfig.VIPS.includes('ANY')) return false;
    if (oldState && oldState.channel) {
        userConfig.VIPS.forEach(vipId => {
            if (oldState.channel.members.has(vipId)) {
                oldVIPs.add(vipId);
            }
        })
    }
    if (newState && newState.channel) {
        userConfig.VIPS.forEach(vipId => {
            if (newState.channel.members.has(vipId)) {
                newVIPs.add(vipId);
            }
        });
    }
    
    if (oldVIPs.size !== newVIPs.size) return true;
    
    for (const vipId of oldVIPs) {
        if (!newVIPs.has(vipId)) return true;
    }
    
    for (const vipId of newVIPs) {
        if (!oldVIPs.has(vipId)) return true;
    }
    
    return false;
}

function hasVIPListChangedAfterLeave(oldState, userSettings, guildId, userId, leavingUserId) {
    const userConfig = userSettings[guildId]?.[userId];
    if (!userConfig || !userConfig.VIPS || userConfig.VIPS.includes('ANY')) return false;
    
    // Check if the leaving user was a VIP
    const wasLeavingUserVIP = userConfig.VIPS.includes(leavingUserId);
    
    // If the leaving user wasn't a VIP, no VIP list change occurred
    if (!wasLeavingUserVIP) return false;
    
    // Check if there are still other VIPs in the channel after the leave
    const remainingVIPs = userConfig.VIPS.filter(vipId => vipId !== leavingUserId);
    const hasOtherVIPs = remainingVIPs.some(vipId => oldState.channel.members.has(vipId));
    
    // If there are no other VIPs remaining, this counts as a VIP list change
    return !hasOtherVIPs;
}

// returns a list of users from the guild for whom tracking is on.
function trackingUserList(oldState, newState, userSettings) {
    // Since both oldState and newState should be from the same guild, we only need to check one
    const guildUsers = userSettings[oldState.guild.id];
    const trackingUsers = new Set();
    if (guildUsers) {
        for (const userId in guildUsers) {
            const userConfig = guildUsers[userId];
            if (userConfig.tracking === true) trackingUsers.add(userId);
        }
    }
    return trackingUsers;
}

module.exports = {
    name: Events.VoiceStateUpdate,
    async execute(oldState, newState, client) {
        const isJoin = (oldState.channel == null) && newState.channel;
        const isLeave = oldState.channel && (newState.channel == null);
        const isMove = oldState.channel !== newState.channel && oldState.channel !== null && newState.channel !== null;
        
        console.log('Voice state check:', {
            oldChannel: oldState.channel?.name || 'null',
            newChannel: newState.channel?.name || 'null',
            oldChannelId: oldState.channel?.id || 'null',
            newChannelId: newState.channel?.id || 'null',
            isJoin,
            isLeave,
            isMove
        });
        
        if (!isJoin && !isLeave && !isMove) return;

        const userSettings = loadUserSettings();
        console.log(`Voice state change detected: ${isJoin ? 'JOIN' : isLeave ? 'LEAVE' : 'MOVE'} - User: ${newState.member?.user?.username || oldState.member?.user?.username}`);
        
        // get a list of users for whom tracking is on.
        const trackingUserIds = trackingUserList(oldState, newState, userSettings);
        console.log('Tracking users count:', trackingUserIds.size);
        
        for (const currUserId of trackingUserIds) {
            console.log(`\n=== Checking user ${currUserId} ===`);
            const isOldStateSatisfied = checkStateConditions(oldState, userSettings, oldState.guild.id, currUserId);
            const isNewStateSatisfied = checkStateConditions(newState, userSettings, newState.guild.id, currUserId);
            
            // Get the user object for sending DMs
            const user = await client.users.fetch(currUserId);
            
            if (isJoin) {
                console.log("join runs.");
                if (isNewStateSatisfied && !isOldStateSatisfied) {
                    //send active!
                    // Get current VIPs in the channel
                    const userConfig = userSettings[newState.guild.id]?.[currUserId];
                    const currentVIPs = new Set();
                    
                    if (newState && newState.channel) {
                        userConfig.VIPS.forEach(vipId => {
                            if (newState.channel.members.has(vipId)) {
                                currentVIPs.add(vipId);
                            }
                        });
                    }
                    
                    // Get VIP usernames
                    const vipUsernames = [];
                    for (const vipId of currentVIPs) {
                        const member = newState.channel.members.get(vipId);
                        if (member) {
                            vipUsernames.push(member.user.username);
                        }
                    }
                    
                    // Create the message content
                    const channelId = newState.channel.id;
                    const content = `**${newState.channel.name}** has gone active with the following VIPs: ${vipUsernames.length > 0 ? vipUsernames.join(', ') : 'None'}`;
                    
                    // Send or edit the DM
                    await sendOrEditDM(user, newState.guild.id, currUserId, channelId, content);
                }
                else if (isNewStateSatisfied && isOldStateSatisfied) {
                    // Channel was already active, check if VIP list has changed
                    if (hasVIPListChanged(oldState, newState, userSettings, newState.guild.id, currUserId)) {
                        const userConfig = userSettings[newState.guild.id]?.[currUserId];
                        const newChannelVIPs = new Set();
                        
                        if (newState && newState.channel) {
                            userConfig.VIPS.forEach(vipId => {
                                if (newState.channel.members.has(vipId)) {
                                    newChannelVIPs.add(vipId);
                                }
                            });
                        }
                        
                        // Get VIP usernames for new channel
                        const newVipUsernames = [];
                        for (const vipId of newChannelVIPs) {
                            const member = newState.channel.members.get(vipId);
                            if (member) {
                                newVipUsernames.push(member.user.username);
                            }
                        }
                        
                        const newChannelId = newState.channel.id;
                        const newContent = `VIP list has changed in **${newState.channel.name}**!\n\n**Current VIPs:** ${newVipUsernames.length > 0 ? newVipUsernames.join(', ') : 'None'}`;
                        
                        await sendOrEditDM(user, newState.guild.id, currUserId, newChannelId, newContent);
                    }
                }
            }
            else if (isLeave) {
                // Get the current channel state after the user left
                const currentChannel = oldState.channel;
                
                // Check if the channel still satisfies conditions after the person left
                const channelStillSatisfied = checkStateConditions(oldState, userSettings, oldState.guild.id, currUserId, oldState.member.user.id);
                
                console.log(`Leave check - isOldStateSatisfied: ${isOldStateSatisfied}, channelStillSatisfied: ${channelStillSatisfied}`);
                console.log(`Channel members after leave: ${currentChannel.members.size}`);
                
                if (!channelStillSatisfied && isOldStateSatisfied) {
                    // Channel is no longer active after the person left
                    const channelId = oldState.channel.id;
                    const content = `**${oldState.channel.name}** is no longer active!`;
                    
                    console.log("Sending 'no longer active' DM");
                    // Send or edit the DM
                    await sendOrEditDM(user, oldState.guild.id, currUserId, channelId, content);
                }
                else if (channelStillSatisfied && isOldStateSatisfied) {
                    // Channel is still active, but VIP list might have changed
                    if (hasVIPListChangedAfterLeave(oldState, userSettings, oldState.guild.id, currUserId, oldState.member.user.id)) {
                        const userConfig = userSettings[oldState.guild.id]?.[currUserId];
                        const currentVIPs = new Set();
                        
                        if (oldState && oldState.channel) {
                            userConfig.VIPS.forEach(vipId => {
                                if (oldState.channel.members.has(vipId)) {
                                    currentVIPs.add(vipId);
                                }
                            });
                        }
                        
                        // Get VIP usernames for current channel
                        const vipUsernames = [];
                        for (const vipId of currentVIPs) {
                            const member = oldState.channel.members.get(vipId);
                            if (member) {
                                vipUsernames.push(member.user.username);
                            }
                        }
                        
                        const channelId = oldState.channel.id;
                        const content = `VIP list has changed in **${oldState.channel.name}**!\n\n**Current VIPs:** ${vipUsernames.length > 0 ? vipUsernames.join(', ') : 'None'}`;
                        
                        await sendOrEditDM(user, oldState.guild.id, currUserId, channelId, content);
                    }
                }
            }
            else if (isMove) {
                if (!isNewStateSatisfied && isOldStateSatisfied) {
                    //send dm saying no longer active!
                    const channelId = oldState.channel.id;
                    const content = `**${oldState.channel.name}** is no longer active!`;
                    
                    // Send or edit the DM
                    await sendOrEditDM(user, oldState.guild.id, currUserId, channelId, content);
                }
                else if (isNewStateSatisfied && !isOldStateSatisfied) {
                    // New channel became active
                    const userConfig = userSettings[newState.guild.id]?.[currUserId];
                    const currentVIPs = new Set();
                    
                    if (newState && newState.channel) {
                        userConfig.VIPS.forEach(vipId => {
                            if (newState.channel.members.has(vipId)) {
                                currentVIPs.add(vipId);
                            }
                        });
                    }
                    
                    // Get VIP usernames
                    const vipUsernames = [];
                    for (const vipId of currentVIPs) {
                        const member = newState.channel.members.get(vipId);
                        if (member) {
                            vipUsernames.push(member.user.username);
                        }
                    }
                    
                    // Create the message content
                    const channelId = newState.channel.id;
                    const content = `**${newState.channel.name}** has gone active with the following VIPs: ${vipUsernames.length > 0 ? vipUsernames.join(', ') : 'None'}`;
                    
                    // Send or edit the DM
                    await sendOrEditDM(user, newState.guild.id, currUserId, channelId, content);
                }
                else if (isNewStateSatisfied && isOldStateSatisfied) {
                    // User moved between two active channels
                    // Check if VIP list changed in either channel
                    
                    // Check old channel for VIP changes
                    if (hasVIPListChanged(oldState, oldState, userSettings, oldState.guild.id, currUserId)) {
                        const userConfig = userSettings[oldState.guild.id]?.[currUserId];
                        const oldChannelVIPs = new Set();
                        
                        if (oldState && oldState.channel) {
                            userConfig.VIPS.forEach(vipId => {
                                if (oldState.channel.members.has(vipId)) {
                                    oldChannelVIPs.add(vipId);
                                }
                            });
                        }
                        
                        // Get VIP usernames for old channel
                        const oldVipUsernames = [];
                        for (const vipId of oldChannelVIPs) {
                            const member = oldState.channel.members.get(vipId);
                            if (member) {
                                oldVipUsernames.push(member.user.username);
                            }
                        }
                        
                        const oldChannelId = oldState.channel.id;
                        const oldContent = `VIP list has changed in **${oldState.channel.name}**!\n\n**Current VIPs:** ${oldVipUsernames.length > 0 ? oldVipUsernames.join(', ') : 'None'}`;
                        
                        await sendOrEditDM(user, oldState.guild.id, currUserId, oldChannelId, oldContent);
                    }
                    
                    // Check new channel for VIP changes
                    if (hasVIPListChanged(oldState, newState, userSettings, newState.guild.id, currUserId)) {
                        const userConfig = userSettings[newState.guild.id]?.[currUserId];
                        const newChannelVIPs = new Set();
                        
                        if (newState && newState.channel) {
                            userConfig.VIPS.forEach(vipId => {
                                if (newState.channel.members.has(vipId)) {
                                    newChannelVIPs.add(vipId);
                                }
                            });
                        }
                        // Get VIP usernames for new channel
                        const newVipUsernames = [];
                        for (const vipId of newChannelVIPs) {
                            const member = newState.channel.members.get(vipId);
                            if (member) {
                                newVipUsernames.push(member.user.username);
                            }
                        }
                        
                        const newChannelId = newState.channel.id;
                        const newContent = `VIP list has changed in **${newState.channel.name}**!\n\n**Current VIPs:** ${newVipUsernames.length > 0 ? newVipUsernames.join(', ') : 'None'}`;
                        await sendOrEditDM(user, newState.guild.id, currUserId, newChannelId, newContent);
                    }
                }
            }
        }
    }
};

