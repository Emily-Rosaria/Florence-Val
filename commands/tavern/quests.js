const config = require('./../../config.json'); // load bot config
const Users = require("./../../database/models/users.js"); // users model
const Discord = require('discord.js'); // Image embed

module.exports = {
  name: 'quests', // The name of the command
  aliases: ['progress','words','totalwords'],
  description: 'Lists the quests of a user along with their writing/roleplay stats.', // The description of the command (for help text)
  args: false, // Specified that this command doesn't need any data other than the command
  perms: false,
  allowDM: false,
  cooldown: 3,
  usage: '[user]', // Help text to explain how to use the command (if it had any arguments)
  async execute(message, args) {
    let user = message.author;
    if (args && args.length > 0) {
      const uID = args[0].match(/\d+/);
      const tempU = message.client.users.cache.get(uID[0]);
      if (tempU) {
        user = tempU;
      }
    }

    const userData = await Users.findById(user.id).exec();
    if (!userData) {
      return message.reply("The user `"+user.tag+"` has no data stored by the bot.");
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
    const isQuest = userData.quests && userData.quests.length > 0 ? "Below is some information about their current quest progress." : "They are not currently participating in any quests.";
    const array = Object.entries(questData);
    const embed = new Discord.MessageEmbed()
    .setAuthor(user.username, user.displayAvatarURL())
    .setTitle(`Quest Progress of ${user.username}!`)
    .setDescription(`<@${user.id}> has written a total of about ${userData.totalWords || '0'} words and ${userData.totalChars || '0'} characters across all their quests - completed or otherwise. ${isQuest}`)
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
