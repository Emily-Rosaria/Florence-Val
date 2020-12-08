/**
 * This class responds to anyone that types r!fix with a fox image.
 *
 */
const Discord = require('discord.js'); // Image embed
const fetch = require('node-fetch'); // This lets me get stuff from webhooks.

module.exports = {
    name: 'fox', // The name of the command
    description: 'Get random fox pics!', // The description of the command (for help text)
    args: false, // Specified that this command doesn't need any data other than the command
    perms: 'writer', //restricts to users with the "verifed" role noted at config.json
    allowDM: true,
    usage: '', // Help text to explain how to use the command (if it had any arguments)
    async execute(message, args) {

        // Get fox from the api.
        const { image } = await fetch('https://randomfox.ca/floof/').then(response => response.json());
        const embed = new Discord.MessageEmbed().setImage(image).setTitle('Fox').setFooter('Source: randomfox.ca').setTimestamp();
        message.reply(embed); // Replies to the user with a random fox
    },
};
