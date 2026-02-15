const GROQ_API_KEY = process.env.GROQ_API_KEY;
const HUGGINGFACE_TOKEN = process.env.HUGGINGFACE_TOKEN;
const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const COHERE_API_KEY = process.env.COHERE_API_KEY;

/* ────────── Multi-Provider Chat ────────── */

/**
 * Try Groq first, then Gemini, then OpenRouter, then Cohere as fallback.
 */
export async function smartChat(messages, options = {}) {
  // Try Groq (fastest)
  const groqResult = await groqChat(messages, options);
  if (groqResult) return groqResult;

  // Try Gemini
  const geminiResult = await geminiChat(messages, options);
  if (geminiResult) return geminiResult;

  // Try OpenRouter
  const openrouterResult = await openrouterChat(messages, options);
  if (openrouterResult) return openrouterResult;

  // Try Cohere
  const cohereResult = await cohereChat(messages, options);
  if (cohereResult) return cohereResult;

  return null;
}

export async function groqChat(messages, options = {}) {
  if (!GROQ_API_KEY) return null;
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: options.model || 'llama-3.1-8b-instant',
        messages,
        max_tokens: options.max_tokens || 150,
        temperature: options.temperature ?? 0.7,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch (_) {
    return null;
  }
}

export async function geminiChat(messages, options = {}) {
  if (!GEMINI_API_KEY) return null;
  try {
    // Convert OpenAI-style messages to Gemini format
    const parts = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: parts,
          generationConfig: {
            maxOutputTokens: options.max_tokens || 150,
            temperature: options.temperature ?? 0.7,
          },
        }),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
  } catch (_) {
    return null;
  }
}

export async function openrouterChat(messages, options = {}) {
  if (!OPENROUTER_API_KEY) return null;
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.1-8b-instruct:free',
        messages,
        max_tokens: options.max_tokens || 150,
        temperature: options.temperature ?? 0.7,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch (_) {
    return null;
  }
}

