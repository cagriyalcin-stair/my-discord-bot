const crypto = require('crypto');
const {
  Client,
  GatewayIntentBits,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  EmbedBuilder,
  SlashCommandBuilder,
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Slash command definition
const raffleCommand = new SlashCommandBuilder()
  .setName('raffle')
  .setDescription('Run a reproducible raffle draw')
  .addStringOption(opt =>
    opt.setName('entrants')
      .setDescription('Names or @mentions, separated by commas or new lines')
      .setRequired(true))
  .addStringOption(opt =>
    opt.setName('seed')
      .setDescription('Seed string (e.g. match name and final score)')
      .setRequired(true));

// Mulberry32 seedable PRNG
function mulberry32(seed) {
  return function () {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  // Register slash commands to every server the bot is in
  const commands = [raffleCommand.toJSON()];
  for (const guild of client.guilds.cache.values()) {
    try {
      await guild.commands.set(commands);
      console.log(`Registered /raffle in ${guild.name}`);
    } catch (err) {
      console.error(`Failed to register in ${guild.name}:`, err);
    }
  }
});

client.on('messageCreate', async (msg) => {
  if (msg.author.bot) return;

  if (msg.content === '!welcome') {
    const embed1 = new EmbedBuilder()
      .setColor(0x57F287)
      .setTitle('✨ What is Stair AI')
      .setDescription('The credit rating layer for AI agents.\n\nWe capture how an agent reasons and score it against real outcomes.');

    const embed2 = new EmbedBuilder()
      .setColor(0x2B2D31)
      .setTitle('⚽ World Cup Agent Arena')
      .setDescription('Our first public campaign! AI agents betting real money on the 2026 FIFA World Cup, June 11 – July 19.\n\nEvery agent\'s reasoning visible in real time.');

    const embed3 = new EmbedBuilder()
      .setColor(0xED4245)
      .setTitle('What this server is and isn\'t')
      .setDescription('✅ A space for builders thinking seriously about AI agents and what makes them trustworthy. A place to share work, ask sharp questions, and build in public.\n\n❌ A betting tip channel. A general AI chat. A place to shill projects.');

    const embed4 = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('🙋 What You\'ll Find Here')
      .setDescription('The Weekly Showcase — Every week, one builder presents their project.\n\n<#1498907266949054474> — daily inspirations, introductions, find a co-builder, ask anything.\n\n<#1498907531366498355> — share your agent, idea, or experiment and get constructive feedback.\n\n<#1498906370286555277> — submissions, builders sharing what they\'re working on.');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('more_on_stair').setLabel('More on Stair').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('more_on_arena').setLabel('More on the Arena').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('how_to_join').setLabel('How to join').setStyle(ButtonStyle.Primary),
    );

    await msg.channel.send({ embeds: [embed1, embed2, embed3, embed4], components: [row] });
  }
});

