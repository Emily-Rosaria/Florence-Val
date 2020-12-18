const Reddit = require('reddit'); // Redditz
const Discord = require('discord.js'); // Image embed
const config = require('./../../config.json'); // load bot config

module.exports = {
  name: 'copypasta', // The name of the command
  description: 'Get a copypasta from r/copypasta', // The description of the command (for help text)
  aliases: ['shitpost'],
  perms: 'writer',
  cooldown: 20,
  allowDM: true,
  usage: '[day/week/month/year/all] [post-count, max=5] [nsfw/sfw]', // Help text to explain how to use the command (if it had any arguments)
  async execute(message, args) {
    const timeframe = [args.join(' ').match(/(day|week|month|year|all)/g) || 'week'][0];
    const numMatch = Number([args.join(' ').match(/\d+/) || 1][0]);
    let postCount = Math.min(numMatch,5);
    if (message.author.id == config.dev) {postCount = Math.min(numMatch,100)};
    const nsfw = (message.channel.type == 'text') ? (args.includes('nsfw') && [config.dev,config.luc].includes(message.author.id)) : ((message.channel.type == 'dm') && args.includes('nsfw'));
    const rating = nsfw ? 'NSFW posts are enabled.' : 'All posts should be (relatively) SFW as far as copypastas go.';
    const plural = (postCount==1) ? 'post' : 'posts';
    message.reply('Fetching '+postCount.toString()+' '+plural+' from r/copypasta/top?t='+timeframe+'. '+rating);
    const reddit = new Reddit({
      username: process.env.REDDIT_USERNAME,
      password: process.env.REDDIT_PASSWORD,
      appId: process.env.REDDIT_APPID,
      appSecret: process.env.REDDIT_SECRET,
      userAgent: 'My Bot (https://Rosaria-AI.emilyrosaria.repl.co)'
    })
    await reddit.get('/r/copypasta/top', { t: timeframe, show: 'all', limit: 100 })
      .then(function (posts) {
        const postsFetched = posts.data.children.length;
        const firstPostNum = Math.floor(Math.random() * postsFetched);
        var copypasta = [];
        var postOffset = 0;
        for (var postOffset = 0; (postOffset < postsFetched && copypasta.length < postCount); postOffset++) {
          var newCopypasta = posts.data.children[(firstPostNum + postOffset) % postsFetched].data;
          if (!!newCopypasta.selftext  && (!copypasta['over_18'] || nsfw) && !copypasta['is_meta']) { copypasta = copypasta.concat(newCopypasta) }
        }
        if (copypasta.length == 0) { message.reply('Unable to fetch copypasta(s).'); return; };
        var timeOffset = 1500;
        for (var i = 0; i < copypasta.length; i++) {
          var msg = [];
          var index = 0;
          const fullPasta = copypasta[i].selftext.replace(/&gt;/g,'> ');
          while (index < (fullPasta.length - 1)) {
            const nextIndex = (index + 2000 < fullPasta.length) ? index + 2000 : fullPasta.length;
            const chunk = fullPasta.slice(index, nextIndex);
            const newText = (chunk.length < 2000) ? [chunk] : chunk.match(/(.|\n){1,2000}\n/) || chunk.match(/(.|\n){1,2000}\./) || chunk.match(/(.|\n){1,2000} /) || [chunk];
            msg = msg.concat([newText[0].trim()]);
            index = index + newText[0].length;
          }
          for (var j = 0; j < msg.length; j++) {
            setTimeout(function (j, i, copypasta, msg) {
              const copypastaEmbed = new Discord.MessageEmbed().setDescription(msg[j]);
              if (msg.length != 1) { copypastaEmbed.setFooter('Part ' + (j + 1).toString() + ' of ' + msg.length.toString()) }
              if (j == 0) { copypastaEmbed.setTitle(copypasta[i].title).setURL(copypasta[i].url) };
              if (j == msg.length - 1) { copypastaEmbed.setTimestamp(new Date(copypasta[i].created * 1000)) };
              message.channel.send(copypastaEmbed);
            }, timeOffset + j * 1500, j, i, copypasta, msg);
          }
          timeOffset = timeOffset + 1500 * msg.length;
        }
      })
      .catch((error) => { message.reply('Something broke, unable to fetch copypasta(s).'); console.error(error); })
  },
};
