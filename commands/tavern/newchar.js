const config = require('./../../config.json'); // load bot config
const Users = require("./../../database/models/users.js"); // users model
const Discord = require('discord.js'); // Image embed

module.exports = {
  name: 'newchar', // The name of the command
  aliases: ['createchar'],
  description: 'Creates character data with your stored stat data.', // The description of the command (for help text)
  args: true, // Specified that this command doesn't need any data other than the command
  perms: false,
  allowDM: false,
  cooldown: 10,
  usage: '', // Help text to explain how to use the command (if it had any arguments)
  async execute(message, args) {
    const charName = args.join(' ').replace(/[“"”]/,'');
    const userData = Users.findById(message.author.id);
    if (!userData || !userData.lastStats || !userData.lastStats.rolls) {
      return message.reply("No stored character roll data could be found. Be sure to generate your character's stats officially by using the `$randchar` command at <#"+config.channels.statRolls+">").then(msg=>{
        if (msg.channel.id == config.channels.statRolls) {
          message.delete();
          msg.delete({timeout: 30*1000});
        }
      });
    }

    if (userData.characters) {
      const pending = userData.characters.find(c=>!c.approved);
      if (pending) {
        return message.reply("You already have a character with assigned stats pending approval. Please either rename that with the `$rename <old-name> <new-name>` command or make sure your character app for `"+pending.name+"` is submitted at <#"+config.channels.submission+">.").then(msg=>{
          if (msg.channel.id == config.channels.statRolls) {
            message.delete({timeout: 60*1000});
            msg.delete({timeout: 60*1000});
          }
        });
      }
    }
    if (charName.length > 40) {
      return message.reply("Your character's name is too long. Try to keep it below 40 characters.").then(msg=>{
        if (msg.channel.id == config.channels.statRolls) {
          message.delete();
          msg.delete({timeout: 30*1000});
        }
      });
    }

    const rolls = userData.lastStats.rolls;
    const newChar = {
      name: charName, // the character's name
      baseStats: rolls,
      exp: config.cumulativeExp[config.startingLevel], // total exp the character has
      downtime: 0, // number of downtime units stored
      totalWords: 0, // total words written for this character
      totalChars: 0, // character count - as in total letters written for this character
      approved: false, // whether or not the character is approved yet
      createdAt: (new Date()).getTime()
    }
    if (!userData.characters || typeof userData.characters != "array") {
      await Users.updateOne({_id:message.author.id},{
        "$set": {
          characters: []
        }
      }).exec();
    }
    const newData = await Users.updateOne({_id:message.author.id},{
      "$push": {
        characters: newChar
      }
    }).exec();

    const modlog = message.guild.channels.cache.get(config.channels.modlog);

    let total = 0;
    const statText = rolls.map((r,i)=>{
      const rTotal = r.roll1 + r.roll2 + r.roll3;
      total = total + rTotal;
      return `Stat ${i+1}: \`${rTotal}\` (${r.roll1}, ${r.roll2}, ${r.roll3}, ~~${r.roll4}~~)`;
    });

    const embed = new Discord.MessageEmbed()
    .setAuthor(message.author.username, message.author.displayAvatarURL())
    .setTitle(`Character Created: ${charName}!`)
    .setDescription(`<@${message.author.id}>'s Created a new character using these [Official Stat Rolls](https://discord.com/channels/${message.guild.id}/${message.channel.id}/${msg.id}):\n`+statText.join('\n')+`\nTotal = \`${total}\``)
    .setColor('#0078d7')
    .setFooter(`${message.author.tag} - ${message.author.id}`, message.author.displayAvatarURL())
    .setTimestamp()
    modlog.send({embed: embed});
    message.channel.send({content: `<@${message.author.id}>`,embed: embed});
    message.delete();
  },
};
