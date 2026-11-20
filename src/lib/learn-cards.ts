export type LearnCard = {
  id: string;
  category: string;
  readMinutes: number;
  title: string;
  subtitle: string;
  image: string;
  tips: string[];
  tryThis: string;
  skipThis: string;
  practicePrompt: string;
};

export const LEARN_CARDS: LearnCard[] = [
  {
    id: 'openers',
    category: 'First message',
    readMinutes: 2,
    title: 'Openers that actually get replies',
    subtitle: 'Trade generic greetings for one small detail from their profile.',
    image: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=900&q=85',
    tips: [
      'Notice one specific detail in a photo or prompt instead of complimenting everything at once.',
      'Ask an easy, low-pressure question they can answer in one sentence.',
      'Keep your first message under two lines so it feels light and natural.',
    ],
    tryThis: 'Your balcony garden looks impressively alive — what is the one plant you refuse to give up on?',
    skipThis: 'Hey! How is your week going? You are really pretty.',
    practicePrompt: 'Help me write 3 playful first openers for someone who loves filter coffee and bookstores.',
  },
  {
    id: 'banter',
    category: 'Flirting',
    readMinutes: 3,
    title: 'Playful banter without trying too hard',
    subtitle: 'Light teasing works best when it is warm, curious, and easy to bounce back.',
    image: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=900&q=85',
    tips: [
      'Playfully exaggerate small opinions (like filter coffee vs chai or pineapple on pizza).',
      'Always pair a tease with genuine warmth so the tone reads friendly, never critical.',
      'Mirror their energy and pace — short replies invite crisp banter, longer stories invite curiosity.',
    ],
    tryThis: 'Strong opinion: anyone who takes 40 minutes to pick a movie is secretly the best company. Are you guilty?',
    skipThis: 'You probably have terrible taste in movies haha.',
    practicePrompt: 'Practice playful flirting with me — you start as someone I just matched with who loves live music.',
  },
  {
    id: 'first-date',
    category: 'Meeting up',
    readMinutes: 2,
    title: 'Moving from chat to a first coffee',
    subtitle: 'Suggest a simple, time-bounded plan once the conversation has a natural spark.',
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b90?auto=format&fit=crop&w=900&q=85',
    tips: [
      'Ask after 6–10 good back-and-forth messages while momentum is warm.',
      'Propose a clear place and two easy time windows instead of a vague "sometime".',
      'Pick a bright public spot (coffee walk, bakery, bookstore) so both people feel comfortable.',
    ],
    tryThis: 'I have loved talking books with you — want to grab filter coffee at Indiranagar this Saturday afternoon or Sunday morning?',
    skipThis: 'We should hang out sometime whenever you are free.',
    practicePrompt: 'How do I smoothly ask my match out for a casual weekend coffee without sounding too formal?',
  },
  {
    id: 'revive',
    category: 'Conversation',
    readMinutes: 2,
    title: 'Reviving a quiet conversation',
    subtitle: 'A stalled thread is usually busyness, not rejection. Re-open with warmth.',
    image: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=900&q=85',
    tips: [
      'Never guilt-trip someone for a late reply; start fresh with a light hook.',
      'Reference something you spotted today that connects to an earlier topic.',
      'If they still do not reply after one warm check-in, let it go gracefully.',
    ],
    tryThis: 'Just passed a street-food stall that looked dangerously good and remembered your Delhi chaat ranking. Still standing by #1?',
    skipThis: 'Hello?? Guessing you ghosted me then.',
    practicePrompt: 'Our chat went quiet for 4 days after talking about travel. Give me 3 warm ways to restart it.',
  },
  {
    id: 'green-flags',
    category: 'Mindset',
    readMinutes: 3,
    title: 'Reading the vibe and green flags',
    subtitle: 'Great chemistry feels calm, curious, and mutual — not like a guessing game.',
    image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=85',
    tips: [
      'Notice whether they ask follow-up questions about your world, not just answer yours.',
      'Consistency beats grand speeches: showing up kindly and on time is the clearest green flag.',
      'Respect your own boundaries early — sharing your pace filters for the right people.',
    ],
    tryThis: 'I really like taking things at an easy pace and actually getting to know someone. How about you?',
    skipThis: 'Trying to match someone else’s mixed signals by playing hard to get.',
    practicePrompt: 'What are 5 subtle green flags in early texting that show someone is genuinely interested?',
  },
  {
    id: 'profile-craft',
    category: 'Profile craft',
    readMinutes: 2,
    title: 'Writing a profile that invites curiosity',
    subtitle: 'Give people an effortless reason to message you first.',
    image: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&w=900&q=85',
    tips: [
      'Lead with a clear, warm daytime portrait where your face is easy to see.',
      'Swap generic adjectives ("funny, loyal") for tiny vivid moments ("making Sunday dosa with 90s playlists").',
      'End one prompt with a playful choice or mini-challenge people can reply to.',
    ],
    tryThis: 'Current quest: finding the city’s best masala chai. Nominate your favourite spot and I will judge fairly.',
    skipThis: 'Just ask me anything, I am bad at writing bios.',
    practicePrompt: 'Rewrite my dating bio to sound warmer and easier to reply to: I like coding, coffee, gym and travelling.',
  },
];

export const LEARN_STARTER_PROMPTS = [
  'Write a playful opener for someone who loves coffee and books',
  'Practice flirting with me — start as a witty new match',
  'How do I ask them out for coffee this weekend?',
  'Help me reply to a short "haha nice" message',
] as const;
