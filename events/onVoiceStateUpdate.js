const { Events } = require('discord.js');
const path = require('path');
const { loadUserSettings } = require(path.join(__dirname, '../utils/jsonStorage.js'));
const { sendOrEditDM, clearDMMessage } = require(path.join(__dirname, '../utils/helperMethods.js'));

function checkStateConditions(voiceState, userSettings, guildId, userId) { // checks if VIP, member_count, and channels are satisfied.
    if (!voiceState || !voiceState.channel) return false;
    const userConfig = userSettings[guildId]?.[userId];
    if (!userConfig || !userConfig.tracking) return false;
    
    const channelsSatisfied = userConfig.channels.includes('ANY') || userConfig.channels.includes(voiceState.channel.id);
    if (!channelsSatisfied) return false;
    
    const memberCount = voiceState.channel.members.size;
    const triggerSatisfied = memberCount >= parseInt(userConfig.trigger);
    if (!triggerSatisfied) return false;

    const vipSatisfied = userConfig.VIPS.includes('ANY') || userConfig.VIPS.some(vipId => voiceState.channel.members.has(vipId));
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

module.exports = {
    name: Events.VoiceStateUpdate,
    async execute(oldState, newState, client) {
        const userSettings = loadUserSettings();
        let isOldStateSatisfied = false; let isNewStateSatisfied = false;
        const isJoin = (oldState.channel == null) && newState.channel;
        const isLeave = oldState.channel && (newState.channel == null);
        const isMove = oldState.channel !== newState.channel && oldState.channel !== null && newState.channel !== null;
        if (!isJoin && !isLeave && !isMove) return;
        console.log(`Voice state change detected: ${isJoin ? 'JOIN' : isLeave ? 'LEAVE' : 'MOVE'} - User: ${newState.member?.user?.username || oldState.member?.user?.username}`);
        isOldStateSatisfied = checkStateConditions(oldState, userSettings, oldState.guild.id, oldState.member.user.id);
        isNewStateSatisfied = checkStateConditions(newState, userSettings, newState.guild.id, newState.member.user.id);
        if (isJoin) {
            //check if oldState is satisfied.
            //check if newState is satisfied.
            if (isNewStateSatisfied && !isOldStateSatisfied) {
                //send active!
                // Get current VIPs in the channel
                const userConfig = userSettings[newState.guild.id]?.[newState.member.user.id];
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
                await sendOrEditDM(
                    newState.member.user,
                    newState.guild.id,
                    channelId,
                    content,
                    client
                );
            }
            else if (isNewStateSatisfied && isOldStateSatisfied) {
                //check if VIP list has changed.
                //if List has changed, then edit the vip list
                if (hasVIPListChanged(oldState, newState, userSettings, newState.guild.id, newState.member.user.id)) {
                    const userConfig = userSettings[newState.guild.id]?.[newState.member.user.id];
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
                    
                    await sendOrEditDM(
                        newState.member.user,
                        newState.guild.id,
                        newChannelId,
                        newContent,
                        client
                    );
                }
            }
        }
        else if (isLeave) {
            if (!isNewStateSatisfied && isOldStateSatisfied) {
                //send dm saying no longer active!
                const channelId = oldState.channel.id;
                const content = `**${oldState.channel.name}** is no longer active!`;
                
                // Send or edit the DM
                await sendOrEditDM(
                    oldState.member.user,
                    oldState.guild.id,
                    channelId,
                    content,
                    client
                );
            }
            else if (isNewStateSatisfied && isOldStateSatisfied) {
                if (hasVIPListChanged(oldState, newState, userSettings, newState.guild.id, newState.member.user.id)) {
                    const userConfig = userSettings[newState.guild.id]?.[newState.member.user.id];
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
                    
                    await sendOrEditDM(
                        newState.member.user,
                        newState.guild.id,
                        newChannelId,
                        newContent,
                        client
                    );
                }
            }
        }
        else if (isMove) {
            if (!isNewStateSatisfied && isOldStateSatisfied) {
                //send dm saying no longer active!
                const channelId = oldState.channel.id;
                const content = `**${oldState.channel.name}** is no longer active!`;
                
                // Send or edit the DM
                await sendOrEditDM(
                    oldState.member.user,
                    oldState.guild.id,
                    channelId,
                    content,
                    client
                );
            }
            else if (isNewStateSatisfied && !isOldStateSatisfied) {
                // New channel became active
                const userConfig = userSettings[newState.guild.id]?.[newState.member.user.id];
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
                await sendOrEditDM(
                    newState.member.user,
                    newState.guild.id,
                    channelId,
                    content,
                    client
                );
            }
            else if (isNewStateSatisfied && isOldStateSatisfied) {
                // User moved between two active channels
                // Check if VIP list changed in either channel
                
                // Check old channel for VIP changes
                if (hasVIPListChanged(oldState, oldState, userSettings, oldState.guild.id, oldState.member.user.id)) {
                    const userConfig = userSettings[oldState.guild.id]?.[oldState.member.user.id];
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
                    
                    await sendOrEditDM(
                        oldState.member.user,
                        oldState.guild.id,
                        oldChannelId,
                        oldContent,
                        client
                    );
                }
                
                // Check new channel for VIP changes
                if (hasVIPListChanged(oldState, newState, userSettings, newState.guild.id, newState.member.user.id)) {
                    const userConfig = userSettings[newState.guild.id]?.[newState.member.user.id];
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
                    
                    await sendOrEditDM(
                        newState.member.user,
                        newState.guild.id,
                        newChannelId,
                        newContent,
                        client
                    );
                }
            }
            else {
                // Both channels stay inactive - no action needed
            }
        }
    }
};

