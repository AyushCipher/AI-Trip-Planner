/**
 * validateItinerary — pure function that takes raw response from the backend
 * and returns { valid: boolean, data: object|null, errors: string[] }
 *
 * This function NEVER throws. It handles:
 * 1. Raw JSON strings
 * 2. JSON wrapped in markdown code fences (```json ... ```)
 * 3. Already-parsed objects
 * 4. Malformed/unparseable input
 * 5. Valid JSON but wrong shape (missing required fields)
 */

/**
 * Attempt to extract JSON from markdown code fences.
 * Handles ```json ... ```, ``` ... ```, and variations.
 */
function stripMarkdownFences(raw) {
  if (typeof raw !== 'string') return raw;

  // Match ```json ... ``` or ``` ... ``` (with optional language tag)
  const fencePattern = /```(?:json)?\s*\n?([\s\S]*?)```/i;
  const match = raw.match(fencePattern);
  if (match) {
    return match[1].trim();
  }

  return raw;
}

/**
 * Try to parse a string as JSON, with fence-stripping fallback.
 * Returns { parsed: object|null, error: string|null }
 */
function tryParseJSON(raw) {
  if (raw === null || raw === undefined) {
    return { parsed: null, error: 'Input is null or undefined' };
  }

  // If it's already an object (not a string), use it directly
  if (typeof raw === 'object') {
    return { parsed: raw, error: null };
  }

  if (typeof raw !== 'string') {
    return { parsed: null, error: `Unexpected input type: ${typeof raw}` };
  }

  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return { parsed: null, error: 'Response is empty' };
  }

  // First attempt: direct parse
  try {
    return { parsed: JSON.parse(trimmed), error: null };
  } catch {
    // Fall through to fence-stripping
  }

  // Second attempt: strip markdown fences and re-parse
  const stripped = stripMarkdownFences(trimmed);
  if (stripped !== trimmed) {
    try {
      return { parsed: JSON.parse(stripped), error: null };
    } catch {
      // Fall through to final error
    }
  }

  return { parsed: null, error: 'Failed to parse response as JSON' };
}

/**
 * Validate the shape of a parsed itinerary object.
 * Returns an array of error strings (empty = valid).
 */
function validateShape(data) {
  const errors = [];

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    errors.push('Response is not a valid object');
    return errors;
  }

  // Required top-level fields
  if (!data.destination || typeof data.destination !== 'string') {
    errors.push('Missing or invalid "destination" field');
  }

  // Days array is strictly required
  if (!data.days) {
    errors.push('Missing "days" field');
    return errors;
  }

  if (!Array.isArray(data.days)) {
    errors.push('"days" is not an array');
    return errors;
  }

  if (data.days.length === 0) {
    errors.push('Itinerary has no days');
    return errors;
  }

  // Validate each day
  data.days.forEach((day, dayIdx) => {
    if (!day || typeof day !== 'object') {
      errors.push(`Day ${dayIdx + 1} is not a valid object`);
      return;
    }

    if (day.dayNumber === undefined && day.dayNumber === null) {
      errors.push(`Day ${dayIdx + 1} is missing "dayNumber"`);
    }

    if (!day.title || typeof day.title !== 'string') {
      errors.push(`Day ${dayIdx + 1} is missing "title"`);
    }

    if (!day.stops || !Array.isArray(day.stops)) {
      errors.push(`Day ${dayIdx + 1} is missing "stops" array`);
      return;
    }

    // Validate each stop
    day.stops.forEach((stop, stopIdx) => {
      if (!stop || typeof stop !== 'object') {
        errors.push(`Day ${dayIdx + 1}, Stop ${stopIdx + 1} is not a valid object`);
        return;
      }

      if (!stop.name || typeof stop.name !== 'string') {
        errors.push(`Day ${dayIdx + 1}, Stop ${stopIdx + 1} is missing "name"`);
      }
    });
  });

  return errors;
}

/**
 * Add stable unique IDs to each day and stop for React keys and drag-and-drop.
 * This is done in-place and returns the mutated data.
 */
function addIds(data) {
  let stopCounter = 0;

  if (data.days && Array.isArray(data.days)) {
    data.days = data.days.map((day, dayIdx) => {
      const dayWithId = {
        ...day,
        id: `day-${dayIdx + 1}-${Date.now()}`,
        dayNumber: day.dayNumber ?? dayIdx + 1,
        title: day.title ?? `Day ${dayIdx + 1}`,
        stops: [],
      };

      if (day.stops && Array.isArray(day.stops)) {
        dayWithId.stops = day.stops.map((stop) => {
          stopCounter++;
          return {
            ...stop,
            id: `stop-${stopCounter}-${Date.now()}`,
            name: stop.name ?? 'Unnamed Stop',
            time: stop.time ?? '',
            description: stop.description ?? '',
            category: stop.category ?? 'activity',
            estimatedCost: stop.estimatedCost ?? '',
            duration: stop.duration ?? '',
            tips: stop.tips ?? '',
          };
        });
      }

      return dayWithId;
    });
  }

  return data;
}

/**
 * Main validation function.
 * @param {*} raw — raw response from the backend (string or object)
 * @returns {{ valid: boolean, data: object|null, errors: string[] }}
 */
export default function validateItinerary(raw) {
  // Step 1: Parse
  const { parsed, error: parseError } = tryParseJSON(raw);

  if (parseError) {
    return { valid: false, data: null, errors: [parseError] };
  }

  // Step 2: Check if it's an error response from our backend
  if (parsed.error === true && parsed.reason) {
    return {
      valid: false,
      data: null,
      errors: [parsed.message || `API error: ${parsed.reason}`],
    };
  }

  // Step 3: Validate shape
  const shapeErrors = validateShape(parsed);

  if (shapeErrors.length > 0) {
    return { valid: false, data: null, errors: shapeErrors };
  }

  // Step 4: Add IDs and fill defaults
  const enriched = addIds({ ...parsed });

  return { valid: true, data: enriched, errors: [] };
}

// Export internals for testing
export { stripMarkdownFences, tryParseJSON, validateShape };
