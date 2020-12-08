const config = require('./../../config.json'); // load bot config
const Users = require("./../../database/models/users.js"); // users model

module.exports = {
  name: 'deleteuser', // The name of the command
  aliases: ['removeuser','resetuser'],
  description: "Deletes all stored data for a user.", // The description of the command (for help text)
  args: true,
  perms: "dev",
  allowDM: false,
  usage: '<user>',
  async execute(message, args) {
    const userArg = args[0].match(/\d+/);
    if (!userArg) {
      return message.reply("Invalid user argument. Please include either a user ID or a mention string.");
    }
    const userID = userArg[0];
    const userData = await Users.findByIdAndDelete(userID);
    if (userData) {
      console.log(userData);
      console.log("User was deleted.");
      return message.reply("The mentioned user's data has been reset!");
    } else {
      return message.reply("No data was found for the mentioned user.");
    }
  },
};
