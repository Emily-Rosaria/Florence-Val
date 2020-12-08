const config = require('./../config.json'); // load bot config
const mongoose = require("mongoose"); //database library
const Users = require("./../database/models/users.js"); // users model
const Messages = require("./../database/models/messages.js"); // messages model

module.exports = async function (message) {
  const oldMessageData = await Messages.findByIdAndDelete(message.id).exec(); // return message data if it existed, delete if it does

  if (!oldMessageData) {
    return; // return if no message data
  }

  let quest = false;

  if (config.channels.quests.includes(message.channel.id)) {
    quest = true;
  } else if (!config.channels.tavern.includes(message.channel.id)) {
    return; // don't do anything for deletions in non-rp channels
  }

  const userData = await Users.findById(oldMessageData.author).exec();
  if (quest && userData && userData.quests && userData.quests.length > 0) {
     const questData = userData.quests.find(q=>q._id == oldMessageData.channel);
     if (!questData || oldMessageData.timestamp < questData.startTime) {
       return; // don't make changes for old message deletions (or for deleted posts not corresponding to a current quest)
     }
  }

  const wordChange = -oldMessageData.wordCount;
  const charChange = -oldMessageData.charCount;

  if (quest) {
    await Users.updateOne({_id: oldMessageData.author, "quests._id": oldMessageData.channel},
    {
      "$inc":
        {"quests.$.charCount": charChange},
        {"quests.$.wordCount": wordChange},
        {"totalChars": charChange},
        {"totalWords": wordChange}
    }).exec();
  } else {
    await Users.updateOne({_id: oldMessageData.author},
    {
      "$inc":
        {"totalChars": charChange},
        {"totalWords": wordChange}
    }).exec();
  }
}
