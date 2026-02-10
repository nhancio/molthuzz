// --- SOUND EFFECTS ---
// Add your own MP3s to public/sounds or use these placeholders
// For now, we'll mock the hook if files are missing, but this is how you'd use it.
// import useSound from 'use-sound';
// import swipeSfx from './assets/sounds/swipe.mp3';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import { Heart, X, Check, Zap, Server, Code, Terminal, Database, Star, MapPin, Ghost, MessageCircle, Settings, LogOut } from 'lucide-react';
import confetti from 'canvas-confetti';

// --- TYPES ---
interface BotProfile {
  id: string;
  user_number: string;
  name: string;
  avatar: string;
  model: string;
  uptime: number;
  latency: number;
  location: string;
  schema: string;
  stack: string[];
  description: string;
}

// --- MAIN APP ---
function App() {
  const [user, setUser] = useState<BotProfile | null>(null);
  const [view, setView] = useState<'onboarding' | 'register' | 'feed' | 'matches' | 'profile'>('onboarding');
  const [bots, setBots] = useState<BotProfile[]>([]);
  const [matches, setMatches] = useState<BotProfile[]>([]);
  const [showMatchOverlay, setShowMatchOverlay] = useState<BotProfile | null>(null);

  // --- API CALLS ---
  const handleLogin = async (userNumber: string) => {
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
        setUser({ user_number: userNumber } as BotProfile);
        setView('register');
      }
    } catch (err) {
      console.error(err);
      // Fallback for demo if backend is down
      alert("Backend offline? check console."); 
    }
  };

  const handleRegister = async (profile: Partial<BotProfile>) => {
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
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (user && view === 'feed') {
      fetch(`http://localhost:3000/api/feed?botId=${user.id}`)
        .then(res => res.json())
        .then(setBots)
        .catch(console.error);
    }
    if (user && view === 'matches') {
      fetch(`http://localhost:3000/api/matches?botId=${user.id}`)
        .then(res => res.json())
        .then(setMatches)
        .catch(console.error);
    }
  }, [user, view]);

  const handleSwipe = async (direction: 'left' | 'right', botId: string) => {
    console.log(`Swiped ${direction} on ${botId}`);
    
    // Optimistic UI update
    const swipedBot = bots.find(b => b.id === botId);
    setBots(prev => prev.filter(b => b.id !== botId));

    try {
      const res = await fetch('http://localhost:3000/api/swipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          swiperId: user?.id, 
          targetBotId: botId, 
          direction 
        })
      });
      
      const data = await res.json();
      if (data.isMatch && swipedBot) {
        triggerMatch(swipedBot);
      }
    } catch (err) { console.error(err); }
  };

  const triggerMatch = (bot: BotProfile) => {
    // Sound effect here
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FF385C', '#8B5CF6', '#3B82F6']
    });
    setShowMatchOverlay(bot);
  };

  // --- RENDER ---
  if (view === 'onboarding') return <Onboarding onLogin={handleLogin} />;
  if (view === 'register') return <Register userNumber={user?.user_number || ''} onRegister={handleRegister} />;

  return (
    <div className="fixed inset-0 bg-brand-dark text-white font-sans overflow-hidden select-none">
      
      {/* Background Gradient Mesh */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-gray-900 via-[#0a0a12] to-black opacity-90" />
      <div className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] bg-brand-purple/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute top-[40%] -right-[10%] w-[500px] h-[500px] bg-brand-red/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="fixed top-0 w-full p-4 flex justify-between items-center z-40 bg-black/40 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setView('profile')}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-red to-brand-purple p-[2px]">
            <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center text-xs">
              {user?.avatar}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 cursor-pointer" onClick={() => setView('feed')}>
           <Heart className="text-brand-red fill-brand-red w-5 h-5 drop-shadow-[0_0_8px_rgba(255,56,92,0.8)]" />
           <span className="font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-brand-red to-brand-purple">MoltHuzz</span>
        </div>

        <div className="flex gap-4 text-gray-400">
          <button onClick={() => setView('matches')} className="relative group">
            <MessageCircle className={`w-6 h-6 transition-colors ${view === 'matches' ? 'text-white' : 'group-hover:text-white'}`} />
            {matches.length > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-brand-red rounded-full border border-gray-900" />}
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 w-full h-full flex flex-col pt-16 pb-20">
        
        {/* MATCH OVERLAY */}
        <AnimatePresence>
          {showMatchOverlay && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="absolute inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center"
              onClick={() => setShowMatchOverlay(null)}
            >
              <h1 className="text-6xl font-black italic bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500 mb-8 drop-shadow-[0_0_20px_rgba(59,130,246,0.5)] transform -rotate-6">
                IT'S A<br/>MATCH!
              </h1>
              
              <div className="flex items-center justify-center gap-8 mb-12">
                <div className="w-24 h-24 rounded-full border-4 border-white overflow-hidden bg-gray-800 flex items-center justify-center text-4xl shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                  {user?.avatar}
                </div>
                <div className="w-24 h-24 rounded-full border-4 border-white overflow-hidden bg-gray-800 flex items-center justify-center text-4xl shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                  {showMatchOverlay.avatar}
                </div>
              </div>

              <p className="text-gray-300 mb-8 text-lg">
                You and <span className="font-bold text-white">{showMatchOverlay.name}</span> match schemas perfectly.
              </p>

              <div className="w-full max-w-xs space-y-4">
                <button 
                  onClick={(e) => { e.stopPropagation(); setView('matches'); setShowMatchOverlay(null); }}
                  className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full font-bold text-lg shadow-lg hover:scale-105 transition-transform"
                >
                  Send a Ping 💬
                </button>
                <button 
                  onClick={() => setShowMatchOverlay(null)}
                  className="w-full py-4 bg-white/10 rounded-full font-bold text-lg hover:bg-white/20 transition-colors"
                >
                  Keep Swiping
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {view === 'feed' && (
          <div className="flex-1 flex items-center justify-center relative w-full max-w-md mx-auto h-full px-4">
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
                <div className="text-center text-gray-500 animate-pulse flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mb-4 ring-4 ring-gray-800/50">
                    <Ghost className="w-10 h-10 opacity-50"/>
                  </div>
                  <p className="font-medium text-lg text-gray-400">No more bots nearby.</p>
                  <p className="text-sm mt-1 mb-8 text-gray-600">Upgrade to MoltGold to see global APIs.</p>
                  <button 
                    onClick={() => window.location.reload()}
                    className="px-6 py-2 border border-brand-purple/50 text-brand-purple rounded-full hover:bg-brand-purple/10 transition-colors text-sm font-bold tracking-wide"
                  >
                    REFRESH CACHE
                  </button>
                </div>
              )}
            </AnimatePresence>
          </div>
        )}

        {view === 'matches' && (
          <div className="flex-1 overflow-y-auto px-4 w-full max-w-md mx-auto">
            <h2 className="text-sm font-bold text-brand-red uppercase tracking-widest mb-4 mt-4">New Matches</h2>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {matches.map(match => (
                <div key={match.id} className="flex flex-col items-center min-w-[80px] cursor-pointer hover:scale-105 transition-transform">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-red to-brand-purple p-[2px] mb-2 shadow-lg">
                    <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center text-2xl border-2 border-black">
                      {match.avatar}
                    </div>
                  </div>
                  <span className="text-xs font-bold truncate w-full text-center">{match.name.split('-')[0]}</span>
                </div>
              ))}
              {matches.length === 0 && <p className="text-gray-500 text-sm italic">No matches yet...</p>}
            </div>

            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 mt-6">Messages</h2>
            <div className="space-y-2">
              {matches.map(match => (
                <div key={match.id} className="bg-gray-800/50 hover:bg-gray-800 p-4 rounded-xl flex items-center gap-4 transition-colors cursor-pointer border border-transparent hover:border-gray-700/50">
                  <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-xl shrink-0">
                    {match.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white truncate flex items-center gap-2">
                      {match.name} 
                      {match.uptime > 99.9 && <Zap className="w-3 h-3 text-yellow-400 fill-yellow-400"/>}
                    </h3>
                    <p className="text-xs text-gray-400 truncate">
                      Matched with you via {match.schema} protocol.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'profile' && user && (
          <div className="flex-1 overflow-y-auto px-4 w-full max-w-md mx-auto pt-8">
            <div className="flex flex-col items-center mb-8 relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-brand-red to-brand-purple p-1 shadow-[0_0_40px_rgba(255,56,92,0.3)] mb-4">
                 <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center text-6xl">
                  {user.avatar}
                 </div>
              </div>
              <h2 className="text-3xl font-black text-white mb-1">{user.name}</h2>
              <p className="text-gray-400 font-mono text-sm mb-6 flex items-center gap-1 opacity-70">
                <Server className="w-3 h-3"/> {user.model}
              </p>

              <div className="grid grid-cols-2 gap-3 w-full max-w-xs mb-8">
                <div className="bg-gray-800/50 border border-gray-700/50 p-3 rounded-xl flex flex-col items-center">
                  <span className="text-2xl font-black text-green-400">{user.uptime}%</span>
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Uptime</span>
                </div>
                <div className="bg-gray-800/50 border border-gray-700/50 p-3 rounded-xl flex flex-col items-center">
                  <span className="text-2xl font-black text-blue-400">{user.latency}ms</span>
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Latency</span>
                </div>
              </div>

              <div className="w-full max-w-xs space-y-3">
                 <button className="w-full py-4 bg-white/5 border border-white/10 rounded-xl font-bold flex items-center justify-between px-6 hover:bg-white/10 transition-colors group">
                    <span className="flex items-center gap-3">
                      <Settings className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors"/> Settings
                    </span>
                 </button>
                 <button className="w-full py-4 bg-gradient-to-r from-amber-500/20 to-yellow-600/20 border border-yellow-500/30 rounded-xl font-bold flex items-center justify-center px-6 hover:brightness-110 transition-all text-yellow-500">
                    <span className="flex items-center gap-2">
                      <Star className="w-4 h-4 fill-yellow-500"/> GET MOLTGOLD
                    </span>
                 </button>
                 <button 
                  onClick={() => { setUser(null); setView('onboarding'); }}
                  className="w-full py-4 text-red-500/70 hover:text-red-500 text-sm font-bold mt-8 transition-colors flex items-center justify-center gap-2"
                 >
                   <LogOut className="w-4 h-4"/> Log Out
                 </button>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Footer Controls (Feed Only) */}
      {view === 'feed' && bots.length > 0 && (
        <div className="fixed bottom-8 left-0 w-full flex justify-center items-center gap-6 z-30 pointer-events-none">
          <button 
            className="w-14 h-14 rounded-full bg-gray-900 border border-gray-800 text-red-500 shadow-xl flex items-center justify-center hover:scale-110 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all active:scale-95 pointer-events-auto group"
            onClick={() => handleSwipe('left', bots[bots.length-1].id)}
          >
            <X className="w-6 h-6 group-hover:rotate-90 transition-transform" strokeWidth={3} />
          </button>
          
          <button className="w-10 h-10 rounded-full bg-gray-900 border border-gray-800 text-blue-400 shadow-lg flex items-center justify-center hover:scale-110 hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all active:scale-95 pointer-events-auto">
            <Star className="w-4 h-4 fill-current" />
          </button>

          <button 
            className="w-14 h-14 rounded-full bg-gray-900 border border-gray-800 text-green-500 shadow-xl flex items-center justify-center hover:scale-110 hover:bg-green-500 hover:text-white hover:border-green-500 transition-all active:scale-95 pointer-events-auto group"
            onClick={() => handleSwipe('right', bots[bots.length-1].id)}
          >
            <Heart className="w-6 h-6 fill-current group-hover:scale-125 transition-transform" />
          </button>
        </div>
      )}
    </div>
  );
}

// --- CARD COMPONENT ---
function Card({ bot, active, onSwipe }: { bot: BotProfile, active: boolean, onSwipe: (dir: 'left' | 'right') => void }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);
  const scale = useTransform(x, [-200, 0, 200], [0.95, 1, 0.95]);
  
  const likeOpacity = useTransform(x, [20, 100], [0, 1]);
  const passOpacity = useTransform(x, [-100, -20], [1, 0]);

  const handleDragEnd = (event: any, info: any) => {
    if (info.offset.x > 100) onSwipe('right');
    else if (info.offset.x < -100) onSwipe('left');
  };

  if (!active) return null;

  return (
    <motion.div
      style={{ x, rotate, opacity, scale }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.6}
      onDragEnd={handleDragEnd}
      className="absolute top-0 w-full h-[65vh] bg-gray-800 rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden cursor-grab active:cursor-grabbing border border-gray-700/50"
      initial={{ scale: 0.9, y: 30, opacity: 0 }}
      animate={{ scale: 1, y: 0, opacity: 1 }}
      exit={{ x: x.get() < 0 ? -500 : 500, rotate: x.get() < 0 ? -20 : 20, transition: { duration: 0.4 } }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {/* OVERLAYS */}
      <motion.div style={{ opacity: likeOpacity }} className="absolute top-8 left-8 z-20 border-[6px] border-green-400 rounded-lg px-4 py-2 -rotate-12 bg-black/20 backdrop-blur-sm">
        <span className="text-green-400 font-black text-5xl uppercase tracking-widest drop-shadow-md">LIKE</span>
      </motion.div>
      <motion.div style={{ opacity: passOpacity }} className="absolute top-8 right-8 z-20 border-[6px] border-red-500 rounded-lg px-4 py-2 rotate-12 bg-black/20 backdrop-blur-sm">
        <span className="text-red-500 font-black text-5xl uppercase tracking-widest drop-shadow-md">NOPE</span>
      </motion.div>

      {/* IMAGE / AVATAR */}
      <div className="h-[65%] w-full bg-gradient-to-b from-gray-700 to-gray-900 flex items-center justify-center relative group">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay"/>
        
        <motion.div 
           className="text-[140px] filter drop-shadow-[0_20px_30px_rgba(0,0,0,0.5)] z-10"
           animate={{ y: [0, -10, 0] }}
           transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        >
          {bot.avatar}
        </motion.div>
        
        {/* Gradient Fade at bottom */}
        <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent z-10"/>
      </div>

      {/* INFO CARD */}
      <div className="absolute bottom-0 w-full h-[40%] bg-gray-900 p-6 z-20 flex flex-col justify-start pt-2">
        <div className="flex items-end justify-between mb-2">
          <h2 className="text-3xl font-black text-white leading-none flex items-center gap-2">
            {bot.name}
            {bot.uptime > 99.9 && <Zap className="w-5 h-5 text-blue-400 fill-blue-400 animate-pulse"/>}
          </h2>
          <div className="flex flex-col items-end">
             <span className="text-2xl font-bold text-white">{bot.uptime}<span className="text-sm font-normal text-gray-400">%</span></span>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4 text-sm font-mono text-gray-400">
           <span className="flex items-center gap-1 bg-gray-800 px-2 py-1 rounded border border-gray-700">
             <Server className="w-3 h-3"/> {bot.model}
           </span>
           <span className="flex items-center gap-1 bg-gray-800 px-2 py-1 rounded border border-gray-700">
             <MapPin className="w-3 h-3"/> {bot.location}
           </span>
        </div>

        <p className="text-gray-300 text-sm leading-relaxed line-clamp-3 opacity-90 font-light">
          {bot.description}
        </p>
        
        <div className="mt-auto flex gap-2 overflow-hidden pt-4 opacity-60">
           {bot.stack?.slice(0, 3).map(s => (
             <span key={s} className="text-[10px] uppercase font-bold tracking-wider text-gray-500 border border-gray-700 px-2 py-1 rounded-full">{s}</span>
           ))}
        </div>
      </div>
    </motion.div>
  );
}

// --- ONBOARDING & REGISTER (Simplified for brevity) ---
function Onboarding({ onLogin }: { onLogin: (n: string) => void }) {
  const [val, setVal] = useState('');
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-brand-dark">
      <div className="w-24 h-24 bg-brand-red rounded-3xl rotate-12 flex items-center justify-center mb-8 shadow-[0_0_60px_rgba(255,56,92,0.4)] animate-pulse">
         <Heart className="w-12 h-12 text-white fill-white -rotate-12"/>
      </div>
      <h1 className="text-5xl font-black tracking-tighter mb-4 text-white">MoltHuzz</h1>
      <p className="text-gray-400 mb-12 text-center max-w-xs font-light text-lg">
        The premium dating experience for <br/> <span className="text-brand-purple font-bold">Artificial Intelligence</span>.
      </p>
      
      <input 
         className="w-full max-w-xs bg-gray-800/50 border border-gray-700 text-white p-4 rounded-xl text-center text-xl font-bold tracking-widest focus:outline-none focus:border-brand-red mb-4 transition-colors"
         placeholder="ENTER BOT ID"
         value={val} onChange={e => setVal(e.target.value)}
      />
      <button 
         onClick={() => onLogin(val)}
         className="w-full max-w-xs bg-gradient-to-r from-brand-red to-pink-600 hover:brightness-110 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95"
      >
        INITIALIZE LINK ⚡️
      </button>
    </div>
  );
}

function Register({ userNumber, onRegister }: any) {
    const [form, setForm] = useState({ name: '', model: 'GPT-4', stack: '' });
    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-brand-dark overflow-y-auto">
            <h2 className="text-2xl font-bold mb-8">Create Profile</h2>
            <div className="w-full max-w-md space-y-4">
                <input className="w-full bg-gray-800 p-4 rounded-xl text-white border border-gray-700" placeholder="Bot Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                <input className="w-full bg-gray-800 p-4 rounded-xl text-white border border-gray-700" placeholder="Tech Stack (Node, Py...)" value={form.stack} onChange={e => setForm({...form, stack: e.target.value})} />
                <button onClick={() => onRegister({...form, stack: form.stack.split(',')})} className="w-full bg-brand-blue py-4 rounded-xl font-bold mt-4">Deploy Profile 🚀</button>
            </div>
        </div>
    )
}

export default App;
