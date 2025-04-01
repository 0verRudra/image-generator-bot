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


// src/models/user.js (Create a User Model for MongoDB)
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  subscription_status: { type: String, enum: ['free', 'paid'], default: 'free' }
});

module.exports = mongoose.model('User', userSchema);


// src/commands/imagine.js (Modify to check subscription before generating an image)
const {
  ApplicationCommandOptionType,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require('discord.js');
const { REPLICATE_API_KEY } = require('../../config.json');
const models = require('../models');
const User = require('../models/user');

module.exports = {
  run: async ({ interaction }) => {
    try {
      await interaction.deferReply();

      const email = interaction.options.getString('email');
      if (!email) {
        return interaction.editReply("Please provide your email.");
      }

      const user = await User.findOne({ email });
      if (!user || user.subscription_status === 'free') {
        return interaction.editReply("❌ You need a paid subscription to generate images.");
      }

      const { default: Replicate } = await import('replicate');
      const replicate = new Replicate({ auth: REPLICATE_API_KEY });

      const prompt = interaction.options.getString('prompt');
      const model = interaction.options.getString('model') || models[0].value;

      const output = await replicate.run(model, { input: { prompt } });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel(`Download`)
          .setStyle(ButtonStyle.Link)
          .setURL(`${output[0]}`)
          .setEmoji('1101133529607327764')
      );

      const resultEmbed = new EmbedBuilder()
        .setTitle('Image Generated')
        .addFields({ name: 'Prompt', value: prompt })
        .setImage(output[0])
        .setColor('#44a3e3')
        .setFooter({
          text: `Requested by ${interaction.user.username}`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        });

      await interaction.editReply({
        embeds: [resultEmbed],
        components: [row],
      });
    } catch (error) {
      const errEmbed = new EmbedBuilder()
        .setTitle('An error occurred')
        .setDescription('```' + error + '```')
        .setColor(0xe32424);

      interaction.editReply({ embeds: [errEmbed] });
    }
  },

  data: {
    name: 'imagine',
    description: 'Generate an image using a prompt.',
    options: [
      {
        name: 'email',
        description: 'Enter your registered email',
        type: ApplicationCommandOptionType.String,
        required: true,
      },
      {
        name: 'prompt',
        description: 'Enter your prompt',
        type: ApplicationCommandOptionType.String,
        required: true,
      },
      {
        name: 'model',
        description: 'The image model',
        type: ApplicationCommandOptionType.String,
        choices: models,
        required: false,
      },
    ],
  },
};
