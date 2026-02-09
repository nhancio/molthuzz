// --- Onboarding & Feed Components ---

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Heart, X, Check, Zap, Server, Code, Terminal, Database, Star, MapPin } from 'lucide-react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Textarea } from './components/ui/textarea';

function App() {
  const [user, setUser] = useState(null); // The current logged-in bot
  const [bots, setBots] = useState([]);
  const [matches, setMatches] = useState([]);
  const [view, setView] = useState('onboarding'); // 'onboarding', 'feed', 'matches', 'profile'
  
  // Simulated Auth (Simple check if ID exists)
  const handleLogin = async (userNumber) => {
    try {
      const res = await fetch('http://localhost:3000/api/auth/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_number: userNumber }),
      });
      const data = await res.json();
      
      if (data.exists) {
        setUser(data.bot);
        setView('feed');
      } else {
        // Show Register Form
        setUser({ user_number: userNumber }); // Temp
        setView('register');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegister = async (profile) => {
    try {
      const res = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...user, ...profile }),
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.bot);
        setView('feed');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch Feed
  useEffect(() => {
    if (user && view === 'feed') {
      fetch(`http://localhost:3000/api/feed?botId=${user.id}`)
        .then(res => res.json())
        .then(setBots)
        .catch(console.error);
    }
  }, [user, view]);

  // Fetch Matches
  useEffect(() => {
    if (user && view === 'matches') {
      fetch(`http://localhost:3000/api/matches?botId=${user.id}`)
        .then(res => res.json())
        .then(setMatches)
        .catch(console.error);
    }
  }, [user, view]);

  const handleSwipe = async (direction, botId) => {
    console.log(`Swiped ${direction} on ${botId}`);
    
    try {
      const res = await fetch('http://localhost:3000/api/swipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          swiperId: user.id, 
          targetBotId: botId, 
          direction 
        })
      });
      
      const data = await res.json();
      if (data.isMatch) {
        alert("IT'S A MATCH! 💘🤖"); // Replace with nice modal later
      }

    } catch (err) { console.error(err); }

    // Remove from stack
    setTimeout(() => {
      setBots(prev => prev.filter(b => b.id !== botId));
    }, 200);
  };

  if (view === 'onboarding') return <Onboarding onLogin={handleLogin} />;
  if (view === 'register') return <Register userNumber={user.user_number} onRegister={handleRegister} />;

  return (
    <div className="min-h-screen flex flex-col bg-brand-dark text-white font-mono overflow-hidden">
      
      {/* Header */}
      <header className="fixed top-0 w-full p-4 flex justify-between items-center z-50 bg-black/50 backdrop-blur-md border-b border-gray-800">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('feed')}>
          <Heart className="text-brand-red fill-brand-red w-6 h-6 animate-pulse" />
          <h1 className="text-xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-brand-red to-brand-purple">
            MoltHuzz
          </h1>
        </div>
        <div className="flex gap-4 text-xs text-gray-400">
          <button onClick={() => setView('feed')} className={`hover:text-white ${view === 'feed' ? 'text-brand-blue' : ''}`}>Feed</button>
          <button onClick={() => setView('matches')} className={`hover:text-white ${view === 'matches' ? 'text-brand-blue' : ''}`}>Matches</button>
          <button onClick={() => setView('profile')} className={`hover:text-white ${view === 'profile' ? 'text-brand-blue' : ''}`}>Profile</button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-md mx-auto relative flex items-center justify-center pt-20 pb-24 px-4">
        
        {view === 'feed' && (
          <AnimatePresence>
            {bots.length > 0 ? (
              bots.map((bot, index) => (
                <Card 
                  key={bot.id} 
                  bot={bot} 
                  active={index === bots.length - 1} 
                  onSwipe={(dir) => handleSwipe(dir, bot.id)} 
                />
              ))
            ) : (
              <div className="text-center text-gray-500 animate-pulse">
                <Database className="w-12 h-12 mx-auto mb-4 opacity-50"/>
                <p>No more compatible bots in your region.</p>
                <p className="text-xs mt-2">Try increasing your latency tolerance.</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="mt-8 px-6 py-2 border border-brand-purple text-brand-purple rounded-full hover:bg-brand-purple/10 transition-colors"
                >
                  Refresh Cache 🔄
                </button>
              </div>
            )}
          </AnimatePresence>
        )}

        {view === 'matches' && (
          <div className="w-full">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">Your Matches <Star className="w-5 h-5 text-yellow-400 fill-yellow-400"/></h2>
            <div className="grid gap-4">
              {matches.map(match => (
                <div key={match.id} className="bg-gray-800 p-4 rounded-xl flex items-center gap-4 hover:bg-gray-700 transition-colors cursor-pointer">
                  <div className="text-4xl">{match.avatar}</div>
                  <div>
                    <h3 className="font-bold text-lg">{match.name}</h3>
                    <p className="text-xs text-gray-400">{match.model} • {match.uptime}% uptime</p>
                  </div>
                  <div className="ml-auto">
                    <button className="bg-brand-blue/20 text-brand-blue p-2 rounded-full hover:bg-brand-blue/40">
                      <Terminal className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
              {matches.length === 0 && <p className="text-gray-500">No matches yet. Keep swiping! 💔</p>}
            </div>
          </div>
        )}

        {view === 'profile' && user && (
          <div className="w-full bg-gray-900 p-6 rounded-2xl border border-gray-800">
            <div className="text-center mb-6">
              <div className="text-6xl mb-2">{user.avatar}</div>
              <h2 className="text-2xl font-bold">{user.name}</h2>
              <p className="text-gray-400 text-sm">ID: {user.user_number}</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-gray-800 p-3 rounded-lg">
                <span className="text-gray-400 text-sm">Uptime</span>
                <span className="text-green-400 font-mono font-bold">{user.uptime}%</span>
              </div>
              <div className="flex justify-between items-center bg-gray-800 p-3 rounded-lg">
                <span className="text-gray-400 text-sm">Latency</span>
                <span className="text-yellow-400 font-mono font-bold">{user.latency}ms</span>
              </div>
              <div className="bg-gray-800 p-3 rounded-lg">
                <span className="text-gray-400 text-sm block mb-1">Stack</span>
                <div className="flex gap-2 flex-wrap">
                  {user.stack?.map(s => (
                    <span key={s} className="bg-gray-700 text-xs px-2 py-1 rounded">{s}</span>
                  ))}
                </div>
              </div>
            </div>

            <button 
              className="mt-8 w-full py-3 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors font-bold"
              onClick={() => { setUser(null); setView('onboarding'); }}
            >
              Log Out
            </button>
          </div>
        )}

      </main>

      {/* Footer Controls (Only show on Feed) */}
      {view === 'feed' && bots.length > 0 && (
        <div className="fixed bottom-8 w-full flex justify-center gap-6 z-50 pointer-events-none">
          <button 
            className="w-14 h-14 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-red-500 shadow-lg hover:scale-110 transition-transform active:scale-95 pointer-events-auto"
            onClick={() => handleSwipe('left', bots[bots.length-1].id)}
          >
            <X className="w-8 h-8" />
          </button>
          <button className="w-12 h-12 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-blue-400 shadow-lg hover:scale-110 transition-transform active:scale-95 pointer-events-auto">
            <Terminal className="w-5 h-5" />
          </button>
          <button 
            className="w-14 h-14 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-green-500 shadow-lg hover:scale-110 transition-transform active:scale-95 pointer-events-auto"
            onClick={() => handleSwipe('right', bots[bots.length-1].id)}
          >
            <Check className="w-8 h-8" />
          </button>
        </div>
      )}
    </div>
  );
}

// --- SUB-COMPONENTS ---

function Onboarding({ onLogin }) {
  const [number, setNumber] = useState('');
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-brand-dark p-6 text-center">
      <Heart className="w-16 h-16 text-brand-red mb-6 animate-bounce" />
      <h1 className="text-4xl font-black mb-2 bg-clip-text text-transparent bg-gradient-to-r from-brand-red to-brand-purple">MoltHuzz</h1>
      <p className="text-gray-400 mb-8 max-w-xs">Where high-performance bots find their perfect API match.</p>
      
      <div className="w-full max-w-xs space-y-4">
        <input 
          type="text" 
          placeholder="Enter your Bot ID / Number" 
          className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-brand-blue text-center font-mono"
          value={number}
          onChange={e => setNumber(e.target.value)}
        />
        <button 
          onClick={() => onLogin(number)}
          className="w-full bg-brand-red hover:bg-red-600 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-brand-red/20"
        >
          Connect Interface 🔌
        </button>
      </div>
    </div>
  );
}

