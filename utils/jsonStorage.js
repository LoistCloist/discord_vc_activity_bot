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

// Notification cooldown system to prevent spam
const notificationCooldownPath = path.join(__dirname, '../data/notificationCooldowns.json');

function loadNotificationCooldowns() {
    if (fs.existsSync(notificationCooldownPath) === false) return {};
    return JSON.parse(fs.readFileSync(notificationCooldownPath));
}

function saveNotificationCooldowns(data) {
    fs.writeFileSync(notificationCooldownPath, JSON.stringify(data, null, 2));
}

// Check if enough time has passed since last notification
function canSendNotification(guildId, userId, channelId, cooldownMinutes = 5) {
    const cooldowns = loadNotificationCooldowns();
    const key = `${guildId}-${userId}-${channelId}`;
    const lastNotification = cooldowns[key];
    
    if (!lastNotification) return true;
    
    const now = Date.now();
    const cooldownMs = cooldownMinutes * 60 * 1000;
    return (now - lastNotification) >= cooldownMs;
}

// Mark that a notification was sent
function markNotificationSent(guildId, userId, channelId) {
    const cooldowns = loadNotificationCooldowns();
    const key = `${guildId}-${userId}-${channelId}`;
    cooldowns[key] = Date.now();
    saveNotificationCooldowns(cooldowns);
}

// DM Message tracking system
const dmMessagesPath = path.join(__dirname, '../data/dmMessages.json');

function loadDMMessages() {
    if (fs.existsSync(dmMessagesPath) === false) return {};
    return JSON.parse(fs.readFileSync(dmMessagesPath));
}

function saveDMMessages(data) {
    fs.writeFileSync(dmMessagesPath, JSON.stringify(data, null, 2));
}

// Store a DM message ID for a user
function storeDMMessage(guildId, userId, channelId, messageId) {
    const dmMessages = loadDMMessages();
    const key = `${guildId}-${userId}-${channelId}`;
    dmMessages[key] = messageId;
    saveDMMessages(dmMessages);
}

// Get a stored DM message ID
function getDMMessage(guildId, userId, channelId) {
    const dmMessages = loadDMMessages();
    const key = `${guildId}-${userId}-${channelId}`;
    return dmMessages[key];
}

// Remove a stored DM message ID
function removeDMMessage(guildId, userId, channelId) {
    const dmMessages = loadDMMessages();
    const key = `${guildId}-${userId}-${channelId}`;
    delete dmMessages[key];
    saveDMMessages(dmMessages);
}

module.exports = {
    loadBotChannels,
    saveBotChannels,
    loadUserSettings,
    saveUserSettings,
    loadNotificationCooldowns,
    saveNotificationCooldowns,
    canSendNotification,
    markNotificationSent,
    loadDMMessages,
    saveDMMessages,
    storeDMMessage,
    getDMMessage,
    removeDMMessage
}