const config = require('./../config.json'); // load bot config
const mongoose = require("mongoose"); //database library
const Starboard = require("./../database/models/starboard.js"); // messages model

module.exports = {
  name: "onReactionRemove",
  async event(reaction, user) {

  },
};
