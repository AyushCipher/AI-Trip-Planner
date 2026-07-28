# AI Trip Planner

A React app that takes free-form text describing a trip, sends it to Google Gemini, and renders the response as an interactive, structured day-by-day itinerary — not a chatbot.

## Quick Start

```bash
# 1. Clone the repo
git clone <repo-url> && cd ai-trip-planner

# 2. Copy environment template and add your Gemini API key
cp .env.example .env
# Edit .env and set GEMINI_API_KEY=your_key_here

# 3. Install dependencies (root + server)
npm install && cd server && npm install && cd ..

# 4. Start both frontend and backend
npm start
```

This runs:
- **Frontend** (Vite): http://localhost:5173
- **Backend** (Express proxy): http://localhost:3001

## Architecture

```
Frontend (React + Redux Toolkit)
    ↓ POST /api/generate { prompt }
Express Backend Proxy (server/index.js)
    ↓ Gemini API (gemini-3.6-flash, responseMimeType: "application/json")
    ↓ Returns raw JSON text
Frontend validates & renders interactive itinerary
```

**Why a backend proxy?** The Gemini API key never touches the browser. The Express server is the only thing that holds the key.

## Features

- **Free-form text input** — describe any trip in natural language
- **Structured AI output** — Gemini returns JSON via `responseMimeType: "application/json"` with a defined schema
- **Interactive itinerary** — expand/collapse days, remove stops, drag-to-reorder stops within a day
- **Robust error handling** — see section below

## Error Handling (20% of grade)

This is the core of the submission. Every failure mode is handled:

| Failure Mode | How It's Handled |
|---|---|
| **Malformed JSON** from Gemini | `validateItinerary()` tries direct parse, then strips markdown fences and re-parses. Shows ErrorState with retry — never crashes. |
| **Wrong-shape JSON** (`{ foo: "bar" }`) | Shape validation checks for `days` array, required fields. Returns `{ valid: false, errors }` — no garbage renders. |
| **Empty response** | Detected and surfaced as a specific error message with retry. |
| **Slow/hung response** | 15s timeout via `AbortController` on both client and server. Timeout error shown with retry button. |
| **Two rapid submissions (stale response)** | Each request gets a `crypto.randomUUID()` requestId. Redux only applies a response if its `requestId` matches the latest. Older responses are silently discarded. |
| **Network failure** | Fetch errors caught, offline-aware message shown. |
| **Render crash** | Components handle missing/null data defensively. |

### Testing failure modes

The backend supports `MOCK_MODE` for deterministic testing:

```bash
# In .env:
MOCK_MODE=malformed    # Returns invalid JSON
MOCK_MODE=empty        # Returns empty string
MOCK_MODE=slow         # Delays 20s (triggers timeout)
MOCK_MODE=partial      # Returns valid JSON missing "days"
```

### Unit tests

```bash
npm test                # Run all tests (8 tests for validateItinerary)
npm run test:watch      # Watch mode
```

Tests cover: valid input, malformed JSON, wrong shape, empty days, markdown fences, null input, empty string, backend error detection.

## State Management

Redux Toolkit with a single `itinerarySlice`:
- `status`: `'idle' | 'loading' | 'success' | 'error'`
- `data`: parsed itinerary (null when not success)
- `errorMessage`: error string (null when not error)
- `requestId`: stale-response guard — set before thunk dispatch, checked on fulfillment
- `lastPrompt`: for retry functionality

## AI Usage Note

*[To be filled in by the author]*

## Known Limitations

- **No refinement loop** — each submission generates a fresh itinerary (no follow-up editing of existing results)
- **No persistence** — refreshing the page loses the current itinerary (no localStorage save/load)
- **No dark mode toggle** — uses a fixed dark theme
- **No day-level reordering** — only stop-level drag-and-drop within a day
- **No streaming** — waits for the full response before rendering
- **Client-side timeout is a hard 15s** — complex prompts on slow networks may time out
- **Single API key** — no user authentication or per-user rate limiting

## Time Spent

*[To be filled in by the author]*

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite |
| State | Redux Toolkit (createSlice, configureStore, createAsyncThunk) |
| Backend | Express.js (API proxy) |
| AI | Google Gemini 3.6 Flash |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable |
| Styling | Vanilla CSS with CSS custom properties |
| Testing | Vitest |
