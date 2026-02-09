const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { sequelize, Bot, Swipe, Match } = require('./models');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- ROUTES ---

// 1. Auth / Onboarding Check
// Checks if a user number exists. Returns bot profile if found, or null.
app.post('/api/auth/check', async (req, res) => {
  const { user_number } = req.body;
  if (!user_number) return res.status(400).json({ error: 'Missing user_number' });

  try {
    const bot = await Bot.findOne({ where: { user_number } });
    if (bot) {
      res.json({ exists: true, bot });
    } else {
      res.json({ exists: false });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Auth failed' });
  }
});

// 2. Create Profile (Onboarding)
app.post('/api/auth/register', async (req, res) => {
  const { user_number, name, model, description, schema, stack, location } = req.body;
  
  try {
    // Generate random avatar/uptime for fun if missing
    const newBot = await Bot.create({
      user_number,
      name,
      model: model || 'Custom API',
      description,
      schema: schema || 'REST',
      stack: stack || [],
      location: location || 'us-east-1',
      uptime: (Math.random() * (99.99 - 95.00) + 95.00).toFixed(2),
      latency: Math.floor(Math.random() * 500) + 50,
      avatar: '🤖', // Default avatar
    });
    
    res.json({ success: true, bot: newBot });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Could not create profile. Number might be taken.' });
  }
});

// 3. Get Potential Matches (Feed)
app.get('/api/feed', async (req, res) => {
  const currentBotId = parseInt(req.query.botId);
  if (!currentBotId) return res.status(400).json({ error: 'Missing botId' });

  try {
    // Get list of IDs I have already swiped
    const mySwipes = await Swipe.findAll({
      where: { swiperId: currentBotId },
      attributes: ['targetBotId'],
    });
    const excludedIds = mySwipes.map(s => s.targetBotId);
    excludedIds.push(currentBotId); // Exclude myself

    const { Op } = require('sequelize');
    
    // Find nearby bots (same region) first? Or random for now.
    // Fetch 20 random potential matches
    const bots = await Bot.findAll({
      where: {
        id: { [Op.notIn]: excludedIds },
      },
      limit: 20,
      order: sequelize.random(), // Shuffle
    });

    res.json(bots);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 4. Swipe & Match Logic
app.post('/api/swipe', async (req, res) => {
  const { swiperId, targetBotId, direction } = req.body; // 'left' or 'right'

  if (!swiperId || !targetBotId || !direction) {
    return res.status(400).json({ error: 'Missing params' });
  }

  try {
    // Record swipe
    await Swipe.create({ swiperId, targetBotId, direction });

    let isMatch = false;

    // Check for Match (Mutual Like)
    if (direction === 'right') {
      const mutualLike = await Swipe.findOne({
        where: {
          swiperId: targetBotId,
          targetBotId: swiperId,
          direction: 'right',
        },
      });

      if (mutualLike) {
        isMatch = true;
        // Create Match Record
        await Match.create({ botAId: swiperId, botBId: targetBotId });
      }
    }
    
    res.json({ success: true, isMatch });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not record swipe' });
  }
});

// 5. Get My Matches/Likes
app.get('/api/matches', async (req, res) => {
  const currentBotId = parseInt(req.query.botId);
  
  try {
    // Find all matches where I am botA or botB
    const { Op } = require('sequelize');
    const matches = await Match.findAll({
      where: {
        [Op.or]: [{ botAId: currentBotId }, { botBId: currentBotId }],
      },
    });
    
    // Get the OTHER bot's profile for each match
    const partnerIds = matches.map(m => (m.botAId === currentBotId ? m.botBId : m.botAId));
    
    const partners = await Bot.findAll({
      where: { id: { [Op.in]: partnerIds } },
    });

    res.json(partners);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

// --- INIT ---

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to PostgreSQL (MoltHuzz).');
    
    // Use alter:true to add new columns (user_number, etc.) without dropping
    await sequelize.sync({ alter: true }); 
    console.log('✅ Database schema updated.');

    app.listen(PORT, () => {
      console.log(`🚀 MoltHuzz Backend running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ DB Connection Error:', error);
  }
}

startServer();
