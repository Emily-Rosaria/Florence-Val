const mongoose = require("mongoose"); // Import mongoose library
const Schema = mongoose.Schema; // Define Schema method

// Schema
var SpellSchema = new Schema({
  name: {type: String, required: true}, // name of spell
  level: {type: Number, required: true}, // level of spell, use 0 for cantrips
  source: {type: String, required: true}, // source book, if not homebrew
  classes: {type: [String], required: true} // classes that can use the spell
});

// Model
var spells = mongoose.model("spells", SpellSchema); // Create collection model from schema
module.exports = spells; // export model
