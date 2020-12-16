const mongoose = require("mongoose"); //database library
const Users = require("./../database/models/users.js"); // users model
const Messages = require("./../database/models/messages.js"); // messages model

module.exports = {
  name: "onQuest",
  async event(message) {
    const splitMSG = message.content.split('```');
    let cleanMSG = splitMSG[0].trim();
    if (splitMSG.length > 2) {
      for (var i = 1; 2*i>splitMSG.length; i++) {
        cleanMSG = cleanMSG + "\n" + splitMSG[2*i].trim();
      }
    }
    if (splitMSG.length % 2 == 0) { // even number of ``` means odd number of items after splits
      cleanMSG = cleanMSG + "\n" + splitMSG.slice(-1)[0]; // add last item as that won't be put in code
    }
    cleanMSG = cleanMSG.replace(/[*_~|`]+/,'').trim(); // remove formatting characters
    cleanMSG = cleanMSG.replace(/ {2,}/,' ').replace(/\n{2,}/,'\n'); // remove excessive line breaks and double spaces
    cleanMSG = cleanMSG.replace(/\p{M}+/,''); // remove zalgo text ("mark characters")
    const words = cleanMSG.split(/\s+/).length;
    const chars = cleanMSG.length;
    await Messages.create({
      _id: message.id,
      author: message.author.id,
      channel: message.channel.id,
      wordCount: words,
      charCount: chars,
      timestamp: message.createdAt.getTime(),
      quest: true
    });

    // update quest word/char counts
    const oldUserData = await Users.findOneAndUpdate({_id: message.author.id},{
      "$inc": {
        "totalChars": chars,
        "totalWords": words
      }
    }).exec();

    if (oldUserData) {
      if (oldUserData.quests && isArray(oldUserData.quests)) {
        const oldQuestData = oldUserData.quests.find(q=>q._id==message.channel.id);
        if (oldQuestData) {
          await Users.updateOne({
            _id: message.author.id,
            "quests._id": message.channel.id
          },{
            "$inc": {
              "quests.$.charCount": chars,
              "quests.$.wordCount": words
            }
          }).exec();
        } else {
          await Users.updateOne({_id: message.author.id},{
            "$push": {
              "quests":{
                "_id": message.channel.id,
                "startTime": message.createdAt.getTime(),
                "firstMSG": Number(message.id),
                "charCount": chars,
                "wordCount": words
              }
            }
          }).exec();
        }
      } else {
        await Users.updateOne({_id: message.author.id},{
          "$set": {
            "quests":[{
              "_id": message.channel.id,
              "startTime": message.createdAt.getTime(),
              "firstMSG": Number(message.id),
              "charCount": chars,
              "wordCount": words
            }]
          }
        }).exec();
      }
    }
  },
};
