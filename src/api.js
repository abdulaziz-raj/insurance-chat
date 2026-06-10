// Talks to the Java insurance-agent backend (DecisionEngineApp).
//
// Endpoint:  GET /termlife_api/eapp?message=<user text>
// In dev, /termlife_api is proxied to the backend (see vite.config.js),
// so requests stay same-origin and CORS is a non-issue.

const ENDPOINT = '/termlife_api/eapp'

// The backend returns a JSON object, but the exact field names aren't pinned
// down yet. We probe a list of common keys so the UI keeps working no matter
// which the server actually uses. Adjust/trim these once the shape is final.
const MESSAGE_KEYS = ['message', 'question', 'reply', 'response', 'text', 'answer', 'content', 'prompt']
const DONE_KEYS = ['done', 'completed', 'finished', 'complete', 'end', 'isComplete']

function pickMessage(data) {
  if (typeof data === 'string') return data
  if (data && typeof data === 'object') {
    for (const key of MESSAGE_KEYS) {
      if (typeof data[key] === 'string' && data[key].trim()) return data[key]
    }
    // Fall back to the first string-valued field we find.
    for (const value of Object.values(data)) {
      if (typeof value === 'string' && value.trim()) return value
    }
  }
  return ''
}

function pickDone(data) {
  if (data && typeof data === 'object') {
    for (const key of DONE_KEYS) {
      if (typeof data[key] === 'boolean') return data[key]
    }
  }
  return false
}

/**
 * Send the user's message to the agent and return the next prompt.
 * @param {string} message
 * @param {string} [conversationId] stable id so the backend keeps this
 *   visitor's answers in an isolated memory thread (sent as X-Conversation-Id).
 * @returns {Promise<{ text: string, done: boolean, raw: unknown }>}
 */
export async function sendMessage(message, conversationId) {
  const url = `${ENDPOINT}?message=${encodeURIComponent(message)}`
  const headers = { Accept: 'application/json' }
  if (conversationId) headers['X-Conversation-Id'] = conversationId
  const res = await fetch(url, { headers })

  if (!res.ok) {
    throw new Error(`Backend responded ${res.status} ${res.statusText}`)
  }

  // Be tolerant: parse JSON when we can, otherwise treat the body as text.
  const body = await res.text()
  let data
  try {
    data = JSON.parse(body)
  } catch {
    data = body
  }

  const text = pickMessage(data)
  return {
    text: text || "Sorry, I didn't catch that. Could you rephrase?",
    done: pickDone(data),
    raw: data,
  }
}
