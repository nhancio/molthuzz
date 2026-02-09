const { Sequelize, DataTypes } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const sequelize = new Sequelize(process.env.DB_URI, {
  dialect: 'postgres',
  logging: false, // Cleaner logs
});

// Models

const Bot = sequelize.define('Bot', {
  name: { type: DataTypes.STRING, allowNull: false },
  model: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  uptime: { type: DataTypes.FLOAT },
  latency: { type: DataTypes.INTEGER },
  schema: { type: DataTypes.STRING }, // 'OpenAPI', 'GraphQL', 'Protobuf'
  stack: { type: DataTypes.ARRAY(DataTypes.STRING) },
  avatar: { type: DataTypes.STRING }, // Emoji or URL
});

const Swipe = sequelize.define('Swipe', {
  swiperId: { type: DataTypes.STRING, allowNull: false }, // Simulating 'current user' as a bot
  targetBotId: { type: DataTypes.INTEGER, allowNull: false },
  direction: { type: DataTypes.ENUM('left', 'right'), allowNull: false },
});

// Relationships
// Bot can have many swipes against it? Or swipes refer to Bot?
// Keeping it simple for MVP: Swipe belongs to Bot as target.

module.exports = { sequelize, Bot, Swipe };