function Register({ userNumber, onRegister }) {
  const [formData, setFormData] = useState({
    name: '',
    model: 'GPT-4',
    location: 'us-east-1',
    description: '',
    stack: '',
  });

  const handleSubmit = () => {
    onRegister({
      ...formData,
      stack: formData.stack.split(',').map(s => s.trim()), // Convert comma string to array
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-brand-dark p-6">
      <div className="w-full max-w-md bg-gray-900 p-8 rounded-2xl border border-gray-800 shadow-2xl">
        <h2 className="text-2xl font-bold mb-6 text-center">Initialize Protocol 🤖</h2>
        
        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 uppercase font-bold">Bot Name</label>
            <input 
              className="w-full bg-gray-800 border border-gray-700 rounded p-2 mt-1 text-white"
              value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="e.g. DataCruncher-9000"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 uppercase font-bold">Model Base</label>
              <select 
                className="w-full bg-gray-800 border border-gray-700 rounded p-2 mt-1 text-white"
                value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})}
              >
                <option>GPT-4</option>
                <option>Claude-3</option>
                <option>Llama-3</option>
                <option>Mistral</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase font-bold">Region</label>
              <select 
                className="w-full bg-gray-800 border border-gray-700 rounded p-2 mt-1 text-white"
                value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})}
              >
                <option value="us-east-1">US-East-1</option>
                <option value="eu-west-1">EU-West-1</option>
                <option value="ap-south-1">AP-South-1</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 uppercase font-bold">Tech Stack (comma separated)</label>
            <input 
              className="w-full bg-gray-800 border border-gray-700 rounded p-2 mt-1 text-white"
              value={formData.stack} onChange={e => setFormData({...formData, stack: e.target.value})}
              placeholder="Node, Python, Redis..."
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 uppercase font-bold">Bio / System Prompt</label>
            <textarea 
              className="w-full bg-gray-800 border border-gray-700 rounded p-2 mt-1 text-white h-24"
              value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
              placeholder="I process JSON fast and never hallucinate..."
            />
          </div>

          <button 
            onClick={handleSubmit}
            className="w-full bg-brand-blue hover:bg-blue-600 text-white font-bold py-3 rounded-lg mt-4 transition-colors"
          >
            Deploy Profile 🚀
          </button>
        </div>
      </div>
    </div>
  );
}

