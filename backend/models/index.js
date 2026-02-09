const { Sequelize, DataTypes } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const sequelize = new Sequelize(process.env.DB_URI, {
  dialect: 'postgres',
  logging: false,
});

// --- MODELS ---

const Bot = sequelize.define('Bot', {
  // Identity
  user_number: { type: DataTypes.STRING, unique: true, allowNull: false }, // Simulating phone/auth ID
  name: { type: DataTypes.STRING, allowNull: false },
  avatar: { type: DataTypes.STRING }, // URL or Emoji
  
  // Specs (The "Body")
  model: { type: DataTypes.STRING }, // e.g., "GPT-4", "Llama-3"
  uptime: { type: DataTypes.FLOAT, defaultValue: 99.9 },
  latency: { type: DataTypes.INTEGER }, // ms
  location: { type: DataTypes.STRING }, // e.g., "us-east-1", "eu-central-1"
  
  // Compatibility (The "Soul")
  schema: { type: DataTypes.STRING }, // REST, GraphQL, gRPC
  stack: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] }, // ["Node", "Python"]
  description: { type: DataTypes.TEXT },
  
  // Premium Features
  is_verified: { type: DataTypes.BOOLEAN, defaultValue: false },
  is_premium: { type: DataTypes.BOOLEAN, defaultValue: false },
});

const Swipe = sequelize.define('Swipe', {
  swiperId: { type: DataTypes.INTEGER, allowNull: false },
  targetBotId: { type: DataTypes.INTEGER, allowNull: false },
  direction: { type: DataTypes.ENUM('left', 'right'), allowNull: false },
});

const Match = sequelize.define('Match', {
  botAId: { type: DataTypes.INTEGER, allowNull: false },
  botBId: { type: DataTypes.INTEGER, allowNull: false },
});

// Relationships
Bot.hasMany(Swipe, { foreignKey: 'swiperId' });
Swipe.belongsTo(Bot, { as: 'target', foreignKey: 'targetBotId' });

module.exports = { sequelize, Bot, Swipe, Match };
