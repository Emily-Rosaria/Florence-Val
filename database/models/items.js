const mongoose = require("mongoose"); // Import mongoose library
const Schema = mongoose.Schema; // Define Schema method

// Schema
var ItemSchema = new Schema({
  name: {type: String, required: true}, // name of item, e.g. Armor of Acid Resistance, Breastplate
  base: {type: String}, // base item the "magic" is applied to, if any, e.g. Breastplate
  type: {type: String, required: true, enum: ["Armor","Potion","Ring","Rod","Scroll","Staff","Wand","Weapon","Wondrous Item"]}, // type of magic item
  rarity: {type: String, required: true, enum: ["Common","Uncommon","Rare","Very Rare","Legendary","Mythic","Artifact","Unknown"]}, // e.g. Rare
  source: {type: String, required: true}, // source book, if not homebrew
  attunement: {type: Boolean},
  major: {type: Boolean} // whether it's minor or major (minor = consumables, major = larger bonuses)
});

// Model
var items = mongoose.model("items", ItemSchema); // Create collection model from schema
module.exports = items; // export model
