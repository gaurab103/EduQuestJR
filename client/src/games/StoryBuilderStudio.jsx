/**
 * Story Builder Studio - PREMIUM
 * Unique mechanic: Choose-your-adventure story creation. Kid picks characters,
 * settings, and actions at each beat. Final story is read aloud.
 * Different from StorySequence (ordering) -- this is CREATIVE composition.
 */
import { useState, useEffect, useRef } from 'react';
import { useAudio } from '../context/AudioContext';
import { useTeaching } from './useTeaching';
import { useNoRepeat } from './useNoRepeat';
import { getRounds, getFeedbackDelay } from './levelConfig';
import styles from './GameCommon.module.css';

const TWEMOJI = (cp) => `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${cp}.svg`;

const CHARACTERS = [
  { name: 'Brave Fox', emoji: '1f98a' },
  { name: 'Clever Owl', emoji: '1f989' },
  { name: 'Happy Bunny', emoji: '1f430' },
  { name: 'Kind Bear', emoji: '1f43b' },
  { name: 'Funny Monkey', emoji: '1f435' },
  { name: 'Smart Cat', emoji: '1f431' },
  { name: 'Strong Lion', emoji: '1f981' },
  { name: 'Gentle Deer', emoji: '1f98c' },
];
const SETTINGS = [
  { name: 'a magical forest', emoji: '1f332' },
  { name: 'a sunny beach', emoji: '1f3d6' },
  { name: 'a snowy mountain', emoji: '26f0' },
  { name: 'a busy city', emoji: '1f3d9' },
  { name: 'a beautiful garden', emoji: '1f33b' },
  { name: 'a cozy village', emoji: '1f3e0' },
  { name: 'outer space', emoji: '1f680' },
  { name: 'under the sea', emoji: '1f30a' },
];
const PROBLEMS = [
  { text: 'found a lost baby bird', emoji: '1f426' },
  { text: 'discovered a hidden treasure map', emoji: '1f5fa' },
  { text: 'saw a friend who was sad', emoji: '1f622' },
  { text: 'found a mysterious door', emoji: '1f6aa' },
  { text: 'heard a strange noise', emoji: '1f50a' },
  { text: 'noticed the sky turning purple', emoji: '1f30c' },
];
const ACTIONS = [
  { text: 'helped with kindness', emoji: '2764' },
  { text: 'used cleverness to solve it', emoji: '1f4a1' },
  { text: 'asked friends for help', emoji: '1f91d' },
  { text: 'was brave and faced the challenge', emoji: '1f4aa' },
  { text: 'sang a magical song', emoji: '1f3b5' },
  { text: 'shared what they had', emoji: '1f381' },
];
const ENDINGS = [
  { text: 'everyone celebrated together', emoji: '1f389' },
  { text: 'they made a new best friend', emoji: '1f917' },
  { text: 'the whole world became more colorful', emoji: '1f308' },
  { text: 'they learned an important lesson', emoji: '1f4d6' },
  { text: 'they lived happily ever after', emoji: '2b50' },
  { text: 'they went on many more adventures', emoji: '1f30d' },
];

function pickRandom(arr, count) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function getSteps(level) {
  if (level <= 5) return ['character', 'setting', 'ending'];
  if (level <= 12) return ['character', 'setting', 'problem', 'ending'];
  return ['character', 'setting', 'problem', 'action', 'ending'];
}

const STEP_LABELS = {
  character: 'Choose your hero:',
  setting: 'Where does the story happen?',
  problem: 'What happens next?',
  action: 'What does the hero do?',
  ending: 'How does the story end?',
};

