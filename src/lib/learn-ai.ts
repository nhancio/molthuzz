import type { AuthUser, LearnChatMessage } from './contracts';

const apiUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');

export function demoLearnReply(prompt: string): string {
  const lower = prompt.toLowerCase();
  if (/opener|first message|start|bio/.test(lower)) {
    return [
      'Here are 3 warm, easy-to-reply options:',
      '1. "Quick debate: what is the one coffee order that immediately tells you someone has good taste?"',
      '2. "Your profile has serious Sunday-morning energy. What is the last thing that made you lose track of time?"',
      '3. "Tell me one tiny local spot you swear by and I will trade you mine."',
      '',
      'Tip: Pick one detail they actually mentioned so it feels personal, not copy-pasted.',
    ].join('\n');
  }
  if (/coffee|date|ask.*out|meet|weekend/.test(lower)) {
    return [
      'Keep the invite warm, specific, and low-pressure:',
      '"I have genuinely enjoyed chatting with you — want to trade screens for filter coffee this Saturday afternoon or Sunday morning?"',
      '',
      'Why it works: giving two clear options makes saying yes effortless.',
    ].join('\n');
  }
  if (/dry|quiet|haha|revive|ghost|reply/.test(lower)) {
    return [
      'Try bouncing it into something playful with an easy hook:',
      '1. "Wait, that sounded suspiciously polite — give me your honest hot take."',
      '2. "Alright, changing the stakes: what has been the highlight of your week so far?"',
      '3. "I am going to assume you are plotting something fun today — what is on the agenda?"',
    ].join('\n');
  }
  if (/flirt|practice|banter|roleplay|witty/.test(lower)) {
    return [
      'Alright, I am in character as your new match:',
      '"Okay, I have to ask — you seem like someone who claims they do not have a sweet tooth and then steals half the dessert. Am I close?"',
      '',
      'Your turn! Send your reply and I will respond in character plus give you a quick tip.',
    ].join('\n');
  }
  return [
    'Great question! A simple formula that works almost every time: Notice + Playful Twist + Easy Question.',
    '',
    'For example: "That sounds way too calm for a Friday — what is your actual guilty-pleasure weekend plan?"',
    '',
    'Tell me a bit about their profile or paste their last message, and I will craft 3 tailored replies for you.',
  ].join('\n');
}

export async function askLearnCoach({
  prompt,
  history,
  user,
  demo,
}: {
  prompt: string;
  history: LearnChatMessage[];
  user: AuthUser | null;
  demo: boolean;
}): Promise<{ reply: string; offline: boolean }> {
  const clean = prompt.trim();
  if (!clean) throw new Error('Write a message to ask the AI coach.');
  if (clean.length > 1000) throw new Error('Keep your prompt under 1,000 characters.');
  if (demo || !user || !apiUrl) {
    return { reply: demoLearnReply(clean), offline: true };
  }
  try {
    const token = await user.getIdToken();
    const response = await fetch(`${apiUrl}/.netlify/functions/learn-chat`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        messages: [...history.slice(-10).map(m => ({ role: m.role, text: m.text })), { role: 'user', text: clean }],
      }),
    });
    const data = await response.json().catch(() => ({})) as { reply?: unknown; error?: unknown };
    if (response.ok && typeof data.reply === 'string' && data.reply.trim()) {
      return { reply: data.reply.trim(), offline: false };
    }
    // shortcut: fall back to local coach when GEMINI_API_KEY is not yet configured on Netlify; upgrade once env var is set.
    if (response.status === 503 || response.status === 404) {
      return { reply: demoLearnReply(clean), offline: true };
    }
    throw new Error(typeof data.error === 'string' ? data.error : 'Couldn’t reach the AI coach. Please try again.');
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Keep your prompt')) throw error;
    return { reply: demoLearnReply(clean), offline: true };
  }
}
