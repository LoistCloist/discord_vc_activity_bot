// NOTE: THIS WILL DEPLOY SLASH COMMANDS TO EVERY CHANENL IN botChannels.JSON
const { REST, Routes } = require('discord.js');
const { clientId, token } = require('./config.json');
const fs = require('fs');
const path = require('path');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath)
                        .filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    if (`data` in command && 'execute' in command) {
        commands.push(command.data.toJSON());
    }
}

const botChannels = require('./data/botChannels.json');
const guildIds = Object.keys(botChannels);

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
    try {
        guildId = "1172226209824911420";
        //for (const guildId of guildIds) {
            console.log(`Registering commands for guild: ${guildId}`);
            await rest.put(
                Routes.applicationGuildCommands(clientId, guildId),
                {body: commands}
            );
            console.log(`Successfully registered commands for guild: ${guildId}`);
            console.log('Finished registering commands for all guilds in botChannels.json.');
        //}
    } catch (error) {
        console.error(error);
    }
})();