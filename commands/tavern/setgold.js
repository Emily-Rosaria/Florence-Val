const config = require('./../../config.json'); // load bot config
const catfacts = require('./../../assets/catfacts.json'); // load bot config
const Users = require("./../../database/models/users.js"); // users model
const Discord = require('discord.js'); // Image embed
const mongoose = require('mongoose');

module.exports = {
  name: 'setgold', // The name of the command
  description: 'Sets a character\'s total gold. Typically used for adjusting starting gold.', // The description of the command (for help text)
  args: 3, // Specified that this command doesn't need any data other than the command
  perms: 'admin',
  allowDM: false,
  cooldown: 5,
  usage: '<user> <character-name/ID> <gold>', // Help text to explain how to use the command (if it had any arguments)
  async execute(message, args) {
    const arg = args[0].match(/\d+/);
    if (!arg) {
      return message.reply("Invalid user argument. Make sure to ping the user you wish to modify, or note down their userID.");
    }
    const member = message.guild.member(arg[0]);
    if (!member) {
      return message.reply("Could not find user's data in cache. Are you sure they're still in the server? If you used their ID, try pinging them instead.");
    }
    const userData = await Users.findById(member.user.id).exec();
    if (!userData || !userData.characters || !Array.isArray(userData.characters) || userData.characters.length == 0) {
      return message.reply("No stored user/character data could be found for `"+member.user.tag+"`. Be sure they generated their character's stats officially by using the `$randchar` command at <#"+config.channels.statRolls+">, and that they bound it to a character's name via the `$newchar <character-name>` command.");
    }

    let name = args.slice(1,-1).join(' ').replace(/[“"”]/,'')
    let id = mongoose.isValidObjectId(name) ? mongoose.Types.ObjectId(name) : name;
    const char = userData.characters.find(c=>c.name.toLowerCase() == name.toLowerCase()||c._id == id||c._id == name);
    if (!char) {
      return message.reply(`No character with the name or ID "${name}" could be found in this user's character list. User \`$chars\` to view some brief data about their characters.`);
    }
    name = char.name;
    id = char._id;
    const oldGold = char.gold || 0;
    const newGold = !isNaN(args.slice(-1)[0]) ? Number(args.slice(-1)[0]) : -1;

    if (newGold < 0) {
      return message.reply(`${args.slice(-1)[0]} is an invalid gold value. Remember, it must be the non-negative number of gold pieces they have. Electrum/Silver/Copper pieces should be written as decimals. You don't need to write the "gp" at the end of the value.`);
    }

    if (!char.approved) {
      return message.reply(`The character ${name} with id ${id} is not yet approved. Please make sure to approve them before adjusting their gold as appropriate.`);
    }

    await Users.updateOne({_id: member.user.id, "characters._id": char._id},{
      "$set": {
          "characters.$.gold": newGold
        } // gold pieces the character has
    }).exec();

    const embed = new Discord.MessageEmbed()
    .setAuthor(member.user.username, member.user.displayAvatarURL())
    .setTitle(`Gold Change: Set by Game Master!`)
    .setColor('#f1c40f')
    .setDescription(`<@${member.user.id}>'s character ${name} (ID: ${id}) had their gold set by a Game Master.\nOld Gold: **\`${oldGold}\`**\nNew Gold: **\`${newGold}\`**`)
    .setFooter(`${message.author.tag} - ${message.author.id}`, message.author.displayAvatarURL())
    .setTimestamp()
    message.channel.send({embed: embed});

    const modlog = message.guild.channels.cache.get(config.channels.modlog);

    modlog.send({embed: embed});
  },
};
