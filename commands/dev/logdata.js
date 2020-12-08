const config = require('./../../config.json'); // load bot config
const Users = require("./../../database/models/users.js"); // users model
const Discord = require('discord.js'); // Image embed

module.exports = {
  name: 'logdata', // The name of the command
  aliases: ['log','datadump','data'],
  description: 'Lists the characters of a user.', // The description of the command (for help text)
  args: false, // Specified that this command doesn't need any data other than the command
  perms: 'dev',
  allowDM: true,
  cooldown: 1,
  usage: '<data-type> <data-id>', // Help text to explain how to use the command (if it had any arguments)
  async execute(message, args) {
    const userData = await Users.findById(message.author.id).exec();
    console.log(userData);
  },
};
