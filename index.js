const { Client, GatewayIntentBits, ButtonBuilder, ActionRowBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (msg) => {
  if (msg.author.bot) return;

  if (msg.content === '!welcome') {
    const embed = new EmbedBuilder()
      .setTitle('Welcome!')
      .setDescription('Hello! Click a button below to learn more.');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('first_button')
        .setLabel('Click me')
        .setStyle(ButtonStyle.Primary),
    );

    await msg.channel.send({ embeds: [embed], components: [row] });
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId === 'first_button') {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('second_button')
        .setLabel('Continue')
        .setStyle(ButtonStyle.Success),
    );

    await interaction.reply({
      content: 'This message is only visible to you. Click below to continue.',
      components: [row],
      ephemeral: true,
    });
  }

  if (interaction.customId === 'second_button') {
    await interaction.reply({
      content: 'This second message is also only visible to you!',
      ephemeral: true,
    });
  }
});

client.login(process.env.DISCORD_TOKEN);
