// src/index.js (Modify to connect to MongoDB)
const { Client, IntentsBitField } = require('discord.js');
const { CommandHandler } = require('djs-commander');
const { BOT_TOKEN, MONGO_URI } = require('../config.json');
const path = require('path');
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error:", err));

const client = new Client({
  intents: [IntentsBitField.Flags.Guilds, IntentsBitField.Flags.GuildMembers],
});

new CommandHandler({
  client,
  commandsPath: path.join(__dirname, 'commands'),
  eventsPath: path.join(__dirname, 'events'),
});

client.login(BOT_TOKEN);


