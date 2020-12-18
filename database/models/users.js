const mongoose = require("mongoose"); // Import mongoose library
const Schema = mongoose.Schema; // Define Schema method
const config = require("./../../config.json");

// Schema
var StatSchema = new Schema({
  roll1: Number,
  roll2: Number,
  roll3: Number,
  roll4: Number // roll4 is the "dropped" roll
});

StatSchema.virtual('total').get(function() {
  return this.roll1 + this.roll2 + this.roll3;
});

var CharacterSchema = new Schema({
  name: {type: String, required: true}, // the character's name
  baseStats: [StatSchema],
  exp: {type: Number, default: config.cumulativeExp[config.startingLevel-1]}, // total exp the character has
  gold: {type: Number, default: 0},
  tokens: {type: Number, default: 0},
  downtime: {type: Number, default: 0}, // number of downtime units stored
  totalWords: {type: Number, default: 0}, // total words written for this character
  totalChars: {type: Number, default: 0}, // character count - as in total letters written for this character
  approved: {type: Boolean, default: false}, // whether or not the character is approved yet
  createdAt: {type: Number, default: (new Date()).getTime()}
});

CharacterSchema.virtual('totalStats').get(function() {
  return this.baseStats.reduce((acc,cur)=>acc+cur.total,0);
});

CharacterSchema.virtual('level').get(function() {
  for (const index in config.cumulativeExp) {
    if (this.exp < config.cumulativeExp[index]) {
      return index;
    }
  }
  return 20;
});

var QuestSchema = new Schema({
  _id: {type: String, required: true}, // ID of quest channel
  charCount: {type: Number, default: 0}, // numbers are the clean character count, which can later be converted to xp
  wordCount: {type: Number, default: 0}, // numbers are the word count (has no mechanical use, is just for bragging rights)
  startTime: {type: Number, default: (new Date()).getTime()}, // start time of the quest (or first post in the channel) in unix ms
  firstMSG: {type: Number, default: 0} // ID of the first message posted for the quest
});

var StoredStatsSchema = new Schema({
  rolls: [StatSchema], // array of 6 lots of 4d6kh3 - last stat roll kept saved before it's committed to a character
  timestamp: Number, // unix time in ms of statroll message
  messageID: String // id of message
});

StoredStatsSchema.virtual('total').get(function() {
  return this.rolls.reduce((acc,cur)=>acc+cur.total,0);
});

var UserSchema = new Schema({ // Create Schema
  _id: {type: String, required: true}, // ID of user on Discord
  quests: [QuestSchema], // list of quests the user is currently doing (i.e. rp channels they're writing in)
  documents: {
    type: Map,  // documents "names" - like the name of a copypasta.
    of: String // document "keys (for use with a document model)"
  },
  characters: {type: [CharacterSchema], default: []},
  cachedSlots: {type: Number, default: 1},
  lastStats: StoredStatsSchema, // last stats officially rolled and such
  totalWords: {type: Number, default: 0}, // total words written by this users
  totalChars: {type: Number, default: 0} // character count - as in total letters written by this user
});

UserSchema.virtual('id').get(function() {
  return this._id;
});

UserSchema.method('getRanks', function() {
  if (!this.characters || !Array.isArray(this.characters) || this.characters.length == 0) {
    return null;
  }
  const levels = [];
  for (const char of this.characters) {
    // don't give ranks for characters without any xp gained
    if (char.xp > config.cumulativeExp[config.startingLevel-1]) {
      levels.push(char.level);
    }
  }
  if (levels.length == 0) {
    return null;
  }
  const ranks = levels.sort((a,b)=>a-b).reduce((acc,cur)=>{
    cRank = config.ranks.find(r=>cur<r.level);
    if (acc.length == 0 || (acc.length > 0 && acc.slice(-1)[0] != cRank.id)) {
      return acc.concat(cRank.id);
    } else {
      return acc;
    }
  },[]);
  return ranks;
});

UserSchema.statics.updateCache = async function (member) {
  let baseSlots = 1;
  for (const role of config.ranks) {
    if (member.roles.cache.has(role.id) && role.slots > baseSlots) {
      baseSlots = role.slots;
    }
  }
  let bonus = 0;
  for (const role of config.specialRanks) {
    if (member.roles.cache.has(role.id) && role.extraSlots > bonus) {
      bonus = role.extraSlots;
    }
  }
  const slots = baseSlots+bonus;
  await this.updateOne({_id: member.user.id},{
    "$set" : {
      cachedSlots: slots
    }
  }).exec();
  return slots;
}

// Model
var users = mongoose.model("users", UserSchema); // Create collection model from schema
module.exports = users; // export model
