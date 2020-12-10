const config = require('./../../config.json'); // load bot config
const Users = require("./../../database/models/users.js"); // users model
const Discord = require('discord.js'); // Image embed
const mongoose = require('mongoose');

module.exports = {
  name: 'deletechar', // The name of the command
  description: 'Deletes a user\'s character. Only mods can delete characters.', // The description of the command (for help text)
  aliases: ['removechar','retirechar'],
  args: 2, // Specified that this command doesn't need any data other than the command
  perms: 'admin',
  allowDM: false,
  cooldown: 5,
  usage: '<user> <character-name OR character-key>', // Help text to explain how to use the command (if it had any arguments)
  async execute(message, args) {
    const arg = args[0].match(/\d+/);
    if (!arg) {
      return message.reply("Invalid user argument. Make sure to ping the user you wish to approve, or note down their userID.");
    }
    const user = message.client.users.cache.get(arg[0]);
    if (!user) {
      return message.reply("Could not find user's data in cache. Are you sure they're still in the server? If you used their ID, try pinging them instead.");
    }

    const userData = await Users.findById(user.id).exec();
    if (!userData || !userData.characters || !Array.isArray(userData.characters) || userData.characters.length == 0) {
      return message.reply("No stored user/character data could be found for `"+user.tag+"`. Be sure they generated their character's stats officially by using the `$randchar` command at <#"+config.channels.statRolls+">, and that they bound it to a character's name via the `$newchar <character-name>` command.");
    }
    const name = args.slice(1).join(' ').replace(/[“"”]/,'');
    const nameID = mongoose.isValidObjectId(name) ? mongoose.Types.ObjectId(name) : false;

    if (!nameID) {
      await Users.findOneAndUpdate({_id: user.id},{
        "$pull": {
          "characters": {
            "name": {"$eq": name}
          }
        }
      }).exec()
    } else {
      await Users.findOneAndUpdate({_id: user.id},{
        "$pull": {
          "characters": {
            "$or": [
              {"_id": {"$eq": nameID}},
              {"name": {"$eq": name}}
            ]
          }
        }
      }).exec();
    };
    const deleted = userData.characters.find(c=>c.name==name||c._id==nameID);
    if (deleted) {
      let total = 0;
      const stats = rolls.length > 0 ? rolls.map((r,i)=>{
        const rTotal = r.roll1 + r.roll2 + r.roll3;
        total = total + rTotal;
        return `Stat ${i+1}: \`${rTotal}\` (${r.roll1}, ${r.roll2}, ${r.roll3}, ~~${r.roll4}~~)`;
      }).join('\n') : '';
      const modlog = message.guild.channels.cache.get(config.channels.modlog);
      const modEmbed = new Discord.MessageEmbed()
      .setAuthor(user.username, user.displayAvatarURL())
      .setTitle(`Character Deleted: ${deleted.name || "Invalid Name"}!`)
      .setDescription(`<@${user.id}>'s character named "${deleted.name || "Invalid Name"}" was deleted by <@${message.author.id}>. They had the following stat array:\n${stats}\nTotal = \`${total}\``)
      .setColor('#0078d7')
      .setFooter(`${message.author.tag} - ${message.author.id}`, message.author.displayAvatarURL())
      .setTimestamp()
      if (deleted.totalWords || deleted.totalChars) {
        modEmbed
        .addField("Experience Points",`They had ${deleted.exp} xp and were level ${deleted.level}.`,true)
        .addField("Word Count",`They had ${deleted.totalWords} written for them.`,true)
        .addField("Character Count",`They had ${deleted.totalChars} written for them.`,true)
      }
      modlog.send({embed: modEmbed});
      return message.reply(`Done! Their stat rolls are deleted. Check <#${config.channels.modlog}> for more info.`);
    } else {
      return message.reply("No character with the name or ID of `"+name+"` could be found.");
    }
  },
};
