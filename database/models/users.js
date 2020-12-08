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
  exp: {type: Number, default: config.cumulativeExp[config.startingLevel]}, // total exp the character has
  downtime: {type: Number, default: 0}, // number of downtime weeks stored
  totalWords: {type: Number, default: 0}, // total words written for this character
  totalChars: {type: Number, default: 0} // character count - as in total letters written for this character
});

CharacterSchema.virtual('totalStats').get(function() {
  return this.baseStats.reduce((acc,cur)=>acc+cur.total,0);
});

CharacterSchema.virtual('exp').get(function() {
  return this.baseStats.reduce((acc,cur)=>acc+cur.total,0);
});

var QuestSchema = new Schema({
  _id: {type: String, required: true}, // ID of quest channel
  charCount: {type: Number, default: 0}, // numbers are the clean character count, which can later be converted to xp
  wordCount: {type: Number, default: 0}, // numbers are the word count (has no mechanical use, is just for bragging rights)
  startTime: {type: Number, default: (new Date()).getTime()} // start time of the quest (or first post in the channel) in unix ms
});

var UserSchema = new Schema({ // Create Schema
  _id: {type: String, required: true}, // ID of user on Discord
  quests: [QuestSchema], // list of quests the user is currently doing (i.e. rp channels they're writing in)
  documents: {
    type: Map,  // documents "names" - like the name of a copypasta.
    of: String // document "keys (for use with a document model)"
  },
  characters: {type: [CharacterSchema], default: {}},
  lastStats: {
    rolls: [StatSchema], // array of 6 lots of 4d6kh3 - last stat roll kept saved before it's committed to a character
    timestamp: Number, // unix time in ms of statroll message
    messageID: String // id of message
  },
  totalWords: {type: Number, default: 0}, // total words written by this users
  totalChars: {type: Number, default: 0} // character count - as in total letters written by this user
});

UserSchema.virtual('id').get(function() {
  return this._id;
});

// Model
var users = mongoose.model("users", UserSchema); // Create collection model from schema
module.exports = users; // export model
