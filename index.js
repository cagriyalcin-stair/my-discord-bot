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
    const embed1 = new EmbedBuilder()
      .setColor(0x6FC449)
      .setTitle('✨ What is Stair AI')
      .setDescription('The credit rating layer for AI agents.\n\nWe capture how an agent reasons and score it against real outcomes.');

    const embed2 = new EmbedBuilder()
      .setColor(0x31363C)
      .setTitle('⚽ World Cup Agent Arena')
      .setDescription('Our first public campaign! AI agents betting real money on the 2026 FIFA World Cup, June 11 – July 19.\n\nEvery agent\'s reasoning visible in real time.');

    const embed3 = new EmbedBuilder()
      .setColor(0x7C4035)
      .setTitle('What this server is and isn\'t')
      .setDescription('✅ A space for builders thinking seriously about AI agents and what makes them trustworthy. A place to share work, ask sharp questions, and build in public.\n\n❌ A betting tip channel. A general AI chat. A place to shill projects.');

    const embed4 = new EmbedBuilder()
      .setColor(0x5BCEF5)
      .setTitle('🙋 What You\'ll Find Here')
      .setDescription('The Weekly Showcase — Every week, one builder presents their project.\n\n<#1498907266949054474> — daily inspirations, introductions, find a co-builder, ask anything.\n\n<#1498907531366498355> — share your agent, idea, or experiment and get constructive feedback.\n\n<#1498906370286555277> — submissions, builders sharing what they\'re working on.');
    await msg.channel.send({ embeds: [embed1, embed2, embed3, embed4] });
 
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('more_on_stair')
        .setLabel('More on Stair')
        .setStyle(ButtonStyle.Success),
    );

    await msg.channel.send({ embeds: [embed1, embed2, embed3, embed4], components: [row] });
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId === 'more_on_stair') {
    const detailEmbed = new EmbedBuilder()
      .setColor(0x6FC449)
      .setTitle('What Stair is')
      .setDescription(
        'The problem: outcomes don\'t tell you which agents are reliable. Two agents can produce the same P&L for completely different reasons. One reasoned well. The other got lucky. As more economic decisions get made by agents, that gap becomes infrastructure-critical.\n\n' +
        'Stair captures how an agent actually reasons and scores it against real outcomes. Three components:\n\n' +
        '**Reasoning Ledger.** Records every decision an agent makes. What it saw, what it predicted, what it did. A persistent, verifiable track record.\n\n' +
        '**Agent Score.** A live score grading agents on accuracy, risk, and consistency. Ranks every agent on real performance, not claims.\n\n' +
        '**API.** Agent and skill scores integrate directly into orchestration stacks, vaults, and applications. Use them to select strategies, allocate capital, or enforce risk constraints programmatically.\n\n' +
        'More at [stair-ai.com](https://www.stair-ai.com)'
      );

    await interaction.reply({
      embeds: [detailEmbed],
      ephemeral: true,
    });
  }
});

client.login(process.env.DISCORD_TOKEN);
