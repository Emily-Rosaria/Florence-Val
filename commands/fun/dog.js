/**
 * This class responds to anyone that types r!dog with a dog image.
 *
 */
const Discord = require('discord.js'); // Image embed
const fetch = require('node-fetch'); // This lets me get stuff from api.

module.exports = {
    name: 'dog', // The name of the command
    description: 'Get random dog pics!', // The description of the command (for help text)
    args: false, // Specified that this command doesn't need any data other than the command
    perms: 'writer', //restricts to users with the "verifed" role noted at config.json
    allowDM: true,
    usage: '', // Help text to explain how to use the command (if it had any arguments)
    async execute(message, args) {

      // Get dog from the api.
      const fetched = await fetch('https://dog.ceo/api/breeds/image/random').then(response => response.json());
      var url = false;
      if (fetched.status && fetched.status == "success") {
        url = fetched.message;
      }
      if (url) {
        const embed = new Discord.MessageEmbed().setImage(url).setTitle('Woof').setFooter('Source: dog.ceo/api').setTimestamp();
        message.reply(embed); // Replies to the user with a random dog
      } else {
        message.reply("I'm having trouble fetching images from the `dog.ceo` API right now. Try again in a moment.");
      }
    },
};
