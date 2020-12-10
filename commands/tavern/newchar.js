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
    const userData = await Users.findById(message.author.id).exec();
    if (!userData || !userData.lastStats || !userData.lastStats.rolls) {
      return message.reply("No stored character roll data could be found. Be sure to generate your character's stats officially by using the `$randchar` command at <#"+config.channels.statRolls+">").then(msg=>{
        if (msg.channel.id == config.channels.statRolls) {
          message.delete();
          msg.delete({timeout: 30*1000});
        }
      });
    }

    if (userData.characters && Array.isArray(userData.characters) && userData.characters.length > 0) {
      const pending = userData.characters.find(c=>!c.approved);
      if (pending) {
        return message.reply("You already have a character with assigned stats pending approval. Please either rename that with the `$rename <old-name> <new-name>` command or make sure your character app for `"+pending.name+"` is submitted at <#"+config.channels.submission+">.").then(msg=>{
          if (msg.channel.id == config.channels.statRolls) {
            message.delete({timeout: 60*1000});
            msg.delete({timeout: 60*1000});
          }
        });
      }
      const slots = await Users.updateCache(message.member);
      if (slots <= userData.characters.length) {
        return message.reply(`You already have ${userData.characters.length} out of ${slots} character slots filled. Try to play a bit more and rank up to earn more character slots. If you wish to drop one of your characters, contact a mod. If you believe you should have more slots, contact an admin.`).then(msg=>{
          if (msg.channel.id == config.channels.statRolls) {
            message.delete({timeout: 60*1000});
            msg.delete({timeout: 60*1000});
          }
        });
      }
      if (userData.characters.find(c=>c.name==charName)) {
        return message.reply(`You already have a character named ${charName} saved. If you wish to drop them and start over (or otherwise replace them), contact a mod. Otherwise, you should try a different name.`).then(msg=>{
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

    const now = new Date()
    const rolls = userData.lastStats.rolls;
    const newChar = {
      name: charName, // the character's name
      baseStats: rolls,
      exp: config.cumulativeExp[config.startingLevel-1], // total exp the character has
      gold: 0, // gold pieces they character has
      tokens: 0, // tokens for spending on loot rolls
      downtime: 0, // number of downtime units stored
      totalWords: 0, // total words written for this character
      totalChars: 0, // character count - as in total letters written for this character
      approved: false, // whether or not the character is approved yet
      createdAt: now.getTime()
    }
    if (!userData.characters || !Array.isArray(userData.characters)) {
      await Users.updateOne({_id: message.author.id},{
        "$set": {
          characters: [newChar]
        },
        "$unset": {
          lastStats: ""
        }
      }).exec();
    } else {
      await Users.updateOne({_id: message.author.id},{
        "$push": {
          characters: newChar
        },
        "$unset": {
          lastStats: ""
        }
      }).exec();
    }

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
    .setDescription(`<@${message.author.id}>'s Created a new character named "${charName}" using these [Official Stat Rolls](https://discord.com/channels/${message.guild.id}/${config.channels.statRolls}/${userData.lastStats.messageID}):\n`+statText.join('\n')+`\nTotal = \`${total}\``)
    .setColor('#0078d7')
    .setFooter(`${message.author.tag} - ${message.author.id}`, message.author.displayAvatarURL())
    .setTimestamp(now.getTime())
    modlog.send({embed: embed});
    if (message.channel.id == config.channels.statRolls) {
      message.delete();
      message.channel.send({content: `<@${message.author.id}>`,embed: embed});
    } else {
      message.channel.send({embed: embed});
    }
  },
};
