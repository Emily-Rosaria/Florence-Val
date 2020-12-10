require('dotenv').config(); //for .env file

// Bot stuff below

const Reddit = require('reddit'); // Reddit
const fetch = require('node-fetch'); // This lets me get stuff from api.
const Booru = require('booru'); // This lets me get stuff from weeb sites.
const fs = require('fs'); // Loads the Filesystem library
const path = require("path"); // Resolves file paths
const Discord = require('discord.js'); // Loads the discord API library
const Canvas = require('canvas'); // Pretty pictures
const readline = require('readline');
const {google} = require('googleapis');

const config = require('./config.json'); // load bot config

const mongoose = require("mongoose"); //database library
const connectDB = require("./database/connectDB.js"); // Database connection
const database = config.dbName; // Database name

const onDelete = require('./events/on-delete.js');
const onEdit = require('./events/on-edit.js');
const onMessage = require('./events/on-message.js');
const onReactionAdd = require('./events/on-reaction-add.js');
const onReactionRemove = require('./events/on-reaction-remove.js');
const onReactionTake = require('./events/on-reaction-take.js'); // mod/bot removals of reactions
const onReactionClear = require('./events/on-reaction-clear.js'); // clearing of message reactions



const client = new Discord.Client({partials: ['MESSAGE']}); // Initiates the client

client.commands = new Discord.Collection(); // Creates an empty list in the client object to store all commands

// function to find all js files in folder+subfolders
const getAllCommands = function (dir, cmds) {
  files = fs.readdirSync(dir, { withFileTypes: true });
  fileArray = cmds || [];
  files.forEach((file) => {
    if (file.isDirectory()) {
      const newCmds = fs.readdirSync(dir + '/' + file.name);
      fileArray = fileArray.concat(newCmds.map((f) => dir + '/' + file.name + '/' + f));
    } else if (file.name.endsWith('.js')) {
      fileArray = fileArray.concat([dir + '/' + file.name]);
    }
  });
  return fileArray;
};
const commandFiles = getAllCommands('./commands').filter(file => file.endsWith('.js')); // Loads the code for each command from the "commands" folder

// Loops over each file in the command folder and sets the commands to respond to their name
for (const file of commandFiles) {
    const command = require(file);
    client.commands.set(command.name, command);
}

client.cooldowns = new Discord.Collection(); // Creates an empty list for storing timeouts so people can't spam with commands

// Starts the bot and makes it begin listening for commands.
client.on('ready', async function() {
    client.user.setPresence({ activity: { type: 'PLAYING', name: 'with my Skull Dice' }, status: 'online' });
    console.log(`${client.user.username} is up and running! Launched at: ${(new Date()).toUTCString()}.`);
});

client.on('message', async message => {
    if (message.author.bot) {return} // don't respond to bots
    onMessage(message);
});

client.on('messageDelete', async message => {
    if (message.author && message.author.bot) {return} // don't respond to bots
    onDelete(message);
});

client.on('messageUpdate', async (oldMessage, newMessage) => {
    if (message.author && newMessage.author.bot) {return} // don't respond to bots
    onEdit(oldMessage, newMessage);
});

client.on('messageReactionAdd', async (reaction, user) => {
    if (user.bot) {return}
    onReactionAdd(reaction, user);
});

client.on('messageReactionRemove', async (reaction, user) => {
    if (user.bot) {return}
    onReactionRemove(reaction, user);
});

client.on('messageReactionRemoveEmoji', async (reaction) => {
    onReactionTake(reaction);
});

client.on('messageReactionRemoveAll', async (message) => {
    onReactionClear(message);
});

connectDB("mongodb://localhost:27017/"+database);
client.login(process.env.TOKEN); // Log the bot in using the token provided in the .env file