export default function StoryBuilderStudio({ onComplete, level = 1, childName }) {
  const { playSuccess, playClick, playCelebration } = useAudio();
  const { teachAfterAnswer, readQuestion, teachFact } = useTeaching();
  const { generate } = useNoRepeat();
  const [round, setRound] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const [steps, setSteps] = useState([]);
  const [choices, setChoices] = useState({});
  const [options, setOptions] = useState([]);
  const [score, setScore] = useState(0);
  const [storyDone, setStoryDone] = useState(false);
  const completedRef = useRef(false);
  const ROUNDS = Math.min(getRounds(level), 5);

  useEffect(() => {
    window.speechSynthesis?.cancel();
    if (round >= ROUNDS && !completedRef.current) {
      completedRef.current = true;
      playCelebration();
      onComplete(score, 100);
      return;
    }
    const s = getSteps(level);
    setSteps(s);
    setStepIdx(0);
    setChoices({});
    setStoryDone(false);
    const cancelRead = readQuestion('Build your own story! Pick a hero to start.');
    return cancelRead;
  }, [round]);

  useEffect(() => {
    if (stepIdx >= steps.length || storyDone) return;
    const step = steps[stepIdx];
    let pool;
    switch (step) {
      case 'character': pool = CHARACTERS; break;
      case 'setting': pool = SETTINGS; break;
      case 'problem': pool = PROBLEMS; break;
      case 'action': pool = ACTIONS; break;
      case 'ending': pool = ENDINGS; break;
      default: pool = [];
    }
    setOptions(pickRandom(pool, 3));
  }, [stepIdx, steps, storyDone]);

  function handleChoice(option) {
    playClick();
    const step = steps[stepIdx];
    const newChoices = { ...choices, [step]: option };
    setChoices(newChoices);
    playSuccess();

    if (stepIdx + 1 >= steps.length) {
      setStoryDone(true);
      setScore(s => s + 10 + steps.length * 2);
      const story = buildStory(newChoices);
      teachFact(story);
    } else {
      setStepIdx(s => s + 1);
    }
  }

  function buildStory(ch) {
    let s = '';
    if (ch.character) s += `Once upon a time, ${ch.character.name} lived in ${ch.setting?.name || 'a faraway land'}. `;
    if (ch.problem) s += `One day, ${ch.character.name} ${ch.problem.text}. `;
    if (ch.action) s += `${ch.character.name} ${ch.action.text}. `;
    if (ch.ending) s += `In the end, ${ch.ending.text}. The end!`;
    else s += 'The end!';
    return s;
  }

  function handleNext() {
    playClick();
    setRound(r => r + 1);
  }

  if (round >= ROUNDS) {
    return (
      <div className={styles.container}>
        <div className={styles.celebration}>
          <h2>Story Star!</h2>
          <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>Score: {score}</p>
          <p style={{ color: 'var(--text-muted)' }}>You created {ROUNDS} stories!</p>
        </div>
      </div>
    );
  }

  if (storyDone) {
    return (
      <div className={styles.container}>
        <div className={styles.hud}>
          <span>Lv {level}</span><span>·</span>
          <span>Story {round + 1}/{ROUNDS}</span>
        </div>
        <h3 style={{ margin: '0.5rem 0' }}>Your Story!</h3>
        <div style={{
          background: 'rgba(56,189,248,0.06)', borderRadius: 16, padding: '1rem 1.25rem',
          textAlign: 'left', lineHeight: 1.8, fontSize: '0.95rem',
          border: '1.5px solid rgba(56,189,248,0.15)',
        }}>
          <p>{buildStory(choices)}</p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', margin: '1rem 0', flexWrap: 'wrap' }}>
          {Object.values(choices).map((ch, i) => (
            <img key={i} src={TWEMOJI(ch.emoji)} alt="" style={{ width: 36, height: 36 }} />
          ))}
        </div>

        <button type="button" onClick={handleNext} className={styles.choiceBtn} style={{
          padding: '0.8rem 2rem', fontWeight: 800, fontSize: '1rem',
          background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff',
          border: 'none',
        }}>
          {round + 1 < ROUNDS ? 'Next Story!' : 'Finish!'}
        </button>
      </div>
    );
  }

  const currentStep = steps[stepIdx];

  return (
    <div className={styles.container}>
      <div className={styles.hud}>
        <span>Lv {level}</span><span>·</span>
        <span>Story {round + 1}/{ROUNDS}</span><span>·</span>
        <span>Step {stepIdx + 1}/{steps.length}</span>
      </div>

      {/* Progress dots */}
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', margin: '0.5rem 0' }}>
        {steps.map((s, i) => (
          <div key={s} style={{
            width: 12, height: 12, borderRadius: '50%',
            background: i < stepIdx ? '#22c55e' : i === stepIdx ? 'var(--primary)' : 'var(--card-border)',
            transition: 'background 0.2s',
          }} />
        ))}
      </div>

      {/* Already chosen */}
      {Object.keys(choices).length > 0 && (
        <div style={{
          display: 'flex', gap: '0.5rem', justifyContent: 'center',
          margin: '0.5rem 0', flexWrap: 'wrap',
        }}>
          {Object.values(choices).map((ch, i) => (
            <span key={i} style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              background: 'rgba(34,197,94,0.1)', padding: '0.25rem 0.6rem',
              borderRadius: 999, fontSize: '0.75rem', fontWeight: 700,
            }}>
              <img src={TWEMOJI(ch.emoji)} alt="" style={{ width: 18, height: 18 }} />
              {ch.name || ch.text}
            </span>
          ))}
        </div>
      )}

      <p className={styles.prompt}>{STEP_LABELS[currentStep]}</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxWidth: 340, margin: '0 auto' }}>
        {options.map((opt, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleChoice(opt)}
            className={styles.choiceBtn}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.8rem 1rem', textAlign: 'left', justifyContent: 'flex-start',
            }}
          >
            <img src={TWEMOJI(opt.emoji)} alt="" style={{ width: 32, height: 32, flexShrink: 0 }} />
            <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>{opt.name || opt.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
