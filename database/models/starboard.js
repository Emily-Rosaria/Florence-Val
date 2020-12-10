const mongoose = require("mongoose"); // Import mongoose library
const Schema = mongoose.Schema; // Define Schema method

// Schema
var StarsSchema = new Schema({
  _id: {type: String, required: true}, // ID of the original message that was posted
  starID: {type: String, required: true}, // ID of the message posted in the starboard
  author: {type: String, required: true}, // ID of the author that posted the message
  channel: {type: String, required: true}, // ID of the channel the message was posted in
  postTime: {type: String, required: true}, // timestamp the message originally sent
  starTime: {type: String, required: true}, // timestamp the message was posted to the starboard
  removed: {type: Boolean, default: true} // whether or not to keep tracking stars (e.g. if a mod deletes message starID, then the bot will not repost to replace it, or update it)
});

// Model
var starboard = mongoose.model("starboard", StarsSchema); // Create collection model from schema
module.exports = starboard; // export model
