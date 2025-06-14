const { Events } = require('discord.js');

module.exports = {
	name: Events.VoiceStateUpdate,
	once: true,
	execute(client) {
		console.log(`so and so has done this.`);
	},
};
