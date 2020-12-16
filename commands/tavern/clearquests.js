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

    const userData = await Users.findById(user.id).exec();
    if (!userData) {
      return message.reply("The user `"+user.tag+"` has no data stored by the bot.");
    }

    if (!userData.quests || userData.quests.length == 0) {
      return message.reply("The user `"+user.tag+"` has no quest progress stored by the bot.");
    } else {
      await Users.updateOne({_id: user.id},{
        "$set":{
          quests: []
        }
      }).exec();
    }

    const questData = {};
    if (userData.quests) {
      userData.quests.forEach(q=>{
        const parent = (message.guild.channels.cache.get(q._id) || {parent: {name: "Unknown"}}).parent.name;
        if (questData[parent]) {
          questData[parent].push(`<#${q._id}>:\n> Words: ${q.wordCount}\n> Characters: ${q.charCount}`);
        } else {
          questData[parent] = [`<#${q._id}>:\n> Words: ${q.wordCount}\n> Characters: ${q.charCount}`];
        }
      });
    }
    const array = Object.entries(questData);
    const embed = new Discord.MessageEmbed()
    .setAuthor(user.username, user.displayAvatarURL())
    .setTitle(`Quest Progress of ${user.username}!`)
    .setDescription(`<@${user.id}> has written a total of about ${userData.totalWords || '0'} words and ${userData.totalChars || '0'} characters across all their quests - completed or otherwise. Below is some information about their prior quest progress, which has now been cleared.`)
    .setColor('#ffb347')
    .setFooter(`${message.author.tag} - ${message.author.id}`, message.author.displayAvatarURL())
    .setTimestamp()
    for (const arr of array) {
      if (arr && arr[0] && arr[1]) {
        embed.addField(arr[0] || '\u200b',arr[1].join('\n\n'),true);
      }
    }
    message.channel.send({embed: embed});
  },
};
