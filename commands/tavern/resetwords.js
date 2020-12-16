const config = require('./../../config.json'); // load bot config
const Users = require("./../../database/models/users.js"); // users model
const Discord = require('discord.js'); // Image embed

module.exports = {
  name: 'clearquests', // The name of the command
  aliases: ['resetquests'],
  description: 'Clears a user\'s stored word/character counts for their quests. Does not reset overall word/char counts.', // The description of the command (for help text)
  args: true, // Specified that this command doesn't need any data other than the command
  perms: "mod",
  allowDM: false,
  cooldown: 3,
  usage: '<user>', // Help text to explain how to use the command (if it had any arguments)
  async execute(message, args) {
    let user = false;
    if (args && args.length > 0) {
      const uID = args[0].match(/\d+/);
      const tempU = message.client.users.cache.get(uID[0]);
      if (tempU) {
        user = tempU;
      }
    }
    if (user == false || !user) {
      return message.reply("Invalid user argument.");
    }

    const userData = await Users.findByIdAndUpdate(user.id,{
      "$set": {
        totalWords: 0,
        totalChars: 0
      }
    },{new: false}).exec();
    if (!userData) {
      return message.reply("The user `"+user.tag+"` had no data stored by the bot.");
    } else {
      return message.reply("The user `"+user.tag+" previously had the following word/character counts before they were reset to 0.\n> Words: "+userData.totalWords+"\n> Characters: "+userData.totalChars);
    }
  },
};
