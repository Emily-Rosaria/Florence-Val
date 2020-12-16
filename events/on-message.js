const config = require('./../config.json'); // load bot config
const Discord = require('discord.js'); // Loads the discord API library

module.exports = {
  name: "onMessage",
  async event(message) {

    // don't do anything for messages with no content or partial messages
    if (!message.content || (message.partial && !message.channel && !message.author && !message.client)) {
      return;
    }

    const client = message.client;

    const botPing = ["<@" + message.client.user.id + ">","<@!" + message.client.user.id + ">"];

    // Find if message begins with a valid command prefix
    const prefix = config.prefix.concat(botPing).filter(p => message.content.toLowerCase().startsWith(p));

    // If no prefixes, check if message is in a roleplay channel or not
    if (prefix.length == 0) {
      if (config.channels.quests.includes(message.channel.id)) {
        client.events.get("onQuest").event(message);
      } else if (config.channels.tavern.includes(message.channel.id)) {
        client.events.get("onTavern").event(message);
      } else if (message.channel.type == "dm" && (message.content.toLowerCase() == "ping" || message.content.toLowerCase() == "ping!")) {
        message.reply("pong!");
      }
      return;
    }

    // Split commands and arguments from message so they can be passed to functions
    const args = message.content.slice(prefix[0].length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase().replace(/[-_]+/,''); // the dashes and underscores are optional, as is capitalisation

    // check if the message is a valid command
    const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

    const roleCache = message.channel.type != "dm" && message.member && message.member.roles ? message.member.roles.cache || [] : []; // get role cache

    if (!command) {
      if (config.channels.clean.includes(message.channel.id) && !roleCache.includes(config.perms.admin)
      && ![config.perms.dev,config.perms.luc].includes(message.author.id)) {
        message.delete({timeout: 2*60*1000});
      }
      return;
    }

    if (command.args && (!args.length || command.args > args.length)) {
      let reply = 'That command requires more details!';

      // If we have details on how to use the args, provide them
      if (command.usage) {
          reply += `\nThe proper usage would be: \`${prefix}${command.name} ${command.usage}\``;
      }

      // Send a reply from the bot about any error encountered
      return message.channel.send(reply);
    }
    const cooldowns = message.client.cooldowns;

    if(!cooldowns.has(command.name)) {
      cooldowns.set(command.name, new Discord.Collection());
    }

    const now = Date.now();
    const timestamps = cooldowns.get(command.name);
    const cooldownAmount = (command.cooldown || 3 ) * 1000;

    if(!timestamps.has(message.author.id)) {
      timestamps.set(message.author.id, now);
      setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
    } else {
      const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

      if(now < expirationTime) {
        const timeLeft = (expirationTime - now) / 1000;
        return message.reply(`Whoa! You're sending commands too fast! Please wait ${timeLeft.toFixed(1)} more second(s) before running \`${command.name}\` again!`);
      }
      timestamps.set(message.author.id, now);
      setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
    }

    if(command.perms) {
      if (message.channel.type == "dm") {
        if (!command.allowDM) {
          return message.reply("This command is not available for use in DMs.");
        } else if (command.allowDM && (command.perms == "dev" && !config.perms.dev)) {
          return message.reply("This command is only available for devs.");
        }
      } else if (message.author.id != config.perms.dev) {

        if (command.perms == "dev") {
          return message.reply("This command is only available for bot devs.");
        }
        // check perms for admin commands
        if (!roleCache.has(config.perms.admin) || !message.member.hasPermission("ADMINISTRATOR")) {
          if (command.perms == "admin") {
            return message.reply("You do not have the required permissions to use this command; this command is only for admins.");
          } else if (!roleCache.has(config.perms.mod)) {
            if (command.perms == "mod") {
              return message.reply("You do not have the required permissions to use this command; this command is only for moderators.");
            } else if (command.perms == "writer" && !roleCache.has(config.perms.writer)) {
              return message.reply("You do not have the required permissions to use this command; this command is only for approved roleplayers.");
            }
          }
        }
      }
    };

    try {
      await command.execute(message, args);
    } catch(error) {
      console.error(error);
      message.reply('Sorry! I ran into an error trying to do that!').then(m=>{
        m.delete({timeout:60*1000});
      });
      const devUser = client.users.cache.get(config.perms.dev);
      const msg = (message.content.length > 200) ? message.content.slice(0,200) + ' [...]' : message.content;
      const errmsg = (error.stack.toString().length > 1500) ? error.stack.toString().slice(0,1500) + '...' : error.stack;
      const errLocation = message.channel.type == "dm" ? 'in `Direct Messages`' : 'from `'+message.channel.name+'`';
      devUser.send('Error running command: `'+msg+'`\nSender: `'+message.author.username+'#'+message.author.discriminator+'` '+errLocation+'\nError Report:\n```'+errmsg+'```');
    }
  },
};
