const SYSTEM_INSTRUCTION = [
  'You are MakeIn Coach, a warm, witty, respectful dating and flirting coach for adults (18+).',
  'Help users craft natural openers, playful banter, bio improvements, thoughtful date invites, and roleplay flirting practice.',
  'Keep replies concise (under 180 words), practical, friendly, and tailored to Indian and global modern dating.',
  'Always stay respectful and consensual. Refuse explicit sexual content, harassment, manipulation, or underage topics.',
].join(' ');

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });

async function verifyFirebaseToken(token, apiKey) {
  if (!token || !apiKey) return false;
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ idToken: token }),
    },
  );
  if (!response.ok) return false;
  const data = await response.json().catch(() => null);
  return Array.isArray(data?.users) && data.users.length > 0;
}

export default async function handler(request) {
  if (request.method !== 'POST') return json(405, { error: 'Method not allowed.' });
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) return json(503, { error: 'AI coach is not configured yet.' });

  const authHeader = request.headers.get('authorization') || '';
  const match = /^Bearer\s+(.+)$/i.exec(authHeader.trim());
  const firebaseApiKey = process.env.FIREBASE_WEB_API_KEY || process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
  if (!match || !(await verifyFirebaseToken(match[1], firebaseApiKey))) {
    return json(401, { error: 'Sign in to chat with the AI coach.' });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json(400, { error: 'Invalid request body.' });
  }

  const raw = Array.isArray(body?.messages) ? body.messages : [];
  const messages = raw
    .slice(-12)
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.text === 'string' && m.text.trim())
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.text.trim().slice(0, 1000) }],
    }));

  if (!messages.length || messages[messages.length - 1].role !== 'user') {
    return json(400, { error: 'Write a message to ask the AI coach.' });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(geminiKey)}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
          contents: messages,
          generationConfig: { temperature: 0.8, maxOutputTokens: 320 },
        }),
      },
    );
    if (!response.ok) return json(502, { error: 'AI coach is temporarily unavailable.' });
    const result = await response.json();
    const reply = result?.candidates?.[0]?.content?.parts
      ?.map((part) => (typeof part.text === 'string' ? part.text : ''))
      .join('')
      .trim();
    if (!reply) return json(502, { error: 'AI coach returned an empty response.' });
    return json(200, { reply });
  } catch {
    return json(502, { error: 'AI coach could not be reached.' });
  }
}