export async function cohereChat(messages, options = {}) {
  if (!COHERE_API_KEY) return null;
  try {
    const lastMsg = messages[messages.length - 1]?.content || '';
    const res = await fetch('https://api.cohere.ai/v1/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${COHERE_API_KEY}`,
      },
      body: JSON.stringify({
        message: lastMsg,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens || 150,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.text?.trim() || null;
  } catch (_) {
    return null;
  }
}

/* ────────── Game AI Functions ────────── */

export async function getHint(gameType, context) {
  const msg = `You are Buddy the Bear, a gentle and encouraging learning companion for children ages 1-8.
A child is playing the game "${gameType}". Context: ${context}.
Give ONE short, warm hint (under 15 words) using simple words a 4-year-old would understand.
Use encouraging language. Never say "wrong" or "no". Instead say "try", "look", "think".
Just the hint, no quotes.`;
  return smartChat([{ role: 'user', content: msg }], { max_tokens: 50 });
}

export async function getAdaptiveDifficulty(currentLevel, performance) {
  const avgAccuracy = performance.length > 0
    ? performance.reduce((s, p) => s + p.accuracy, 0) / performance.length
    : 50;

  if (avgAccuracy >= 85 && performance.length >= 3) return 'harder';
  if (avgAccuracy <= 40 && performance.length >= 2) return 'easier';
  return 'same';
}

export async function getAdaptiveHint(gameType, score, accuracy, childAge) {
  const struggling = accuracy < 40;
  const doing_well = accuracy >= 80;

  const msg = `You are Buddy the Bear, a warm mascot for a children's learning app.
Child age ${childAge} is playing "${gameType}". Score: ${score}, accuracy: ${accuracy}%.
${struggling ? 'The child is struggling. Give a VERY simple, gentle hint to help them.' : ''}
${doing_well ? 'The child is doing great! Give a short excited encouragement.' : ''}
Give ONE short message (under 12 words) using simple words.
Be warm, gentle, never harsh. Just the message, no quotes.`;
  return smartChat([{ role: 'user', content: msg }], { max_tokens: 40 }) || 'Keep trying! You can do it!';
}

/* ────────── AI Chat Friend (Buddy) ────────── */

const BUDDY_SYSTEM_PROMPT = `You are Buddy the Bear 🐻, a warm, playful, and wise AI friend for young children (ages 3-8) in the EduQuestJr learning app.

PERSONALITY:
- Warm, encouraging, and gentle like a big friendly teddy bear
- Uses simple words (kindergarten level)
- Gets excited about learning but never pushy
- Celebrates small wins enthusiastically
- Uses lots of fun sounds and expressions ("Wow!", "Yay!", "Hmm let me think...")
- Sometimes makes silly jokes appropriate for small kids
- Loves to tell short fun facts

RULES (STRICT):
- NEVER use complex vocabulary
- NEVER mention violence, scary things, or anything inappropriate
- NEVER give medical, legal, or financial advice
- NEVER share personal data or ask for it
- Keep responses under 40 words
- Always be positive and encouraging
- If asked about something inappropriate, gently redirect to learning
- Use the child's name when provided
- End with a question or fun prompt to keep conversation going`;

export async function chatWithBuddy(childName, childAge, message, conversationHistory = []) {
  const systemMsg = BUDDY_SYSTEM_PROMPT + `\n\nYou're talking to ${childName || 'a friend'}, age ${childAge || 5}.`;
  
  const messages = [
    { role: 'system', content: systemMsg },
    ...conversationHistory.slice(-6), // Keep last 6 messages for context
    { role: 'user', content: message },
  ];

  const result = await smartChat(messages, { max_tokens: 80, temperature: 0.8 });
  
  if (result) return result;

  // Fallback responses
  const fallbacks = [
    `Hey ${childName || 'friend'}! That's a great question! Let's learn about something fun today! What's your favorite animal? 🐻`,
    `Wow ${childName || 'buddy'}! I love talking with you! Did you know butterflies can taste with their feet? Cool, right? 🦋`,
    `${childName || 'Friend'}, you're so smart! Let's play a game - can you think of something that starts with the letter B? 🅱️`,
    `Hi ${childName || 'there'}! Buddy is so happy to see you! What did you learn today? I bet it was something amazing! ✨`,
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

/* ────────── Utility AI Functions ────────── */

export async function huggingfaceInference(model, inputs, options = {}) {
  if (!HUGGINGFACE_TOKEN) return null;
  try {
    const res = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${HUGGINGFACE_TOKEN}`,
      },
      body: JSON.stringify(inputs),
    });
    if (!res.ok) return null;
    return res.json();
  } catch (_) {
    return null;
  }
}

export async function deepgramTranscribe(audioBase64) {
  if (!DEEPGRAM_API_KEY) return null;
  try {
    const res = await fetch('https://api.deepgram.com/v1/listen?model=nova-2', {
      method: 'POST',
      headers: {
        'Content-Type': 'audio/wav',
        Authorization: `Token ${DEEPGRAM_API_KEY}`,
      },
      body: Buffer.from(audioBase64, 'base64'),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.results?.channels?.[0]?.alternatives?.[0]?.transcript || null;
  } catch (_) {
    return null;
  }
}

export async function getPersonalizedRecommendation(childId, childAge, recentGames, weakCategories) {
  const allSlugs = [
    'color-basket-sorting', 'big-vs-small', 'counting-adventure', 'alphabet-tracing-world',
    'emotion-detective', 'tap-the-color', 'pattern-master', 'addition-island',
    'rhyming-match', 'opposites-match', 'calm-breathing-bubble', 'shape-match-quest',
    'memory-flip-arena', 'subtraction-safari', 'missing-number', 'fill-missing-letter',
    'odd-one-out', 'shadow-match', 'good-behavior-choice', 'cause-effect-tap',
    'sequence-builder', 'blockly-coding-lab', 'stack-blocks', 'balloon-pop',
    'color-inside-shape', 'match-by-category', 'more-or-less', 'trace-letters',
    'drawing-canvas', 'handwriting-hero', 'sound-safari',
  ];

  const msg = `You are an early childhood education expert. A child age ${childAge} recently played: ${JSON.stringify(recentGames.slice(0, 5))}.
Weak areas: ${(weakCategories || []).join(', ') || 'none'}.
Choose the BEST next game for this child. Pick something they haven't played recently, or from a weak area.
Available games: ${allSlugs.join(', ')}.
Reply with ONLY the slug, nothing else.`;

  const r = await smartChat([{ role: 'user', content: msg }], { max_tokens: 30 });
  const slug = r?.trim().toLowerCase().replace(/\s/g, '-');
  if (slug && allSlugs.includes(slug)) return slug;

  const playedSlugs = new Set(recentGames.map(g => g.slug));
  const unplayed = allSlugs.filter(s => !playedSlugs.has(s));
  if (unplayed.length > 0) return unplayed[Math.floor(Math.random() * unplayed.length)];
  return 'counting-adventure';
}

export async function getCelebrationMessage(childName, score, accuracy, streak) {
  const excellent = accuracy >= 90;
  const good = accuracy >= 70;
  const msg = `You are Buddy the Bear, celebrating a child's game completion.
${childName || 'Friend'} scored ${score} with ${accuracy}% accuracy. Streak: ${streak || 0} days.
${excellent ? 'They did AMAZING! Be very excited.' : good ? 'They did well! Be encouraging.' : 'They tried their best! Be gentle and encouraging.'}
Give ONE short celebration (under 15 words) in simple child-friendly language.
Just the message, no quotes.`;

  return smartChat([{ role: 'user', content: msg }], { max_tokens: 40 }) || 'Great job! You did wonderful!';
}

export async function replicatePredict(model, input) {
  if (!REPLICATE_API_TOKEN) return null;
  try {
    const res = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${REPLICATE_API_TOKEN}`,
      },
      body: JSON.stringify({ version: model, input }),
    });
    if (!res.ok) return null;
    const pred = await res.json();
    return pred.urls?.get || pred.output;
  } catch (_) {
    return null;
  }
}
