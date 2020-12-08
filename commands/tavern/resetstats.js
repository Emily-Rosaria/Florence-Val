const config = require('./../../config.json'); // load bot config
const Users = require("./../../database/models/users.js"); // users model
const Discord = require('discord.js'); // Image embed

module.exports = {
  name: 'resetstats', // The name of the command
  aliases: ['statreset'],
  description: "Resets the stats rolled by a user", // The description of the command (for help text)
  args: true,
  perms: "mod",
  allowDM: false,
  usage: '<user>',
  async execute(message, args) {
    const userArg = args[0].match(/\d+/);
    if (!userArg) {
      return message.reply("Invalid user argument. Please include either a user ID or a mention string.");
    }
    const userID = userArg[0];
    const userData = await Users.findByIdAndUpdate(userID,{
      "$unset": {
        field: "lastStats"
      }
    },{new: false});
    if (userData && userData.lastStats && userData.lastStats.rolls) {
      const modlog = message.guild.channels.cache.get(config.channels.modlog);
      let user = message.client.users.cache.get(userID);
      if (!user) {
        user = {
          username: "Unknown User",
          displayAvatarURL() {
            return message.author.defaultAvatarURL;
          },
          id: userID
        }
      }
      let total = 0;
      const statText = userData.lastStats.rolls.map((r,i)=>{
        const rTotal = r.roll1 + r.roll2 + r.roll3;
        total = total + rTotal;
        return `Stat ${i+1}: \`${rTotal}\` (${r.roll1}, ${r.roll2}, ${r.roll3}, ~~${r.roll4}~~)`;
      });
      const embed = new Discord.MessageEmbed()
      .setAuthor(user.username, user.displayAvatarURL())
      .setTitle('Stat Roll Deletion')
      .setURL(`https://discord.com/channels/${message.guild.id}/${config.channels.statRolls}/${userData.lastStats.messageID}`)
      .setDescription(`<@${message.author.id}> has deleted the stored stat roll of <@${user.id}>:\n`+statText.join('\n')+`\nTotal = \`${total}\``)
      .setColor('#0078d7')
      .setFooter(`${message.author.tag} - ${message.author.id}`, message.author.displayAvatarURL())
      .setTimestamp()
      modlog.send(embed);
    } else {
      return message.reply("The mentioned user doesn't have any saved and unused rolls.");
    }
  },
};