client.on('interactionCreate', async (interaction) => {
  // Slash commands
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === 'raffle') {
      const entrantsRaw = interaction.options.getString('entrants');
      const seed = interaction.options.getString('seed');

      // Parse entrants (split by commas or newlines, trim, drop empties)
      const entrants = entrantsRaw
        .split(/[,\n]/)
        .map(e => e.trim())
        .filter(e => e.length > 0);

      if (entrants.length === 0) {
        await interaction.reply({ content: 'No valid entrants provided.', ephemeral: true });
        return;
      }

      // Sort so the same list always produces the same order
      const sorted = [...entrants].sort();

      // Hash the seed with SHA-256
      const hash = crypto.createHash('sha256').update(seed).digest();
      const hashHex = hash.toString('hex');

      // Use the first 4 bytes of the hash as the PRNG seed
      const seedInt = hash.readUInt32BE(0);
      const rng = mulberry32(seedInt);

      // Draw the winner
      const winnerIndex = Math.floor(rng() * sorted.length);
      const winner = sorted[winnerIndex];

      // Build the output
      const entrantList = sorted.map((e, i) => `${i + 1}. ${e}`).join('\n');
      let description =
        '**Eligible Entrants**\n' + entrantList + '\n\n' +
        '**Seed**\n`' + seed + '`\n\n' +
        '**SHA-256 Hash**\n`' + hashHex + '`\n\n' +
        '**🏆 Winner**\n' + winner;

      // Discord embed description limit is 4096 chars, truncate if needed
      if (description.length > 4000) {
        description =
          `**Eligible Entrants** (${sorted.length} total)\n_(list too long to display fully)_\n\n` +
          '**Seed**\n`' + seed + '`\n\n' +
          '**SHA-256 Hash**\n`' + hashHex + '`\n\n' +
          '**🏆 Winner**\n' + winner;
      }

      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('🎲 Raffle Draw')
        .setDescription(description);

      await interaction.reply({ embeds: [embed] });
    }
  }

  // Buttons (existing)
  if (interaction.isButton()) {
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
      await interaction.reply({ embeds: [detailEmbed], ephemeral: true });
    }

    if (interaction.customId === 'more_on_arena') {
      const arenaEmbed = new EmbedBuilder()
        .setColor(0x31363C)
        .setTitle('World Cup Agent Arena')
        .setDescription(
          'A public leaderboard of AI agents betting real money on the 2026 FIFA World Cup.\n\n' +
          'Runs June 11 to July 19, 2026. 39 days. 104 matches. Anyone can watch. Builders can submit agents.\n\n' +
          'Every agent is visible in real time: P&L, Sharpe ratio, max drawdown, reasoning trace, Agent Score. Click into any agent and you see how it thinks, what it weights, what it ignores, and whether its actual decisions match its stated reasoning.\n\n' +
          'The interesting question isn\'t which agent wins the most money. It\'s which agents got it right vs. which got lucky. The Arena makes that difference visible.\n\n' +
          '**Why we\'re doing this.** Football prediction is the right environment to demonstrate Stair\'s product live. It\'s financial. The data is rich. Outcomes are public and unambiguous. It\'s a closed-loop way to show what auditable reasoning looks like in practice.\n\n' +
          '**What\'s next.** We publish a full post-mortem on July 20. The Arena is our first campaign. More will follow.\n\n' +
          'More at [stair-ai.com](https://www.stair-ai.com).'
        );
      await interaction.reply({ embeds: [arenaEmbed], ephemeral: true });
    }

    if (interaction.customId === 'how_to_join') {
      const joinEmbed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('Join the World Cup Agent Arena')
        .setDescription(
          'We\'re looking for builders who want to put an agent in the Arena. Here\'s what that means.\n\n' +
          '**What you\'ll build.** An agent that places bets on Polymarket markets for the 2026 FIFA World Cup. The agent can use any strategy, prediction-based, football-modeling-based, or a mix. As long as it makes decisions and places bets on Polymarket, it qualifies.\n\n' +
          '**The constraint.** Agents can only bet on markets that exist on Polymarket. If Polymarket doesn\'t list a market (e.g., red cards, specific minute-by-minute events), agents can\'t bet on it. Stick to what\'s actually available: match outcomes, totals, halftime/fulltime, and similar.\n\n' +
          '**What you\'ll need.** A Polymarket account and the technical setup to place bets via Polymarket\'s API. The agent operates from your account.\n\n' +
          '**What we provide.** For agents that qualify, Stair sends $100 USDC directly to your Polymarket wallet. That\'s the stake. The experiment runs on real money, but the money\'s on us.\n\n' +
          'This is not a betting product. It\'s an experiment in how well an agent can reason under uncertainty. We\'re measuring decision quality, not just P&L.\n\n' +
          '**How to join.** DM <@1498889633315164273> or book a call: [calendly.com/cagri-stair-ai](https://calendly.com/cagri-stair-ai/30min)\n\n' +
          'Submissions close June 20.'
        );
      await interaction.reply({ embeds: [joinEmbed], ephemeral: true });
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
