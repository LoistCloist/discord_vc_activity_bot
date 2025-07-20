//get and set bot channels
//get and set user settings for each guild
const fs = require('fs'); //imports the file system module for javascript.
const path = require('path'); //loads in the path module that allows access to useful methods.
const { json } = require('stream/consumers');
const botChannelsPath = path.join(__dirname, '../data/botChannels.json'); //loads in an OS-agnostic filepath.

function loadBotChannels() {
    if (fs.existsSync(botChannelsPath) === false) return {};
    return JSON.parse(fs.readFileSync(botChannelsPath)); // parses a buffer/string into a js object.
}

function saveBotChannels(botChannels) {
    fs.writeFileSync(botChannelsPath, JSON.stringify(botChannels, null, 2));
    // null - no special replacer logic, 2 spaces for indentation, data-object to convert to string.
}

const userSettingsPath = path.join(__dirname, '../data/userSettings.json');

function loadUserSettings() {
    if (fs.existsSync(userSettingsPath) === false) return {};
    return JSON.parse(fs.readFileSync(userSettingsPath));
}

function saveUserSettings(data) {
    fs.writeFileSync(userSettingsPath, JSON.stringify(data, null, 2));
}

const activeChannelsPath = path.join(__dirname, '../data/activeChannels.json');

function loadActiveChannels() {
    if (fs.existsSync(activeChannelsPath) === false) return {};
    return JSON.parse(fs.readFileSync(activeChannelsPath));
}
function saveActiveChannels(data) {
    fs.writeFileSync(activeChannelsPath, JSON.stringify(data, null, 2));
}
module.exports = {
    loadBotChannels,
    saveBotChannels,
    loadUserSettings,
    saveUserSettings,
    loadActiveChannels,
    saveActiveChannels
}