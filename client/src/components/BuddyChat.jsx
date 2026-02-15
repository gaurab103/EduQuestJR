/**
 * Buddy the Bear - AI Chat Friend for kids.
 * A friendly, safe chatbot that kids can talk to for fun and learning.
 * Uses personalized greetings with child's name.
 */
import { useState, useRef, useEffect } from 'react';
import { ai as aiApi } from '../api/client';
import { useAudio } from '../context/AudioContext';
import styles from './BuddyChat.module.css';

const QUICK_PROMPTS = [
  { emoji: '🦕', text: 'Tell me a fun fact!' },
  { emoji: '🎵', text: 'Sing me a short song!' },
  { emoji: '🧮', text: 'Give me a math puzzle!' },
  { emoji: '🌈', text: 'What colors make purple?' },
  { emoji: '🐾', text: 'Tell me about animals!' },
  { emoji: '🌟', text: "Let's play a word game!" },
];

export default function BuddyChat({ childId, childName, isOpen, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef(null);
  const { speak, playClick, playSuccess } = useAudio();

  // Initial greeting when opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting = childName
        ? `Hi ${childName}! I'm Buddy the Bear! 🐻 I'm so happy to see you! What should we talk about today?`
        : "Hi friend! I'm Buddy the Bear! 🐻 What should we talk about today?";
      setMessages([{ role: 'assistant', content: greeting }]);
      speak(greeting);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(text) {
    if (!text.trim() || loading) return;
    playClick();

    const userMsg = { role: 'user', content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const history = newMessages.slice(-8).map(m => ({
        role: m.role,
        content: m.content,
      }));
      const res = await aiApi.chat(childId, text.trim(), history);
      const reply = res.reply || "Hmm, let me think about that! Can you ask me something else? 🤔";
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      playSuccess();
      speak(reply);
    } catch (_) {
      const fallback = `That's a great question, ${childName || 'friend'}! Let me think... Can you ask me something else? 🤔`;
      setMessages(prev => [...prev, { role: 'assistant', content: fallback }]);
    }
    setLoading(false);
  }

  if (!isOpen) return null;

  if (isMinimized) {
    return (
      <button
        type="button"
        className={styles.minimized}
        onClick={() => setIsMinimized(false)}
      >
        <img
          src="https://cdn-icons-png.flaticon.com/128/3940/3940403.png"
          alt="Buddy"
          className={styles.miniAvatar}
        />
        <span className={styles.miniPulse} />
      </button>
    );
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.chatWindow}>
        {/* Header */}
        <div className={styles.header}>
          <img
            src="https://cdn-icons-png.flaticon.com/128/3940/3940403.png"
            alt="Buddy"
            className={styles.headerAvatar}
          />
          <div className={styles.headerInfo}>
            <span className={styles.headerName}>Buddy the Bear</span>
            <span className={styles.headerStatus}>🟢 Online</span>
          </div>
          <div className={styles.headerActions}>
            <button
              type="button"
              onClick={() => setIsMinimized(true)}
              className={styles.headerBtn}
              title="Minimize"
            >
              ─
            </button>
            <button
              type="button"
              onClick={onClose}
              className={styles.headerBtn}
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className={styles.messages}>
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`${styles.message} ${msg.role === 'user' ? styles.userMsg : styles.buddyMsg}`}
            >
              {msg.role === 'assistant' && (
                <img
                  src="https://cdn-icons-png.flaticon.com/128/3940/3940403.png"
                  alt=""
                  className={styles.msgAvatar}
                />
              )}
              <div className={styles.msgBubble}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className={`${styles.message} ${styles.buddyMsg}`}>
              <img
                src="https://cdn-icons-png.flaticon.com/128/3940/3940403.png"
                alt=""
                className={styles.msgAvatar}
              />
              <div className={`${styles.msgBubble} ${styles.typing}`}>
                <span className={styles.dot} />
                <span className={styles.dot} />
                <span className={styles.dot} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick prompts */}
        <div className={styles.quickPrompts}>
          {QUICK_PROMPTS.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => sendMessage(p.text)}
              className={styles.promptBtn}
              disabled={loading}
            >
              <span>{p.emoji}</span>
              <span className={styles.promptText}>{p.text}</span>
            </button>
          ))}
        </div>

        {/* Input */}
        <form
          className={styles.inputArea}
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Talk to Buddy...`}
            className={styles.textInput}
            disabled={loading}
            maxLength={200}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className={styles.sendBtn}
          >
            📨
          </button>
        </form>
      </div>
    </div>
  );
}
