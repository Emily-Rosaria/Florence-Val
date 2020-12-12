const config = require('./../../config.json'); // load bot config
const catfacts = require('./../../assets/catfacts.json'); // load bot config
const Users = require("./../../database/models/users.js"); // users model
const Discord = require('discord.js'); // Image embed
const mongoose = require('mongoose');

module.exports = {
  name: 'fixchar', // The name of the command
  description: 'Adds nonexistent character fields.', // The description of the command (for help text)
  args: true, // Specified that this command doesn't need any data other than the command
  perms: 'dev',
  aliases: ['fixchars'],
  allowDM: false,
  cooldown: 5,
  usage: '<user>', // Help text to explain how to use the command (if it had any arguments)
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
    if (!userData || !userData.characters || !Array.isArray(userData.characters) || userData.characters.length == 0) {
      return message.reply("No stored user/character data could be found for `"+member.user.tag+"`. Be sure they generated their character's stats officially by using the `$randchar` command at <#"+config.channels.statRolls+">, and that they bound it to a character's name via the `$newchar <character-name>` command.");
    }

    let newData = userData;
    newData.characters = newData.characters.filter(c=>c!=null).map(c=>{
      let temp = c;
      temp.name = c.name || '';
      temp._id = c._id;
      temp.exp = c.exp || 0;
      temp.downtime = c.downtime || 0;
      temp.totalWords = c.totalWords || 0;
      temp.approved = c.approved || false;
      temp.createdAt = c.createdAt || (new Date()).getTime();
      temp.gold = c.gold || 0;
      temp.tokens = c.tokens || 0;
      temp.baseStats = c.baseStats;
      return temp;
    })

    await Users.replaceOne({_id: member.user.id},newData,{setDefaultsOnInsert: true}).exec();

    message.channel.send("Done! All character fields fixed. Be sure to check via `$log`.");
  },
};
