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
      const url_base = "https://random.dog/";
      const extensions = [".jpg",".gif",".jpeg",".png"];
      const doggos = await fetch('https://random.dog/doggos').then(response => response.json()).catch((err)=>["",""]);
      let index = Math.floor(Math.random() * doggos.length);
      var url = doggos[index];
      let breaking = 0;
      while (!extensions.some(ext => url.toLowerCase().endsWith(ext))) {
        index = (index + 1) % doggos.length;
        url = doggos[index];
        breaking = breaking + 1;
        if (breaking > 10) {
          url = "";
          break;
        }
      }
      if (!url || url == "") {
        message.reply("Sorry, I'm having trouble accessing the API of woofers at the moment. Try again in a bit.");
      }
      url = url_base + url;
      const embed = new Discord.MessageEmbed().setImage(url).setTitle('Woof').setFooter('Source: random.dog').setTimestamp();
      message.reply(embed); // Replies to the user with a random dog
    },
};
