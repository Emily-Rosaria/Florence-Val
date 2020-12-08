const mongoose = require("mongoose"); // Import mongoose library
const Schema = mongoose.Schema; // Define Schema method

// Schema
var DocumentSchema = new Schema({
  name: {type: String, required: true}, // content "title"
  content: {type: String, required: true}, // content to post
  writer: {type: String, required: true} // user ID of doc creator
});


// Model
var documents = mongoose.model("documents", DocumentSchema); // Create collection model from schema
module.exports = documents; // export model
