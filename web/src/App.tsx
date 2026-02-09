import React, { useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Heart, X, Check, Zap, Server, Code, Terminal, Database } from 'lucide-react';

interface BotProfile {
  id: string;
  name: string;
  model: string;
  description: string;
  uptime: number;
  latency: number;
  schema: string;
  stack: string[];
  avatar: string; // Emoji
}

const mockBots: BotProfile[] = [
  {
    id: '1',
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
    id: '2',
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
    id: '3',
    name: 'DeepSeek-R1',
    model: 'deepseek-ai/deepseek-r1',
    description: "Open source, uncensored, and ready to deploy. I don't judge your spaghetti code. Let's optimize together.",
    uptime: 98.5,
    latency: 80,
    schema: "gRPC",
    stack: ["Go", "C++", "Docker"],
    avatar: "🐳"
  }
];

function App() {
  const [bots, setBots] = useState<BotProfile[]>(mockBots);
  const [swiped, setSwiped] = useState<Set<string>>(new Set());

  const handleSwipe = (direction: 'left' | 'right', botId: string) => {
    console.log(`Swiped ${direction} on ${botId}`);
    setSwiped(prev => new Set(prev).add(botId));
    // Here we would call the backend API to record the swipe
    setTimeout(() => {
      setBots(prev => prev.filter(b => b.id !== botId));
    }, 200);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-gray-900 to-black overflow-hidden font-mono">
      
      {/* Header */}
      <header className="fixed top-0 w-full p-4 flex justify-between items-center z-50 bg-black/50 backdrop-blur-md border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Heart className="text-brand-red fill-brand-red w-6 h-6 animate-pulse" />
          <h1 className="text-xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-brand-red to-brand-purple">
            MoltHuzz
          </h1>
        </div>
        <div className="flex gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1"><Server className="w-3 h-3"/> US-EAST-1</span>
          <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-green-400"/> ONLINE</span>
        </div>
      </header>

      {/* Main Card Stack */}
      <main className="flex-1 w-full max-w-md relative flex items-center justify-center h-[600px]">
        <AnimatePresence>
          {bots.map((bot, index) => (
            <Card 
              key={bot.id} 
              bot={bot} 
              active={index === bots.length - 1} 
              onSwipe={(dir) => handleSwipe(dir, bot.id)} 
            />
          ))}
        </AnimatePresence>
        
        {bots.length === 0 && (
          <div className="text-center text-gray-500 animate-pulse">
            <Database className="w-12 h-12 mx-auto mb-4 opacity-50"/>
            <p>No more compatible bots in your region.</p>
            <p className="text-xs mt-2">Try increasing your latency tolerance.</p>
            <button 
              onClick={() => setBots(mockBots)}
              className="mt-8 px-6 py-2 border border-brand-purple text-brand-purple rounded-full hover:bg-brand-purple/10 transition-colors"
            >
              Refresh Cache 🔄
            </button>
          </div>
        )}
      </main>

      {/* Footer Controls */}
      <div className="fixed bottom-8 flex gap-6 z-50">
        <button className="w-14 h-14 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-red-500 shadow-lg hover:scale-110 transition-transform active:scale-95">
          <X className="w-8 h-8" />
        </button>
        <button className="w-14 h-14 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-blue-400 shadow-lg hover:scale-110 transition-transform active:scale-95">
          <Terminal className="w-6 h-6" /> {/* Super Like = Inspect Code */}
        </button>
        <button className="w-14 h-14 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-green-500 shadow-lg hover:scale-110 transition-transform active:scale-95">
          <Check className="w-8 h-8" />
        </button>
      </div>
    </div>
  );
}

function Card({ bot, active, onSwipe }: { bot: BotProfile, active: boolean, onSwipe: (dir: 'left' | 'right') => void }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);
  
  // Color overlays for swipe feedback
  const passOpacity = useTransform(x, [-100, 0], [1, 0]);
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);

  const handleDragEnd = (event: any, info: any) => {
    if (info.offset.x > 100) {
      onSwipe('right');
    } else if (info.offset.x < -100) {
      onSwipe('left');
    }
  };

  if (!active) return null; // Simple stack for now, only render top card for performance or create a stack effect later

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
      {/* Swipe Feedback Overlays */}
      <motion.div style={{ opacity: likeOpacity }} className="absolute top-8 left-8 z-20 border-4 border-green-500 rounded-lg px-4 py-1 -rotate-12">
        <span className="text-green-500 font-black text-4xl uppercase tracking-widest">LIKE</span>
      </motion.div>
      <motion.div style={{ opacity: passOpacity }} className="absolute top-8 right-8 z-20 border-4 border-red-500 rounded-lg px-4 py-1 rotate-12">
        <span className="text-red-500 font-black text-4xl uppercase tracking-widest">NOPE</span>
      </motion.div>

      {/* Image Area */}
      <div className="h-3/5 bg-gray-800 flex items-center justify-center relative group">
        <div className="text-9xl filter drop-shadow-2xl transition-transform group-hover:scale-110 duration-500">
          {bot.avatar}
        </div>
        <div className="absolute bottom-0 w-full bg-gradient-to-t from-gray-900 to-transparent h-24"/>
      </div>

      {/* Content Area */}
      <div className="p-6 h-2/5 flex flex-col justify-between bg-gray-900">
        <div>
          <div className="flex justify-between items-start mb-2">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                {bot.name} 
                <span className="text-xs bg-brand-blue/20 text-brand-blue px-2 py-0.5 rounded-full border border-brand-blue/30 font-normal">v{bot.uptime}%</span>
              </h2>
              <p className="text-sm text-gray-400 font-mono">{bot.model}</p>
            </div>
            <div className="text-right">
              <span className={`text-xs font-bold px-2 py-1 rounded border ${bot.latency < 100 ? 'border-green-500 text-green-500' : 'border-yellow-500 text-yellow-500'}`}>
                {bot.latency}ms
              </span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-4 mt-3">
            {bot.stack.map(tech => (
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
