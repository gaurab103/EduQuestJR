/**
 * Buddy the Bear - AI Chat Friend for kids.
 * A friendly, safe chatbot that kids can talk to for fun and learning.
 * Uses selected language (English, Spanish, Nepali).
 */
import { useState, useRef, useEffect } from 'react';
import { ai as aiApi } from '../api/client';
import { useAudio } from '../context/AudioContext';
import { useLanguage } from '../context/LanguageContext';
import { BUDDY_TRANSLATIONS } from '../i18n/translations';
import styles from './BuddyChat.module.css';

export default function BuddyChat({ childId, childName, isOpen, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef(null);
  const { speak, playClick, playSuccess } = useAudio();
  const { lang } = useLanguage();
  const t = BUDDY_TRANSLATIONS[lang] || BUDDY_TRANSLATIONS.en;

  // Initial greeting when opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting = childName ? t.greetingWithName(childName) : t.greetingNoName;
      setMessages([{ role: 'assistant', content: greeting }]);
      speak(greeting);
    }
  }, [isOpen, lang]);

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
      const res = await aiApi.chat(childId, text.trim(), history, lang);
      const reply = res.reply || t.fallback;
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      playSuccess();
      speak(reply);
    } catch (_) {
      const fallback = t.fallbackError(childName);
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
          src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f43b.svg"
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
            src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f43b.svg"
            alt="Buddy"
            className={styles.headerAvatar}
          />
          <div className={styles.headerInfo}>
            <span className={styles.headerName}>{t.headerName}</span>
            <span className={styles.headerStatus}>{t.headerStatus}</span>
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
                  src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f43b.svg"
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
                src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f43b.svg"
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
          {t.quickPrompts.map((p, i) => (
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
            placeholder={t.placeholder}
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
