import { useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  generateItinerary,
  setRequestId,
} from './store/itinerarySlice.js';

import TripInput from './components/TripInput.jsx';
import ItineraryView from './components/ItineraryView.jsx';
import LoadingState from './components/LoadingState.jsx';
import ErrorState from './components/ErrorState.jsx';
import EmptyState from './components/EmptyState.jsx';

import './App.css';

function App() {
  const dispatch = useDispatch();
  const { status, data, errorMessage, lastPrompt } = useSelector(
    (state) => state.itinerary
  );

  // Track the input value so example chips can pre-fill it
  const [inputValue, setInputValue] = useState('');

  // ── Submit handler ──
  const handleSubmit = useCallback(
    (prompt) => {
      // Generate a unique requestId for this submission
      const requestId = crypto.randomUUID();

      // Set it in Redux BEFORE dispatching the thunk — this is the
      // stale-response guard: any older in-flight request will see
      // its requestId doesn't match and its result will be discarded.
      dispatch(setRequestId(requestId));
      dispatch(generateItinerary({ prompt, requestId }));
    },
    [dispatch]
  );

  // ── Example chip click handler ──
  const handleExampleClick = useCallback((text) => {
    setInputValue(text);
  }, []);

  // ── Retry handler ──
  const handleRetry = useCallback(() => {
    if (lastPrompt) {
      handleSubmit(lastPrompt);
    }
  }, [lastPrompt, handleSubmit]);

  // ── Render the correct results section ──
  const renderResults = () => {
    switch (status) {
      case 'idle':
        return <EmptyState onExampleClick={handleExampleClick} />;
      case 'loading':
        return <LoadingState />;
      case 'error':
        return <ErrorState message={errorMessage} onRetry={handleRetry} />;
      case 'success':
        return <ItineraryView data={data} />;
      default:
        return null;
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-header__title">✈ AI Trip Planner</h1>
        <p className="app-header__subtitle">
          Describe your dream trip and let AI create the perfect itinerary
        </p>
      </header>

      <main className="app-main">
        <section className="app-input-section">
          <TripInput
            onSubmit={handleSubmit}
            isLoading={status === 'loading'}
            initialValue={inputValue}
          />
        </section>

        <section className="app-results-section" aria-live="polite">
          {renderResults()}
        </section>
      </main>
    </div>
  );
}

export default App;
