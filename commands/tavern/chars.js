const config = require('./../../config.json'); // load bot config
const Users = require("./../../database/models/users.js"); // users model
const Discord = require('discord.js'); // Image embed

module.exports = {
  name: 'chars', // The name of the command
  aliases: ['getchars','listchars','characters'],
  description: 'Lists the characters of a user.', // The description of the command (for help text)
  args: false, // Specified that this command doesn't need any data other than the command
  perms: false,
  allowDM: true,
  cooldown: 3,
  usage: '<user>', // Help text to explain how to use the command (if it had any arguments)
  async execute(message, args) {
    let user = message.author;
    if (args && args.length > 0) {
      const uID = args.match(/\d+/);
      const tempU = message.client.users.cache.get(uID[0]);
      if (tempU) {
        user = tempU;
      }
    }

    const userData = await Users.findById(user.id).exec();
    if (!userData || !userData.characters || !Array.isArray(userData) || userData.characters.length == 0) {
      return message.reply("The user `"+user.tag+"` has no characters registered. Have they rolled their stats and used the `$newchar <character-name>` command?");
    }

    const array = userData.characters.map(c=>{
      const temp = c.approved ? "This character is approved." : "This character is not approved.";
      return [c.name,temp+`\nThis character's id is \`${c._id}\`.`];
    });

    const embed = new Discord.MessageEmbed()
    .setAuthor(user.username, user.author.displayAvatarURL())
    .setTitle(`Characters of ${user.username}!`)
    .setDescription(`<@${user.id}>'s list of characters.`)
    .setColor('#0078d7')
    .setFooter(`${message.author.tag} - ${message.author.id}`, message.author.displayAvatarURL())
    .setTimestamp(now.getTime())
    for (const arr of array) {
      embed.addField(arr[0] || '\u200b',arr[1],true);
    }
    message.channel.send({embed: embed});
  },
};
