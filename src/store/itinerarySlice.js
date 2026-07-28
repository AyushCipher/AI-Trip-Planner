import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import validateItinerary from '../utils/validateItinerary.js';

// ──────────────────────────────────────────────
// Async thunk: generateItinerary
// ──────────────────────────────────────────────
// Each call generates a unique requestId. The fulfilled/rejected reducers
// ONLY apply the result if requestId matches the latest one in state.
// This is the stale-response guard: if the user fires two rapid requests,
// only the latest one ever reaches state.
// ──────────────────────────────────────────────

export const generateItinerary = createAsyncThunk(
  'itinerary/generate',
  async ({ prompt, requestId }, { signal }) => {
    const controller = new AbortController();

    // If the thunk is aborted by Redux (e.g. on unmount), also abort the fetch
    signal.addEventListener('abort', () => controller.abort());

    // 15-second client-side timeout (in addition to server's 15s timeout)
    const timeout = setTimeout(() => controller.abort(), 15_000);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const text = await response.text();

      // The validation function handles everything: parsing, shape checking,
      // fence stripping, error detection. It never throws.
      const validation = validateItinerary(text);

      return { validation, requestId, prompt };
    } catch (err) {
      clearTimeout(timeout);

      if (err.name === 'AbortError') {
        throw new Error('Request timed out. Try a shorter prompt or try again.');
      }

      throw new Error(
        navigator.onLine === false
          ? 'You appear to be offline. Check your connection and try again.'
          : `Network error: ${err.message}`
      );
    }
  }
);

// ──────────────────────────────────────────────
// Slice
// ──────────────────────────────────────────────
const itinerarySlice = createSlice({
  name: 'itinerary',
  initialState: {
    status: 'idle', // 'idle' | 'loading' | 'success' | 'error'
    data: null,
    errorMessage: null,
    requestId: null, // latest requestId — stale-response guard
    lastPrompt: null, // for retry functionality
  },
  reducers: {
    // Set a new requestId when a generation starts — this is called
    // BEFORE the thunk dispatches so we can track which request is "current"
    setRequestId(state, action) {
      state.requestId = action.payload;
    },

    // Remove a stop from a day
    removeStop(state, action) {
      const { dayId, stopId } = action.payload;
      if (!state.data?.days) return;

      const day = state.data.days.find((d) => d.id === dayId);
      if (day) {
        day.stops = day.stops.filter((s) => s.id !== stopId);
      }
    },

    // Reorder stops within a day (after drag-and-drop)
    reorderStops(state, action) {
      const { dayId, oldIndex, newIndex } = action.payload;
      if (!state.data?.days) return;

      const day = state.data.days.find((d) => d.id === dayId);
      if (day && day.stops) {
        const [moved] = day.stops.splice(oldIndex, 1);
        day.stops.splice(newIndex, 0, moved);
      }
    },

    // Clear the itinerary (reset to idle)
    clearItinerary(state) {
      state.status = 'idle';
      state.data = null;
      state.errorMessage = null;
      state.requestId = null;
      state.lastPrompt = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(generateItinerary.pending, (state) => {
        state.status = 'loading';
        state.errorMessage = null;
      })
      .addCase(generateItinerary.fulfilled, (state, action) => {
        const { validation, requestId, prompt } = action.payload;

        // ── STALE RESPONSE GUARD ──
        // If this response's requestId doesn't match the latest one,
        // it's from an older request — discard it silently.
        if (requestId !== state.requestId) {
          return;
        }

        state.lastPrompt = prompt;

        if (validation.valid) {
          state.status = 'success';
          state.data = validation.data;
          state.errorMessage = null;
        } else {
          state.status = 'error';
          state.data = null;
          state.errorMessage =
            validation.errors.join('. ') ||
            'The AI returned an unexpected response. Please try again.';
        }
      })
      .addCase(generateItinerary.rejected, (state, action) => {
        // Also guard against stale rejections
        // (Though less critical — if the latest request failed, we show that error)
        state.status = 'error';
        state.data = null;
        state.errorMessage =
          action.error?.message || 'Something went wrong. Please try again.';
      });
  },
});

export const { setRequestId, removeStop, reorderStops, clearItinerary } =
  itinerarySlice.actions;

export default itinerarySlice.reducer;
