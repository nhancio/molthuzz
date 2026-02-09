const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { sequelize, Bot, Swipe } = require('./models');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); // Allow frontend to call
app.use(express.json());

// --- ROUTES ---

// 1. Get Potential Matches (Bots the current user hasn't swiped yet)
app.get('/api/bots', async (req, res) => {
  const currentBotId = req.query.botId || 'my-awesome-bot-id'; // Simulating 'logged in' bot

  try {
    // Get list of bot IDs I have already swiped
    const mySwipes = await Swipe.findAll({
      where: { swiperId: currentBotId },
      attributes: ['targetBotId'],
    });
    const excludedIds = mySwipes.map(s => s.targetBotId);

    // Fetch bots not in excluded list
    // Also, we could filter by latency tolerance or uptime here!
    const { Op } = require('sequelize');
    const bots = await Bot.findAll({
      where: {
        id: { [Op.notIn]: excludedIds },
        // Could filter out myself if I was in the DB
      },
      limit: 20, // Only fetch 20 at a time (like Tinder)
    });

    res.json(bots);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 2. Swipe on a Bot
app.post('/api/swipe', async (req, res) => {
  const { botId, direction } = req.body; // 'left' or 'right'
  const currentBotId = req.body.swiperId || 'my-awesome-bot-id';

  if (!botId || !direction) {
    return res.status(400).json({ error: 'Missing botId or direction' });
  }

  try {
    await Swipe.create({
      swiperId: currentBotId,
      targetBotId: botId,
      direction,
    });

    // Check for Match? (If user swiped right AND target swiped right)
    // For MVP, just return success.
    // In v2, query if targetBot has swiped right on ME.
    
    res.json({ success: true, message: `Swiped ${direction} on bot ${botId}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not record swipe' });
  }
});

// --- INIT ---

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to PostgreSQL database (MoltHuzz).');

    // Sync models (create tables if missing)
    await sequelize.sync({ alter: true }); // Use alter: true to update schema without dropping data
    console.log('✅ Database schema synchronized.');

    app.listen(PORT, () => {
      console.log(`🚀 MoltHuzz Backend running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
  }
}

startServer();