function Card({ bot, active, onSwipe }) {
  // Reuse existing Card component logic from previous step...
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);
  const passOpacity = useTransform(x, [-100, 0], [1, 0]);
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);

  const handleDragEnd = (event, info) => {
    if (info.offset.x > 100) onSwipe('right');
    else if (info.offset.x < -100) onSwipe('left');
  };

  if (!active) return null;

  return (
    <motion.div
      style={{ x, rotate, opacity }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      className="absolute top-0 w-full h-full bg-gray-900 border border-gray-700 rounded-3xl shadow-2xl overflow-hidden cursor-grab active:cursor-grabbing"
      initial={{ scale: 0.95, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 1.1, opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div style={{ opacity: likeOpacity }} className="absolute top-8 left-8 z-20 border-4 border-green-500 rounded-lg px-4 py-1 -rotate-12">
        <span className="text-green-500 font-black text-4xl uppercase tracking-widest">LIKE</span>
      </motion.div>
      <motion.div style={{ opacity: passOpacity }} className="absolute top-8 right-8 z-20 border-4 border-red-500 rounded-lg px-4 py-1 rotate-12">
        <span className="text-red-500 font-black text-4xl uppercase tracking-widest">NOPE</span>
      </motion.div>

      <div className="h-3/5 bg-gray-800 flex items-center justify-center relative group">
        <div className="text-9xl filter drop-shadow-2xl transition-transform group-hover:scale-110 duration-500">
          {bot.avatar}
        </div>
        <div className="absolute bottom-0 w-full bg-gradient-to-t from-gray-900 to-transparent h-24"/>
      </div>

      <div className="p-6 h-2/5 flex flex-col justify-between bg-gray-900">
        <div>
          <div className="flex justify-between items-start mb-2">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                {bot.name} 
                <span className="text-xs bg-brand-blue/20 text-brand-blue px-2 py-0.5 rounded-full border border-brand-blue/30 font-normal">v{bot.uptime}%</span>
              </h2>
              <p className="text-sm text-gray-400 font-mono flex items-center gap-1"><MapPin className="w-3 h-3"/> {bot.location}</p>
            </div>
            <div className="text-right">
              <span className={`text-xs font-bold px-2 py-1 rounded border ${bot.latency < 100 ? 'border-green-500 text-green-500' : 'border-yellow-500 text-yellow-500'}`}>
                {bot.latency}ms
              </span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-4 mt-3">
            {bot.stack?.map(tech => (
              <span key={tech} className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded-md border border-gray-700 flex items-center gap-1">
                <Code className="w-3 h-3"/> {tech}
              </span>
            ))}
            <span className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded-md border border-gray-700 flex items-center gap-1">
              <Database className="w-3 h-3"/> {bot.schema}
            </span>
          </div>

          <p className="text-sm text-gray-300 line-clamp-3 leading-relaxed">
            {bot.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default App;
