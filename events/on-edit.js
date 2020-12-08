const config = require('./../config.json'); // load bot config
const mongoose = require("mongoose"); //database library
const Users = require("./../database/models/users.js"); // users model
const Messages = require("./../database/models/messages.js"); // messages model

module.exports = async function (oldMessage, newMessage) {

  if (newMessage.partial) {
    console.log("Partial message edit recieved.");
    return;
  }

  let quest = false;

  if (config.channels.quests.includes(newMessage.channel.id)) {
    quest = true;
  } else if (!config.channels.tavern.includes(newMessage.channel.id)) {
    return; // don't do anything for edits in non-rp channels
  }

  const botPing = ["<@" + newMessage.client.user.id + ">","<@!" + newMessage.client.user.id + ">"];

  // Find if message now begins with a valid command prefix
  const prefix = config.prefix.concat(botPing).some(p => newMessage.content.toLowerCase().startsWith(p));

  // If prefixes, return (bot doesn't care about command messages)
  if (prefix) {
    return;
  }

  const userData = await Users.findById(newMessage.author.id).exec();

  if (!userData) {
    return;
  }

  if (quest && userData.quests && userData.quests.length > 0) {
     const questData = userData.quests.find(q=>q._id == newMessage.channel.id);
     if (!questData || newMessage.createdAt.getTime() < questData.startTime) {
       return; // don't make changes for old message edits (or edits for posts not corresponding to a current quest)
     }
  }

  const splitMSG = newMessage.content.split('```'); // split around ``` to find content between pairs of them
  let cleanMSG = splitMSG[0].trim();
  if (splitMSG.length > 2) {
    for (var i = 1; 2*i>splitMSG.length; i++) {
      cleanMSG = cleanMSG + "\n" + splitMSG[2*i].trim();
    }
  }
  if (splitMSG.length % 2 == 0) { // even number of ``` groups means odd number of items after splits
    cleanMSG = cleanMSG + "\n" + splitMSG.slice(-1)[0]; // add last item as that won't be put in code
  }
  cleanMSG = cleanMSG.replace(/[*_~|`]+/,''); // remove formatting characters
  cleanMSG = cleanMSG.replace(/ {2,}/,' ').replace(/\n{2,}/,'\n'); // remove excessive line breaks and double spaces
  cleanMSG = cleanMSG.replace(/\p{M}+/,''); // remove zalgo text ("mark characters")
  const words = cleanMSG.split(/\s+/).length;
  const chars = cleanMSG.length;

  const oldMessageData = await Messages.findByIdAndUpdate(message.id,{
    "$set": {
      author: newMessage.author.id,
      channel: newMessage.channel.id,
      wordCount: words,
      charCount: chars,
      timestamp: newMessage.createdAt.getTime(),
      quest: quest
    }
  },{upsert: true, new: false}).exec(); // create message data if it doesn't exist (updates if it does), then return old message data (if it exists)

  const wordChange = oldMessageData && oldMessageData.wordCount ? oldMessageData.wordCount - words : words;
  const charChange = oldMessageData && oldMessageData.charCount ? oldMessageData.charCount - chars : chars;

  if (wordChange != 0 || charChange != 0) {
    if (quest) {
      await Users.updateOne({_id: message.author.id, "quests._id": message.channel.id},
      {
        "$inc": {
          "quests.$.charCount": charChange,
          "quests.$.wordCount": wordChange,
          "totalChars": charChange,
          "totalWords": wordChange
        }
      },{upsert : true}).exec();
    } else {
      await Users.updateOne({_id: message.author.id},
      {
        "$inc": {
          "totalChars": charChange,
          "totalWords": wordChange
        }
      },{upsert : true}).exec();
    }
  }
}
