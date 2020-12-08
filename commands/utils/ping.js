
module.exports = {
  name: 'ping', // The name of the command
  aliases: ['ping!'],
  description: 'Test if the bot is listening and able to reply.', // The description of the command (for help text)
  args: false, // Specified that this command doesn't need any data other than the command
  perms: false, //restricts to users with the "verifed" role noted at config.json
  allowDM: true,
  usage: '', // Help text to explain how to use the command (if it had any arguments)
  execute(message, args) {
    message.reply("Pong!"); // Replies to the user with a random phrase
  },
};
