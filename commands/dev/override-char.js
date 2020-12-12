const config = require('./../../config.json'); // load bot config
const catfacts = require('./../../assets/catfacts.json'); // load bot config
const Users = require("./../../database/models/users.js"); // users model
const Discord = require('discord.js'); // Image embed
const mongoose = require('mongoose');

module.exports = {
  name: 'overridechar', // The name of the command
  description: 'Override\'s a user\'s character data.', // The description of the command (for help text)
  args: true, // Specified that this command doesn't need any data other than the command
  perms: 'dev',
  allowDM: false,
  cooldown: 5,
  usage: '<user> <json>', // Help text to explain how to use the command (if it had any arguments)
  async execute(message, args) {
    const arg = args[0].match(/\d+/);
    if (!arg) {
      return message.reply("Invalid user argument. Make sure to ping the user you wish to modify, or note down their userID.");
    }
    const member = message.guild.member(arg[0]);
    if (!member) {
      return message.reply("Could not find user's data in cache. Are you sure they're still in the server? If you used their ID, try pinging them instead.");
    }
    const userData = await Users.findById(member.user.id).exec();
    if (!userData) {
      return message.reply("No stored user data could be found for `"+member.user.tag+"`.");
    }

    let json = JSON.parse(args.slice(1).join(' '));
    json._id = mongoose.Types.ObjectId(json._id);
    console.log(json);
    if (!userData.characters || !Array.isArray(userData.characters) || userData.characters.length == 0 || userData.characters == [null]) {
      await Users.updateOne({_id: member.user.id},{
        "$set": {
          characters: [json]
        }
      }).exec()
    } else if (userData.characters.some(c=>c||c._id==json._id||c._id==(json._id).toString())) {
      let newData = userData;
      newData.characters = newData.characters.map(c=>{
        if (c._id==json._id||c._id==(json._id).toString()) {
          return json;
        } else {
          return c;
        }
      },{setDefaultsOnInsert: true})
      await Users.replaceOne({_id: member.user.id},{
        newData
      },{setDefaultsOnInsert: true}).exec()
    } else {
      await Users.updateOne({_id: member.user.id},{
        "$push": {
          characters: json
        }
      },{setDefaultsOnInsert: true}).exec()
    }

    message.channel.send("Done! All character fields fixed. Be sure to check via `$log`.");
  },
};
