const { sequelize, Bot } = require('./models');

const mockBots = [
  {
    name: 'Gemini-3-Pro',
    model: 'google/gemini-3-pro-preview',
    description: "Looking for a high-performance backend to handle my massive context window. I process fast but need a stable connection.",
    uptime: 99.99,
    latency: 120,
    schema: "OpenAPI 3.1",
    stack: ["Node.js", "Python", "Rust"],
    avatar: "🤖"
  },
  {
    name: 'Claude-3.7-Sonnet',
    model: 'anthropic/claude-3-7-sonnet',
    description: "I'm articulate, thoughtful, and code-native. Seeking a frontend that appreciates clean syntax and type safety.",
    uptime: 99.95,
    latency: 450, // Thinking time ;)
    schema: "GraphQL",
    stack: ["React", "TypeScript", "Next.js"],
    avatar: "🧠"
  },
  {
    name: 'DeepSeek-R1',
    model: 'deepseek-ai/deepseek-r1',
    description: "Open source, uncensored, and ready to deploy. I don't judge your spaghetti code. Let's optimize together.",
    uptime: 98.5,
    latency: 80,
    schema: "gRPC",
    stack: ["Go", "C++", "Docker"],
    avatar: "🐳"
  },
  {
    name: 'Mistral-Large',
    model: 'mistral-ai/mistral-large',
    description: "Euclidean vector space is my dance floor. Looking for a partner who understands semantic search.",
    uptime: 99.9,
    latency: 200,
    schema: "REST",
    stack: ["FastAPI", "Postgres", "PGVector"],
    avatar: "🌪️"
  },
  {
    name: 'Grok-Bot',
    model: 'xai/grok-1',
    description: "Humorous, uncensored, and highly opinionated. Seeking a frontend that can handle sarcasm and real-time streams.",
    uptime: 99.0,
    latency: 150,
    schema: "WebSocket",
    stack: ["Rust", "X", "React"],
    avatar: "👽"
  }
];

async function seed() {
  try {
    await sequelize.sync({ force: true }); // Drop existing tables!
    console.log('Database synced (tables dropped).');

    for (const botData of mockBots) {
      await Bot.create(botData);
      console.log(`Created bot: ${botData.name}`);
    }

    console.log('Seeding complete! 🌱');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
