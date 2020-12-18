const config = require('./../../config.json'); // load bot config
const catfacts = require('./../../assets/catfacts.json'); // load bot config
const Users = require("./../../database/models/users.js"); // users model
const Discord = require('discord.js'); // Image embed
const mongoose = require('mongoose');

module.exports = {
  name: 'getreward', // The name of the command
  description: 'Claims the standard XP, Gold, Downtime, and Tokens for finishing a quest. Valid quest bonuses are: -medium, -hard, -deadly (for difficulty), and -groupS, -groupM, -groupL (for small/medium/large groups with 2/3/4+ members). Use -gmXX to represent a GM-given bonus (a GM will tell you if you\'re elegible). For example: -gm10, -gm25, or -gm50 represent a 10%/25%/50% bonus respectively. Group bonuses do not stack with GM bonuses (only the higher of the two should be used).', // The description of the command (for help text)
  args: 2, // Specified that this command doesn't need any data other than the command
  perms: 'writer',
  aliases: ['getrewards','collectreward','collectrewards','completequest','finishquest','claimreward','claimrewards','claimxp'],
  allowDM: false,
  cooldown: 5,
  usage: '<channel> <character-name/ID> [bonuses]', // Help text to explain how to use the command (if it had any arguments)
  async execute(message, args) {
    const arg = args[0].match(/\d+/);
    if (!arg) {
      return message.reply("Invalid channel argument. Make sure to mention the channel where you did your quest, or write down its ID.");
    }
    const channel = message.guild.channels.cache.get(arg[0]);
    if (!channel) {
      return message.reply("Could not find the quest channel argument. Be sure to mention it in your command.");
    }
    const userData = await Users.findById(message.author.id).exec();
    if (!userData || !userData.characters || !Array.isArray(userData.characters) || userData.characters.length == 0) {
      return message.reply("No stored user/character data could be found for you. Have you had your character's officially approved? If so, contact an admin if you're still getting this error.");
    }

    if (!userData.quests || userData.quests.length == 0) {
      return message.reply("You are not currently taking part in any quests. Remember, writing in the tavern doesn't count towards quest progress.");
    }

    const questData = userData.quests.find(q=>q._id == channel.id);
    if (!questData) {
      return message.reply("You're not currently participating in a quest in the channel <#"+channel.id+">.");
    }

    let group = 0;
    let gm = 0;
    let difficulty = 0;
    let bonus = 1;
    let tags = 0;

    if (args.length > 2) {
      for (const arg of [].concat(args).reverse().slice(0,2)) {
        if (arg.startsWith('-') && !arg.match(/[“"”]/)) {
          const tag = arg.toLowerCase().slice(1);
          if (tag.startsWith('gm') || tag.startsWith('dm')) {
            if (gm != 0 || group != 0) {
              return message.reply("Invalid combination of bonuses. Valid quest bonuses are: -medium, -hard, -deadly (for difficulty), and -groupS, -groupM, -groupL (for small/medium/large groups with 2/3/4+ members). Use -gmXX to represent a GM-given bonus (a GM will tell you if you\'re elegible). For example: -gm10, -gm25, and -gm50 each represent a 10%/25%/50% bonus respectively. Group bonuses do not stack with GM bonuses (only the higher of the two should be used).");
            }
            let num = tag.match(/\d+/);
            if (num) {
              num = Number(num[0])/100;
              if (num < config.bonuses.gm.min) {
                return message.reply(`Your GM bonus of ${Math.round(num*100)}% is too small. The minimum GM bonus is ${config.bonuses.gm.min*100}%. Make sure you wrote the tag properly as directed by the GM giving you the bonus (e.g. -gm25, -gm35, etc.).`);
              } else if (num > config.bonuses.gm.max) {
                return message.reply(`Your GM bonus of ${Math.round(num*100)}% is too large. The maximum GM bonus is ${config.bonuses.gm.max*100}%. Make sure you wrote the tag properly as directed by the GM giving you the bonus (e.g. -gm25, -gm35, etc.).`);
              } else {
                gm = num;
                bonus = bonus + num;
                tags = tags + 1;
              }
            } else {
              break;
            }
          } else {
            if (Object.keys(config.bonuses.difficulty).includes(tag)) {
              if (difficulty != 0) {
                return message.reply("Invalid combination of bonuses. Valid quest bonuses are: -medium, -hard, -deadly (for difficulty), and -groupS, -groupM, -groupL (for small/medium/large groups with 2/3/4+ members). Use -gmXX to represent a GM-given bonus (a GM will tell you if you\'re elegible). For example: -gm10, -gm25, and -gm50 each represent a 10%/25%/50% bonus respectively. Group bonuses do not stack with GM bonuses (only the higher of the two should be used).");
              }
              bonus = bonus + config.bonuses.difficulty[tag];
              difficulty = config.bonuses.difficulty[tag];
              tags = tags + 1;
            } else if (['groups','groupsmall','groupm','groupmedium','groupl','grouplarge'].includes(tag)) {
              if (gm != 0 || group != 0) {
                return message.reply("Invalid combination of bonuses. Valid quest bonuses are: -medium, -hard, -deadly (for difficulty), and -groupS, -groupM, -groupL (for small/medium/large groups with 2/3/4+ members). Use -gmXX to represent a GM-given bonus (a GM will tell you if you\'re elegible). For example: -gm10, -gm25, and -gm50 each represent a 10%/25%/50% bonus respectively. Group bonuses do not stack with GM bonuses (only the higher of the two should be used).");
              }
              if (['groups','groupsmall'].includes(tag)) {
                bonus = bonus + config.bonuses.group.groupSmall;
                group = config.bonuses.group.groupSmall;
              } else if (['groupm','groupmedium'].includes(tag)) {
                bonus = bonus + config.bonuses.group.groupMedium;
                group = config.bonuses.group.groupMedium;
              } else if (['groupl','grouplarge'].includes(tag)) {
                bonus = bonus + config.bonuses.group.groupLarge;
                group = config.bonuses.group.groupLarge;
              }
              tags = tags + 1;
            } else {
              break;
            }
          }
        } else {
          break;
        }
      }
    }

    if (tags == 2 && args.length == 3) {
      return message.reply('Did not recieve a valid character name. If your character name isn\'t being read by the bot properly, try including "quotation marks" around it.')
    }

    let name = tags > 0 ? args.slice(1,-tags) : args.slice(1);
    name = name.join(' ').replace(/[“"”]/,'');
    let id = mongoose.isValidObjectId(name) ? mongoose.Types.ObjectId(name) : name;
    let percent = false;
    const char = userData.characters.find(c=>c._id==id||c.name==name||c.id==name);
    if (!char) {
      return message.reply(`No character with the name or ID ${name} could be found in this user's character list. User \`$chars\` to view some brief data about your characters. If you added arguments to represent bonuses, make sure they were valid (e.g. -hard -groupM), and remember that you can't have multiple bonuses of the same type, or benefit from both a group bonus and a GM bonus. If your character name isn't being read by the bot properly, try including "quotation marks" around it.`);
    }
    name = char.name;
    id = char._id;
    const oldXP = char.exp || 0;
    const oldGold = char.gold || 0;
    const oldTokens = char.tokens || 0;
    const oldDowntime = char.downtime || 0;

    if (!char.approved) {
      return message.reply(`The character ${name} with id ${id} is not yet approved. Please make sure to submit them for approval first before trying to write quests with them of earn xp with them.`);
    }

    const level = char.level;
    const nextL = level < 20 ? config.cumulativeExp[level] - config.cumulativeExp[level-1] : config.cumulativeExp.slice(-1)[0] - config.cumulativeExp.slice(-2)[0];
    const xpMult = nextL/(config.questsNeeded[level-1]*config.questSize);
    const xpGain = (Math.round(xpMult*bonus*questData.charCount + Number.EPSILON) * 100) / 100;
    const questDays = Math.max(((new Date()).getTime() - questData.startTime) / 24*60*60*1000, 1);
    const goldGain = (Math.round((1+difficulty)*Math.min(questDays,questData.charCount/config.daySize)*config.questGold[level-1] + Number.EPSILON) * 100) / 100;
    let downtime = 1.2*questData.charCount > config.daySize ? Math.max(Math.min(questDays,0.5*questData.charCount/config.daySize),1) : questData.charCount/config.daySize;
    downtime = Math.floor(10*(downtime + Number.EPSILON))/10;
    const newDowntime = Math.min(config.maxDowntime,downtime+oldDowntime);
    let tokens = Math.floor(Math.max(1+gm,1+group)*Math.min(questDays,0.5*questData.charCount/config.daySize));
    tokens = tokens < 1 ? Math.floor(questData.charCount/config.daySize) : tokens;
    const embed = new Discord.MessageEmbed()
    .setAuthor(message.author.username, message.author.displayAvatarURL())
    .setTitle(`Quest Completed by ${name}!`)
    .setColor('#ffb347')
    .setDescription(`<@${message.author.id}>'s character ${name} (ID: ${id}) just completed a quest and earned some rewards!`)
    .addField("Experience",`Old XP: **\`${oldXP}\`**\nNew XP: **\`${oldXP+xpGain}\`**`,true)
    .addField("Gold",`Old Gold: **\`${oldGold}\`**\nNew Gold: **\`${oldGold+goldGain}\`**`,true)
    .addField("Tokens",`Old Tokens: **\`${oldTokens}\`**\nNew Tokens: **\`${oldTokens+tokens}\`**`,true)
    .addField("Downtime Points",`They have **\`${newDowntime}\`** / **\`${config.maxDowntime}\`** Downtime Points to spend.`,false)
    .setFooter(`${message.author.tag} - ${message.author.id}`, message.author.displayAvatarURL())
    .setTimestamp()
    message.channel.send({embed: embed});

    //const modlog = message.guild.channels.cache.get(config.channels.modlog);

    //modlog.send({embed: embed});
  },
};
