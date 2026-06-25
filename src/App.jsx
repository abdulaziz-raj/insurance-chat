import { useEffect, useRef, useState } from 'react'
import { sendMessage } from './api.js'

const BOT_NAME = 'Alex'

// A friendly opener
const GREETING = {
  id: 'greeting',
  role: 'bot',
  text: `Hi, I'm ${BOT_NAME} 👋 your personal insurance assistant. Tell me what you're looking for and I'll get you set up. For example: "I want to get an insurance policy".`,
}

let nextId = 1
const makeId = () => `m${nextId++}`

// A unique id per browser session keeps each visitor's intake isolated in the
// backend's conversation memory. crypto.randomUUID is available in all modern
// browsers over http(s)/localhost.
const newConversationId = () =>
  (crypto.randomUUID?.() ?? `c-${Date.now()}-${Math.random().toString(36).slice(2)}`)

export default function App() {
  const [messages, setMessages] = useState([GREETING])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [done, setDone] = useState(false)
  const [conversationId, setConversationId] = useState(newConversationId)
  const scrollRef = useRef(null)
  const inputRef = useRef(null)

  // Wipe the transcript and start a fresh memory thread on the backend.
  function handleReset() {
    if (isTyping) return
    setMessages([GREETING])
    setInput('')
    setDone(false)
    setConversationId(newConversationId())
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  // Keep the latest message in view, including while the typing dots show.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, isTyping])

  const addMessage = (msg) => setMessages((prev) => [...prev, { id: makeId(), ...msg }])

  async function handleSend(e) {
    e?.preventDefault()
    const text = input.trim()
    if (!text || isTyping || done) return

    addMessage({ role: 'user', text })
    setInput('')
    setIsTyping(true)

    try {
      const reply = await sendMessage(text, conversationId)
      addMessage({ role: 'bot', text: reply.text })
      if (reply.done) setDone(true)
    } catch (err) {
      addMessage({
        role: 'bot',
        error: true,
        text: `I couldn't reach the server. ${err.message}`,
      })
    } finally {
      setIsTyping(false)
      // Return focus to the input so the conversation flows naturally.
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }

  return (
    <div className="app">
      <div className="chat">
        <header className="chat__header">
          <div className="avatar" aria-hidden="true">&gt;</div>
          <div className="chat__heading">
            <h1>{BOT_NAME}</h1>
            <span className="chat__status">
              <span className="dot" /> Accenture insurance assistant
            </span>
          </div>
          <button
            type="button"
            className="chat__reset"
            onClick={handleReset}
            disabled={isTyping}
            title="Start a new application"
          >
            Start over
          </button>
        </header>

        <main className="chat__messages" ref={scrollRef}>
          {messages.map((m) => (
            <Bubble key={m.id} role={m.role} error={m.error}>
              {m.text}
            </Bubble>
          ))}
          {isTyping && <TypingBubble />}
          {done && (
            <div className="chat__done">All set — your application is complete. 🎉</div>
          )}
        </main>

        <form className="chat__composer" onSubmit={handleSend}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={done ? 'Conversation finished' : 'Type your message…'}
            disabled={isTyping || done}
            autoFocus
            aria-label="Message"
          />
          <button type="submit" disabled={!input.trim() || isTyping || done} aria-label="Send">
            <SendIcon />
          </button>
        </form>
      </div>
    </div>
  )
}

function Bubble({ role, error, children }) {
  const isBot = role === 'bot'
  return (
    <div className={`row ${isBot ? 'row--bot' : 'row--user'}`}>
      {isBot && <div className="bubble-avatar" aria-hidden="true">&gt;</div>}
      <div className={`bubble ${isBot ? 'bubble--bot' : 'bubble--user'} ${error ? 'bubble--error' : ''}`}>
        {children}
      </div>
    </div>
  )
}

function TypingBubble() {
  return (
    <div className="row row--bot">
      <div className="bubble-avatar" aria-hidden="true">&gt;</div>
      <div className="bubble bubble--bot bubble--typing" aria-label={`${BOT_NAME} is typing`}>
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
    </div>
  )
}

function SendIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3.4 20.4 21 12 3.4 3.6 3 10l12 2-12 2z" fill="currentColor" />
    </svg>
  )
}
