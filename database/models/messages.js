const mongoose = require("mongoose"); // Import mongoose library
const Schema = mongoose.Schema; // Define Schema method

// Schema
var MessageSchema = new Schema({
  _id: {type: String, required: true}, // ID of the message that was posted
  author: {type: String, required: true}, // ID of the author that posted the message
  channel: {type: String, required: true}, // ID of the roleplay channel the message was posted in
  charCount: {type: String, required: true}, // Parsed character count at post time (or at last edit)
  wordCount: {type: String, required: true}, // Parsed word count at post time (or at last edit)
  timestamp: {type: String, required: true}, // timestamp of the message in unix ms
  quest: {type: Boolean, required: true}
});

MessageSchema.statics.prune = async function (days) {
  const now = new Date().getTime();
  const time = !days || isNaN(days) ? 14 : Number(days);
  const oneDay = 24*60*60*1000; // in ms
  const pastTimestamp = time < 14 ? now - 14*oneDay : (time > 90 ? now - 90*oneDay : now - pastTimestamp*oneDay);
  const delet = await this.deleteMany({quest: false, "$lte": {timestamp: pastTimestamp}}).exec();
  return delet;
}

// Model
var messages = mongoose.model("messages", MessageSchema); // Create collection model from schema
module.exports = messages; // export model
