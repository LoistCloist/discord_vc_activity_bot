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
    if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
    }
}

const rest = new REST({version: '10'}).setToken(token);

(async () => {
    try {
        console.log('Started refreshing application (/) commands globally.');
        await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands }
        )
        console.log('Successfully reloaded application (/) commands globally.');
    } catch (error) {
        console.error(error);
    }
})