const config = require('./../../config.json'); // load bot config
const Users = require("./../../database/models/users.js"); // users model
const Discord = require('discord.js'); // Image embed
const mongoose = require('mongoose');

module.exports = {
  name: 'rename', // The name of the command
  aliases: ['renamechar','setname','newname'],
  description: 'Renames a stored character.', // The description of the command (for help text)
  args: 2, // Specified that this command doesn't need any data other than the command
  perms: false,
  cooldown: 5,
  allowDM: false,
  usage: '<old-name or ID> <new-name>', // Help text to explain how to use the command (if it had any arguments)
  async execute(message, args) {
    let names = args.slice(0,2).map(a=>a.replace(/[“"”]/,''));
    if (args.length > 2) {
      const tempNames = args.join(' ').split(/[“"”]/g).map(m=>m.trim()).filter(m=>m!='');
      if (tempNames && tempNames.length > 1) {
        names = tempNames.slice(0,2);
      }
    }

    const userData = await Users.findById(message.author.id).exec();
    if (!userData || !userData.characters || !Array.isArray(userData.characters) || userData.characters.length == 0) {
      return message.reply("No stored character data could be found. Be sure to generate your character's stats officially by using the `$randchar` command at <#"+config.channels.statRolls+">, then bind it to a character's name via the `$newchar <character-name>` command.").then(msg=>{
        if (msg.channel.id == config.channels.statRolls) {
          message.delete();
          msg.delete({timeout: 45*1000});
        }
      });
    }

    if (names[1].length > 40) {
      return message.reply("Your new character name is too long. Try to keep it below 40 characters.").then(msg=>{
        if (msg.channel.id == config.channels.statRolls) {
          message.delete();
          msg.delete({timeout: 30*1000});
        }
      });
    }
    names[0] = mongoose.isValidObjectId(names[0]) ? mongoose.Types.ObjectId(names[0]) : names[0];
    const char = userData.characters.find(c=>c.name == names[0]||c._id == names[0]);
    if (!char) {
      return message.reply(`No character with the name or ID "${names[0]}" could be found in your character list. Be sure to surround any multi-word names with "quotation marks" and remember names are case sensitive.`).then(msg=>{
        if (msg.channel.id == config.channels.statRolls) {
          message.delete();
          msg.delete({timeout: 30*1000});
        }
      });
    }
    names[0] = char.name;
    const id = char._id;

    await Users.findOneAndUpdate({_id:message.author.id, "characters._id": id},{
      "$set": {
        "characters.$.name": names[1]
      }
    },{new: true}).exec();

    const modlog = message.guild.channels.cache.get(config.channels.modlog);

    const embed = new Discord.MessageEmbed()
    .setAuthor(message.author.username, message.author.displayAvatarURL())
    .setTitle(`Character Rename: ${names[0]} to ${names[1]}!`)
    .setDescription(`<@${message.author.id}> renamed their character to "${names[1]}" from "${names[0]}".`)
    .setColor('#0078d7')
    .setFooter(`${message.author.tag} - ${message.author.id}`, message.author.displayAvatarURL())
    .setTimestamp()
    modlog.send({embed: embed});
    message.channel.send({content: `<@${message.author.id}>`,embed: embed}).then(msg=>{
      if (msg.channel.id == config.channels.statRolls) {
        message.delete();
        msg.delete({timeout: 2*60*1000});
      }
    });
    message.delete();
  },
};
