import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// ──────────────────────────────────────────────
// Gemini API configuration
// ──────────────────────────────────────────────
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
const TIMEOUT_MS = 15_000;

// ──────────────────────────────────────────────
// System prompt that enforces structured JSON output
// ──────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a travel planning assistant. Given a trip description, return a structured JSON itinerary.

You MUST respond with valid JSON matching this exact schema — no markdown, no explanation, just the JSON object:

{
  "tripTitle": "string — a catchy title for the trip",
  "destination": "string — main destination",
  "duration": "string — e.g. '3 days'",
  "travelers": number,
  "estimatedBudget": "string — e.g. '$1,500'",
  "days": [
    {
      "dayNumber": number,
      "title": "string — theme for the day, e.g. 'Arrival & Old Town'",
      "stops": [
        {
          "time": "string — e.g. '9:00 AM'",
          "name": "string — place or activity name",
          "description": "string — 1-2 sentence description",
          "category": "one of: accommodation, food, activity, transport, shopping, nightlife",
          "estimatedCost": "string — e.g. '$50'",
          "duration": "string — e.g. '2 hours'",
          "tips": "string — practical tip for this stop"
        }
      ]
    }
  ]
}

Rules:
- Each day should have 3-6 stops
- Include realistic times, costs, and durations
- Categories must be one of: accommodation, food, activity, transport, shopping, nightlife
- If the user doesn't specify number of travelers, default to 2
- If the user doesn't specify budget, estimate a moderate one`;

// ──────────────────────────────────────────────
// Gemini response schema for structured output
// ──────────────────────────────────────────────
const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    tripTitle: { type: 'string' },
    destination: { type: 'string' },
    duration: { type: 'string' },
    travelers: { type: 'integer' },
    estimatedBudget: { type: 'string' },
    days: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          dayNumber: { type: 'integer' },
          title: { type: 'string' },
          stops: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                time: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string' },
                category: { type: 'string' },
                estimatedCost: { type: 'string' },
                duration: { type: 'string' },
                tips: { type: 'string' },
              },
              required: ['time', 'name', 'description'],
            },
          },
        },
        required: ['dayNumber', 'title', 'stops'],
      },
    },
  },
  required: ['tripTitle', 'destination', 'days'],
};

// ──────────────────────────────────────────────
// Mock responses for testing failure modes
// ──────────────────────────────────────────────
const MOCK_RESPONSES = {
  malformed: () => ({ status: 200, body: '{ this is not valid json at all!!!' }),
  empty: () => ({ status: 200, body: '' }),
  partial: () => ({
    status: 200,
    body: JSON.stringify({ foo: 'bar', tripTitle: 'Test', destination: 'Nowhere' }),
  }),
  slow: () =>
    new Promise((resolve) =>
      setTimeout(() => resolve({ status: 200, body: JSON.stringify({ tripTitle: 'Late' }) }), 20_000)
    ),
};

// ──────────────────────────────────────────────
// POST /api/generate
// ──────────────────────────────────────────────
app.post('/api/generate', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return res.status(400).json({
      error: true,
      reason: 'invalid_input',
      message: 'A non-empty prompt is required.',
    });
  }

  // ── Mock mode for testing failure scenarios ──
  const mockMode = process.env.MOCK_MODE?.toLowerCase();
  if (mockMode && mockMode !== 'off' && MOCK_RESPONSES[mockMode]) {
    console.log(`[MOCK_MODE=${mockMode}] Returning mock response`);
    try {
      const mock = await MOCK_RESPONSES[mockMode]();
      return res.status(mock.status).send(mock.body);
    } catch {
      return res.status(500).json({ error: true, reason: 'mock_error', message: 'Mock failed' });
    }
  }

  // ── Validate API key ──
  if (!GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY is not set in environment');
    return res.status(500).json({
      error: true,
      reason: 'api_error',
      message: 'Server misconfigured: missing API key.',
    });
  }

  // ── Call Gemini with timeout ──
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const geminiResponse = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: SYSTEM_PROMPT }],
        },
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA,
        },
      }),
    });

    clearTimeout(timeout);

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text().catch(() => 'Unknown error');
      console.error(`Gemini API error (${geminiResponse.status}):`, errorText);
      return res.status(geminiResponse.status).json({
        error: true,
        reason: geminiResponse.status === 429 ? 'rate_limit' : 'api_error',
        message: `Gemini API returned ${geminiResponse.status}: ${errorText.slice(0, 200)}`,
      });
    }

    const data = await geminiResponse.json();

    // Extract the text content from Gemini's response envelope
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    if (!text) {
      return res.status(200).json({
        error: true,
        reason: 'empty',
        message: 'Gemini returned an empty response.',
      });
    }

    // Return the raw text — the frontend's validateItinerary handles parsing
    res.status(200).send(text);
  } catch (err) {
    clearTimeout(timeout);

    if (err.name === 'AbortError') {
      console.error('Gemini request timed out after', TIMEOUT_MS, 'ms');
      return res.status(504).json({
        error: true,
        reason: 'timeout',
        message: `Request timed out after ${TIMEOUT_MS / 1000} seconds. Try a simpler prompt or try again.`,
      });
    }

    console.error('Fetch error:', err.message);
    return res.status(500).json({
      error: true,
      reason: 'api_error',
      message: `Failed to reach Gemini API: ${err.message}`,
    });
  }
});

// ──────────────────────────────────────────────
// Start server
// ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  if (process.env.MOCK_MODE && process.env.MOCK_MODE !== 'off') {
    console.log(`⚠️  MOCK_MODE is active: ${process.env.MOCK_MODE}`);
  }
});
