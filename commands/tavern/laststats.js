const config = require('./../../config.json'); // load bot config
const Users = require("./../../database/models/users.js"); // users model
const Discord = require('discord.js'); // Image embed

module.exports = {
  name: 'randchar', // The name of the command
  aliases: ['statgen','rollstats'],
  description: 'Test if the bot is listening and able to reply.', // The description of the command (for help text)
  args: false, // Specified that this command doesn't need any data other than the command
  perms: false,
  allowDM: true,
  usage: '', // Help text to explain how to use the command (if it had any arguments)
  async execute(message, args) {
    const user = !!args[0] ? message.client.users.cache.get(args[0].match(/\d+/)[0]) || message.author : message.author;
    const userData = await Users.findById(user.id).exec();
    if (userData && userData.lastStats && userData.lastStats.rolls) {
      let total = 0;
      const statText = userData.lastStats.rolls.map((r,i)=>{
        total = total + r.total;
        return `Stat ${i+1}: \`${r.total}\` (${r.roll1}, ${r.roll2}, ${r.roll3}, ~~${r.roll4}~~)`;
      });
      const embed = new Discord.MessageEmbed()
      .setAuthor(user.username,user.displayAvatarURL())
      .setTitle(`${user.username}'s last stat roll.'`)
      .setURL(`https://discord.com/channels/${message.guild.id}/${config.channels.statRolls}/${userData.lastStats.messageID}`)
      .setDescription(`<@${user.id}>'s rolls:\n`+statText.join('\n')+`\nTotal = \`${total}\``)
      .setColor('#0078d7')
      .setFooter(`Requested by ${message.author.tag}`, message.author.displayAvatarURL())
      .setTimestamp(userData.lastStats.timestamp)
      message.reply(embed); // Replies to the user with a random image
    } else {
      message.reply(`No unused character stats found for ${user.tag}.`);
    }
  },
};
