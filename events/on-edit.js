const config = require('./../config.json'); // load bot config
const mongoose = require("mongoose"); //database library
const Users = require("./../database/models/users.js"); // users model
const Messages = require("./../database/models/messages.js"); // messages model

module.exports = {
  name: "onEdit",
  async event(oldMessage, newMessage) {

    if (newMessage.partial && !newMessage.client) {
      return;
    }

    let content = newMessage.content;

    const oldData = await Messages.findById(newMessage.id).exec();
    const cID = oldData ? oldData.channel : (newMessage.channel ? newMessage.channel.id : false);
    const uID = oldData ? oldData.author : (newMessage.author ? newMessage.author.id : false);
    const timestamp = oldData ? oldData.timestamp : (newMessage.createdAt ? newMessage.createdAt.getTime() : (newMessage.editedAt ? newMessage.editedAt.getTime() : (new Date()).getTime()));
    if (uID == false || cID == false) {
      return;
    }

    if (!content && newMessage.partial) {
      content = await newMessage.fetch().then((m)=>m.content);
    }

    let quest = false;

    if (config.channels.quests.includes(cID)) {
      quest = true;
    } else if (!config.channels.tavern.includes(cID)) {
      return; // don't do anything for edits in non-rp channels
    }

    const botPing = ["<@" + newMessage.client.user.id + ">","<@!" + newMessage.client.user.id + ">"];
    const otherBots = ["!","?","r!","r?","/r","s?","-"];

    // Find if message now begins with a valid command prefix
    const prefix = config.prefix.concat(botPing).concat(otherBots).some(p => content.toLowerCase().startsWith(p));

    // If prefixes, return (bot doesn't care about command messages)
    if (prefix) {
      return;
    }

    const userData = await Users.findById(uID).exec();

    if (!userData || (quest && (!userData.quests || userData.quests.length == 0))) {
      return;
    }

    if (quest) {
       const questData = userData.quests.find(q=>q._id == cID);
       if (!questData || (timestamp && timestamp < questData.startTime) || Number(newMessage.id) < questData.firstMSG) {
         return; // don't make changes for old message edits (or edits for posts not corresponding to a current quest)
       }
    }

    const splitMSG = content.split('```'); // split around ``` to find content between pairs of them
    let cleanMSG = splitMSG.filter((e,i)=>i % 2 == 0 || (i+1 < splitMSG.length && splitMSG.length % 2 == 0)).join(' ');
    cleanMSG = cleanMSG.replace(/[*_~|`]+/,'').trim(); // remove formatting characters
    cleanMSG = cleanMSG.replace(/\s{2,}/,' '); // remove excessive line breaks and double spaces
    cleanMSG = cleanMSG.replace(/\p{M}+/,''); // remove zalgo text ("mark characters")
    const chars = cleanMSG.length;
    const words = chars == 0 ? 0 : cleanMSG.split(/\s+/).length;

    const oldMessageData = await Messages.findByIdAndUpdate(newMessage.id,{
      "$set": {
        author: uID,
        channel: cID,
        wordCount: words,
        charCount: chars,
        timestamp: timestamp,
        quest: quest
      }
    },{upsert: true, new: false}).exec(); // create message data if it doesn't exist (updates if it does), then return old message data (if it exists)

    const wordChange = oldMessageData && oldMessageData.wordCount ? words - oldMessageData.wordCount : words;
    const charChange = oldMessageData && oldMessageData.charCount ? chars - oldMessageData.charCount : chars;

    if (wordChange != 0 || charChange != 0) {
      if (quest) {
        await Users.updateOne({_id: uID, "quests._id": cID},{
          "$inc": {
            "quests.$.charCount": charChange,
            "quests.$.wordCount": wordChange,
            "totalChars": charChange,
            "totalWords": wordChange
          }
        }).exec();
      } else {
        await Users.updateOne({_id: uID},{
          "$inc": {
            "totalChars": charChange,
            "totalWords": wordChange
          }
        }).exec();
      }
    }
  },
};
