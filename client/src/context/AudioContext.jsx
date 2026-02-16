import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useLanguage } from './LanguageContext';

const AudioCtx = createContext(null);

/**
 * Generates simple tones using Web Audio API – no external sound files needed.
 */
function createAudioContext() {
  try {
    return new (window.AudioContext || window.webkitAudioContext)();
  } catch {
    return null;
  }
}

function playTone(audioCtx, frequency, duration, type = 'sine', volume = 0.3) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

function playSuccessSound(audioCtx) {
  if (!audioCtx) return;
  playTone(audioCtx, 523, 0.15, 'sine', 0.25);
  setTimeout(() => playTone(audioCtx, 659, 0.15, 'sine', 0.25), 100);
  setTimeout(() => playTone(audioCtx, 784, 0.3, 'sine', 0.3), 200);
}

function playWrongSound(audioCtx) {
  if (!audioCtx) return;
  playTone(audioCtx, 300, 0.2, 'triangle', 0.15);
  setTimeout(() => playTone(audioCtx, 250, 0.3, 'triangle', 0.12), 150);
}

function playClickSound(audioCtx) {
  if (!audioCtx) return;
  playTone(audioCtx, 800, 0.05, 'sine', 0.15);
}

function playLevelUpSound(audioCtx) {
  if (!audioCtx) return;
  [523, 587, 659, 698, 784, 880, 988, 1047].forEach((f, i) => {
    setTimeout(() => playTone(audioCtx, f, 0.15, 'sine', 0.2), i * 80);
  });
}

function playCelebrationSound(audioCtx) {
  if (!audioCtx) return;
  playTone(audioCtx, 523, 0.2, 'sine', 0.25);
  setTimeout(() => playTone(audioCtx, 659, 0.2, 'sine', 0.25), 150);
  setTimeout(() => playTone(audioCtx, 784, 0.2, 'sine', 0.25), 300);
  setTimeout(() => playTone(audioCtx, 1047, 0.4, 'sine', 0.3), 450);
}

export function AudioProvider({ children }) {
  const [muted, setMuted] = useState(() => localStorage.getItem('eduquest_muted') === 'true');
  const audioCtxRef = useRef(null);
  const { speechLang } = useLanguage();

  const ensureCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = createAudioContext();
    }
    if (audioCtxRef.current?.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      localStorage.setItem('eduquest_muted', String(next));
      return next;
    });
  }, []);

  const playSuccess = useCallback(() => {
    if (muted) return;
    playSuccessSound(ensureCtx());
  }, [muted, ensureCtx]);

  const playWrong = useCallback(() => {
    if (muted) return;
    playWrongSound(ensureCtx());
  }, [muted, ensureCtx]);

  const playClick = useCallback(() => {
    if (muted) return;
    playClickSound(ensureCtx());
  }, [muted, ensureCtx]);

  const playLevelUp = useCallback(() => {
    if (muted) return;
    playLevelUpSound(ensureCtx());
  }, [muted, ensureCtx]);

  const playCelebration = useCallback(() => {
    if (muted) return;
    playCelebrationSound(ensureCtx());
  }, [muted, ensureCtx]);

  const speak = useCallback((text, options = {}) => {
    if (muted || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = options.lang || speechLang;
    utterance.rate = options.rate ?? 0.85;
    utterance.pitch = options.pitch ?? 1.2;
    utterance.volume = options.volume ?? 0.8;
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.lang?.startsWith(speechLang.split('-')[0])) ||
      voices.find(v => v.name.includes('Samantha') || v.name.includes('Karen') || v.name.includes('Zira') || v.name.includes('Female'));
    if (preferred) utterance.voice = preferred;
    window.speechSynthesis.speak(utterance);
  }, [muted, speechLang]);

  const value = {
    muted,
    toggleMute,
    playSuccess,
    playWrong,
    playClick,
    playLevelUp,
    playCelebration,
    speak,
  };

  return (
    <AudioCtx.Provider value={value}>
      {children}
    </AudioCtx.Provider>
  );
}

export function useAudio() {
  const ctx = useContext(AudioCtx);
  if (!ctx) {
    return {
      muted: false,
      toggleMute: () => {},
      playSuccess: () => {},
      playWrong: () => {},
      playClick: () => {},
      playLevelUp: () => {},
      playCelebration: () => {},
      speak: () => {},
    };
  }
  return ctx;
}
