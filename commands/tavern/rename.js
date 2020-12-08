const config = require('./../../config.json'); // load bot config
const Users = require("./../../database/models/users.js"); // users model
const Discord = require('discord.js'); // Image embed

module.exports = {
  name: 'newchar', // The name of the command
  aliases: ['createchar'],
  description: 'Creates character data with your stored stat data.', // The description of the command (for help text)
  args: 2, // Specified that this command doesn't need any data other than the command
  perms: false,
  cooldown: 5,
  allowDM: false,
  usage: '', // Help text to explain how to use the command (if it had any arguments)
  async execute(message, args) {
    let names = args.slice(0,2).map(a=>a.replace(/[“"”]/,''));
    if (args.length > 2) {
      const tempNames = args.join(' ').split(/[“"”]/g).filter(m=>m!='').map(m=>m.trim());
      if (tempNames && tempName.length > 1) {
        names = tempNames.slice(0,2);
      }
    }

    const userData = Users.findById(message.author.id);
    if (!userData || !userData.characters || typeof userData.characters != "array" || userData.characters.length == 0) {
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

    const id = userData.character.find(c=>c.name == names[0]);
    if (!id) {
      return message.reply(`No character with the name "${names[0]}" could be found in your character list. Be sure to surround any multi-word names with "quotation marks."`).then(msg=>{
        if (msg.channel.id == config.channels.statRolls) {
          message.delete();
          msg.delete({timeout: 30*1000});
        }
      });
    }

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
