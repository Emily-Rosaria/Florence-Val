const config = require('./../../config.json'); // load bot config
const Users = require("./../../database/models/users.js"); // users model
const Discord = require('discord.js'); // Image embed

const getRolls = (min,max) => {
  let total = 0;
  let totals = [];
  let stats = [];
  const reps = 50;
  let i = 0;
  let best = 0;
  while ((best < 16 || total < min || total > max) && i < reps) {
    stats = [...new Array(6)].map(s=>[...new Array(4)].map(r=>Math.ceil(6 - 6*Math.random())));
    totals = stats.map(s=>s.sort((a,b)=>a-b).slice(1).reduce((a,b)=>a+b,0));
    best = totals.reduce((acc,cur)=>{
      if (acc > cur) {
        return acc;
      } else {
        return cur;
      }
    });
    total = totals.reduce((acc,cur)=>acc+cur,0);
    i = i+1;
  }
  if (total < min || total > max) {
    return false;
  } else {
    return stats;
  }
}

module.exports = {
  name: 'randchar', // The name of the command
  aliases: ['statgen','rollstats'],
  description: `Randomly generates character stats within the range of [${config.statMin},${config.statMax}].`, // The description of the command (for help text)
  args: false, // Specified that this command doesn't need any data other than the command
  perms: false,
  allowDM: true,
  usage: '', // Help text to explain how to use the command (if it had any arguments)
  async execute(message, args) {
    if (message.channel.id != config.channels.statRolls) {
      const rolls = getRolls(config.statMin,config.statMax);
      if (!rolls) {return message.reply("Failed to generate valid rolls after 50 tries... Which is a less than 1 in 10e22 chance. Wew.")}
      const formattedRolls = rolls.map(r=>{
        const temp = r.sort((a,b)=>b-a);
        const out = {};
        out.roll1 = temp[0];
        out.roll2 = temp[1];
        out.roll3 = temp[2];
        out.roll4 = temp[3];
        return out;
      });
      let total = 0;
      const statText = formattedRolls.map((r,i)=>{
        const rTotal = r.roll1 + r.roll2 + r.roll3;
        total = total + rTotal;
        return `Stat ${i+1}: \`${rTotal}\` (${r.roll1}, ${r.roll2}, ${r.roll3}, ~~${r.roll4}~~)`;
      });
      const embed = new Discord.MessageEmbed()
      .setAuthor(message.author.username, message.author.displayAvatarURL())
      .setTitle('Unofficial Stat Rolls')
      .setDescription(`<@${message.author.id}>'s Stat Rolls:\n`+statText.join('\n')+`\nTotal = \`${total}\``)
      .setColor('#0078d7')
      .setFooter(`${message.author.tag} - ${message.author.id}`, message.author.displayAvatarURL())
      .setTimestamp()
      message.reply(embed);
      return;
    } else {
      const userData = await Users.findById(message.author.id).exec();
      if (userData && userData.lastStats && userData.lastStats.rolls) {
        message.reply(`You already have stats saved by the bot, please use them before rolling again. Message a mod for assistance. You can view these with the \`$laststats\` command, or by going to this message: https://discord.com/channels/${message.guild.id}/${config.channels.statRolls}/${userData.lastStats.messageID}`).then(msg => msg.delete({ timeout: 2*60*1000 }));
      } else {
        const rolls = getRolls(config.statMin,config.statMax);
        if (!rolls) {return message.reply("Failed to generate valid rolls after 50 tries. Which is a less than a 1 in 10e22 chance. Wew.")}
        const formattedRolls = rolls.map(r=>{
          const temp = r.sort((a,b)=>b-a);
          const out = {};
          out.roll1 = temp[0];
          out.roll2 = temp[1];
          out.roll3 = temp[2];
          out.roll4 = temp[3];
          return out;
        });
        let total = 0;
        const statText = formattedRolls.map((r,i)=>{
          const rTotal = r.roll1 + r.roll2 + r.roll3;
          total = total + rTotal;
          return `Stat ${i+1}: \`${rTotal}\` (${r.roll1}, ${r.roll2}, ${r.roll3}, ~~${r.roll4}~~)`;
        });
        const embed = new Discord.MessageEmbed()
        .setAuthor(message.author.username, message.author.displayAvatarURL())
        .setTitle('Official Stat Rolls')
        .setDescription(`<@${message.author.id}>'s New Stat Rolls:\n`+statText.join('\n')+`\nTotal = \`${total}\``)
        .setColor('#0078d7')
        .setFooter(`${message.author.tag} - ${message.author.id}`, message.author.displayAvatarURL())
        .setTimestamp()
        const msg = await message.channel.send({content: `<@${message.author.id}>`, embed: embed});

        await Users.updateOne({_id : message.author.id},{
          "$set": {
            lastStats: {
              rolls: formattedRolls,
              timestamp: msg.createdAt.getTime(),
              messageID: msg.id
            }
          }
        },{upsert:true, setDefaultsOnInsert: true}).exec();
        const modlog = message.guild.channels.cache.get(config.channels.modlog);

        embed.setTimestamp(new Date(msg.createdAt.getTime())).setDescription(`<@${message.author.id}>'s [New Stat Rolls](https://discord.com/channels/${message.guild.id}/${message.channel.id}/${msg.id}):\n`+statText.join('\n')+`\nTotal = \`${total}\``);

        modlog.send(embed);
      }
      message.delete();
    }
  },
};
