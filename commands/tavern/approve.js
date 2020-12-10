const config = require('./../../config.json'); // load bot config
const catfacts = require('./../../assets/catfacts.json'); // load bot config
const Users = require("./../../database/models/users.js"); // users model
const Discord = require('discord.js'); // Image embed

module.exports = {
  name: 'approve', // The name of the command
  description: 'Approves a user to allow them to start roleplaying. Grants them the writer role if they don\'t have it, and activates their pending character.', // The description of the command (for help text)
  args: true, // Specified that this command doesn't need any data other than the command
  perms: 'mod',
  allowDM: false,
  cooldown: 5,
  usage: '<user-to-approve>', // Help text to explain how to use the command (if it had any arguments)
  async execute(message, args) {
    const arg = args[0].match(/\d+/);
    if (!arg) {
      return message.reply("Invalid user argument. Make sure to ping the user you wish to approve, or note down their userID.");
    }
    const member = message.guild.member(arg[0]);
    if (!member) {
      return message.reply("Could not find user's data in cache. Are you sure they're still in the server? If you used their ID, try pinging them instead.");
    }
    const userData = await Users.findById(member.user.id).exec();
    if (!userData || !userData.characters || !Array.isArray(userData.characters) || userData.characters.length == 0) {
      return message.reply("No stored user/character data could be found for `"+member.user.tag+"`. Be sure they generated their character's stats officially by using the `$randchar` command at <#"+config.channels.statRolls+">, and that they bound it to a character's name via the `$newchar <character-name>` command.");
    }

    const pending = userData.characters.find(c=>!c.approved);
    if (!pending) {
      return message.reply("No pending characters could be found under `"+member.user.tag+"` to approve. Be sure they generated their character's stats officially by using the `$randchar` command at <#"+config.channels.statRolls+">, and that they bound it to a character's name via the `$newchar <character-name>` command.");
    }

    Users.updateOne({_id: member.user.id, "characters._id": pending._id},{
      "$set": {
        "characters.$.approved": true,
        "characters.$.exp": config.cumulativeExp[config.startingLevel-1],
        "characters.$.gold": 0, // gold pieces they character has
        "characters.$.tokens": 0 // tokens for spending on loot rolls
      }
    }).exec();

    if (!member.roles.cache.has(config.perms.writer)) {
      member.roles.add(config.perms.writer);
    }
    if (member.roles.cache.has(config.perms.characterless)) {
      member.roles.remove(config.perms.characterless);
    }
    if (userData.characters.length > 1 && !member.roles.cache.has(config.ranks[0].id)) {
      member.roles.add(config.ranks[0].id);
    }

    const fact = catfacts[Math.floor(Math.random()*catfacts.length)];

    const embed = new Discord.MessageEmbed()
    .setAuthor(member.user.username, member.user.displayAvatarURL())
    .setTitle(`Character Approved: ${pending.name}!`)
    .setDescription("You've been approved! There's just a little more you need to do, then you can start playing! Just follow the guidelines below and ask us if you have any questions.")
    .addField("Nickname","Change your nickname to your character's name so we know who you write/roleplay.")
    .addField("Character Sheets","Post your approved character sheet at <#785667411562332180> so other members can find it more easily.")
    .addField("Roleplaying","And now, you can head over to the roleplay channels to start roleplaying! Remember, all new characters are only level 3, and they're new to the tavern realm. Head to <#785647908833853440> if you have any questions, ")
    .addField("Catfact",fact)
    .setColor('#87ceeb')
    .setFooter(`${message.author.tag} - ${message.author.id}`, message.author.displayAvatarURL())
    .setTimestamp()
    message.channel.send({content: `<@${member.user.id}>`, embed: embed});

    const modlog = message.guild.channels.cache.get(config.channels.modlog);

    const modEmbed = new Discord.MessageEmbed()
    .setAuthor(member.user.username, member.user.displayAvatarURL())
    .setTitle(`Character Approved: ${pending.name}!`)
    .setDescription(`<@${member.user.id}>'s character named "${pending.name}" was approved by <@${message.author.id}>. [Click Here](https://discord.com/channels/${message.guild.id}/${message.channel.id}/${message.id}) to jump to the channel.`)
    .addField('Configure Gold',"Use the `$setgold "+member.user.id+" "+pending._id+" <gold>` to set their character's remaining starting gold.")
    .setColor('#0078d7')
    .setFooter(`${message.author.tag} - ${message.author.id}`, message.author.displayAvatarURL())
    .setTimestamp()
    modlog.send({embed: modEmbed});
  },
};
