const config = require('./../config.json'); // load bot config
const mongoose = require("mongoose"); //database library
const Users = require("./../database/models/users.js"); // users model
const Messages = require("./../database/models/messages.js"); // messages model

module.exports = {
  name: "onDelete",
  async event(message) {
    const oldMessageData = await Messages.findByIdAndDelete(message.id).exec(); // return message data if it existed, delete if it does

    if (!oldMessageData) {
      return; // return if no message data
    }

    let quest = oldMessageData.quest;

    const userData = await Users.findById(oldMessageData.author).exec();

    if (!userData || (quest && (!userData.quests || userData.quests.length == 0))) {
      return; // don't do anything if there's no user data or if the message was for a past quest that's no longer in progress
    }

    const wordChange = -oldMessageData.wordCount;
    const charChange = -oldMessageData.charCount;

    if (quest) {
      const questData = userData.quests.find(q=>q._id == oldMessageData.channel);
      if (!questData || oldMessageData.timestamp < questData.startTime || Number(message.id) < questData.firstMSG) {
        return; // don't make changes for old message deletions (or for deleted posts not corresponding to a current quest)
      }

      if (questData.wordCount + wordChange <= 0 || questData.charCount + charChange <= 0) {
        await Users.updateOne({_id: oldMessageData.author},{
          "$inc": {
            "totalChars": charChange,
            "totalWords": wordChange
          },
          "$pull": {
            "quests": {
              "_id": {"$eq": oldMessageData.channel}
            }
          }
        }).exec();
      } else {
        await Users.updateOne({
          _id: oldMessageData.author,
          "quests._id": oldMessageData.channel
        },{
          "$inc": {
            "quests.$.charCount": charChange,
            "quests.$.wordCount": wordChange,
            "totalChars": charChange,
            "totalWords": wordChange
          }
        }).exec();
      }
    } else {
      await Users.updateOne({_id: oldMessageData.author},{
        "$inc": {
          "totalChars": charChange,
          "totalWords": wordChange
        }
      }).exec();
    }
  },
};
