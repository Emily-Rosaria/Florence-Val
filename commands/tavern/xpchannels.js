const config = require('./../../config.json'); // load bot config
const Discord = require('discord.js'); // Image embed

module.exports = {
  name: 'xpchannels', // The name of the command
  aliases: ['questchannels'],
  description: 'Lists all the channels elegible for xp.', // The description of the command (for help text)
  args: false, // Specified that this command doesn't need any data other than the command
  perms: 'mod',
  allowDM: false,
  usage: '', // Help text to explain how to use the command (if it had any arguments)
  async execute(message, args) {
    const questChannels = config.channels.quests;
    const tavernChannels = config.channels.tavern;
    message.channel.send(["Quest Channels:"].concat(questChannels.map(q=>`> <#${q}>`)),{ split: true });
    message.channel.send(["Tavern Channels:"].concat(tavernChannels.map(t=>`> <#${t}>`)),{ split: true });
  },
};
