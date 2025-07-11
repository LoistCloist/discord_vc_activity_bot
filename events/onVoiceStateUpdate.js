const { Events } = require('discord.js');
const path = require('path');
const { loadUserSettings } = require(path.join(__dirname, '../utils/jsonStorage.js'));

module.exports = {
    name: Events.VoiceStateUpdate,
    async execute(oldState, newState, client) {
        //check if any of the channels being monitored have more than trigger count.
        //check if any of the channels being monitored have the people being
        //monitored.
        //if a dm has already been sent 
        const userSettings = loadUserSettings();
        const guildSettings = userSettings[client.guild.id];
        if (!guildSettings) return;
        let triggerSatisfied = false;
        let channelsSatisfied = false;
        let VIPsSatisfied = false;
        if ()
        if (triggerSatisfied && channelsSatisfied && VIPsSatisfied) 
    }
};

