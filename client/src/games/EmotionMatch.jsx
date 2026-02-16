/**
 * Emotion Match - Shows a scenario (text + emoji): "Your friend falls down"
 * Asks "How would they feel?" Kid picks: happy, sad, angry, scared, surprised.
 * Teaches empathy and emotional intelligence. SEL / Free
 */
import { useState, useEffect, useRef } from 'react';
import { useAudio } from '../context/AudioContext';
import { useNoRepeat } from './useNoRepeat';
import { getRounds, getChoiceCount, getFeedbackDelay } from './levelConfig';
import { useTeaching } from './useTeaching';
import styles from './GameCommon.module.css';

const TWEMOJI = (cp) => `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${cp}.svg`;

const EMOTIONS = [
  { id: 'happy', label: 'Happy', emoji: TWEMOJI('1f600') },
  { id: 'sad', label: 'Sad', emoji: TWEMOJI('1f622') },
  { id: 'angry', label: 'Angry', emoji: TWEMOJI('1f620') },
  { id: 'scared', label: 'Scared', emoji: TWEMOJI('1f628') },
  { id: 'surprised', label: 'Surprised', emoji: TWEMOJI('1f62e') },
  { id: 'excited', label: 'Excited', emoji: TWEMOJI('1f973') },
  { id: 'sick', label: 'Sick', emoji: TWEMOJI('1f912') },
  { id: 'tired', label: 'Tired', emoji: TWEMOJI('1f62a') },
  { id: 'proud', label: 'Proud', emoji: TWEMOJI('1f60a') },
  { id: 'worried', label: 'Worried', emoji: TWEMOJI('1f61f') },
  { id: 'shy', label: 'Shy', emoji: TWEMOJI('1f633') },
  { id: 'brave', label: 'Brave', emoji: TWEMOJI('1f631') },
];

const SCENARIOS = [
  { scenario: 'Your friend falls down', emoji: TWEMOJI('1f938'), answer: 'sad', options: ['sad', 'happy', 'angry', 'scared'] },
  { scenario: 'Someone surprises you with a gift', emoji: TWEMOJI('1f381'), answer: 'surprised', options: ['surprised', 'angry', 'sad', 'scared'] },
  { scenario: 'A big dog barks at you', emoji: TWEMOJI('1f436'), answer: 'scared', options: ['scared', 'happy', 'excited', 'proud'] },
  { scenario: 'Your toy breaks', emoji: TWEMOJI('1f9f8'), answer: 'sad', options: ['sad', 'happy', 'excited', 'brave'] },
  { scenario: 'You win a race!', emoji: TWEMOJI('1f3c1'), answer: 'happy', options: ['happy', 'sad', 'angry', 'scared'] },
  { scenario: 'Someone takes your snack without asking', emoji: TWEMOJI('1f34e'), answer: 'angry', options: ['angry', 'happy', 'surprised', 'tired'] },
  { scenario: 'You see a spider', emoji: TWEMOJI('1f577'), answer: 'scared', options: ['scared', 'happy', 'excited', 'proud'] },
  { scenario: 'You get a gold star at school', emoji: TWEMOJI('2b50'), answer: 'proud', options: ['proud', 'sad', 'worried', 'shy'] },
  { scenario: 'Your best friend moves away', emoji: TWEMOJI('1f4a4'), answer: 'sad', options: ['sad', 'happy', 'angry', 'excited'] },
  { scenario: 'You have to go to the doctor', emoji: TWEMOJI('1f489'), answer: 'worried', options: ['worried', 'excited', 'happy', 'proud'] },
  { scenario: 'You stay up very late', emoji: TWEMOJI('1f4a4'), answer: 'tired', options: ['tired', 'excited', 'angry', 'brave'] },
  { scenario: 'You try something new and do it!', emoji: TWEMOJI('1f4aa'), answer: 'proud', options: ['proud', 'sad', 'scared', 'sick'] },
  { scenario: 'You get sick with a cold', emoji: TWEMOJI('1f912'), answer: 'sick', options: ['sick', 'happy', 'excited', 'brave'] },
  { scenario: 'It is your birthday!', emoji: TWEMOJI('1f382'), answer: 'happy', options: ['happy', 'sad', 'worried', 'tired'] },
  { scenario: 'A loud noise surprises you', emoji: TWEMOJI('1f4a2'), answer: 'surprised', options: ['surprised', 'happy', 'sad', 'proud'] },
  { scenario: 'You have to speak in front of class', emoji: TWEMOJI('1f4da'), answer: 'shy', options: ['shy', 'angry', 'excited', 'tired'] },
  { scenario: 'You face something scary and try anyway', emoji: TWEMOJI('1f9e0'), answer: 'brave', options: ['brave', 'sad', 'sick', 'worried'] },
  { scenario: 'You go to a fun party', emoji: TWEMOJI('1f389'), answer: 'excited', options: ['excited', 'sad', 'tired', 'worried'] },
];

const EMPATHY_FACTS = {
  happy: 'Being happy makes others happy too! Smiles are contagious.',
  sad: 'When someone is sad, we can give them a hug or ask if they need help.',
  angry: 'Anger is normal. Taking deep breaths helps us calm down.',
  scared: 'Everyone feels scared sometimes. It helps to talk about it.',
  surprised: 'Surprises can be fun! Some surprises make us very happy.',
  excited: 'Excitement is great! Sharing excitement with friends is fun.',
  sick: 'When we are sick, rest and care help us feel better.',
  tired: 'Our bodies need sleep. Rest helps us feel better.',
  proud: 'Feeling proud of ourselves is important!',
  worried: 'Worrying is normal. Talking to someone we trust helps.',
  shy: 'Being shy is okay. Taking small steps helps us feel braver.',
  brave: 'Being brave means trying even when we feel scared.',
};

export default function EmotionMatch({ onComplete, level = 1, childAge }) {
  const { playSuccess, playWrong, playClick, playCelebration } = useAudio();
  const { teachAfterAnswer, readQuestion, getRecommendedDelayBeforeNext } = useTeaching();
  const { generate } = useNoRepeat(level);
  const [round, setRound] = useState(0);
  const [question, setQuestion] = useState(null);
  const [options, setOptions] = useState([]);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [selected, setSelected] = useState(null);
  const [done, setDone] = useState(false);
  const completedRef = useRef(false);
  const ROUNDS = getRounds(level);
  const CHOICES = getChoiceCount(level);

  useEffect(() => {
    window.speechSynthesis?.cancel();
    if (round >= ROUNDS && !completedRef.current) {
      completedRef.current = true;
      setDone(true);
      playCelebration();
      const accuracy = ROUNDS > 0 ? Math.round((correct / ROUNDS) * 100) : 0;
      onComplete(score, accuracy);
      return;
    }
    const q = generate(
      () => SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)],
      (r) => r.scenario
    );
    let opts = q.options.slice();
    if (opts.length < CHOICES) {
      const used = new Set(opts);
      while (opts.length < CHOICES) {
        const e = EMOTIONS[Math.floor(Math.random() * EMOTIONS.length)];
        if (!used.has(e.id)) { opts.push(e.id); used.add(e.id); }
      }
    } else if (opts.length > CHOICES) {
      opts = [q.answer, ...opts.filter(x => x !== q.answer).sort(() => Math.random() - 0.5).slice(0, CHOICES - 1)];
    }
    setQuestion(q);
    setOptions(opts.sort(() => Math.random() - 0.5));
    setFeedback(null);
    setSelected(null);
  }, [round, ROUNDS, correct, score]);

  useEffect(() => {
    if (question && round < ROUNDS) {
      const cancelRead = readQuestion(`${question.scenario}. How would they feel?`);
      return cancelRead;
    }
  }, [question, round, ROUNDS]);

  function handleChoice(id) {
    if (feedback) return;
    playClick();
    setSelected(id);
    const isCorrect = id === question.answer;
    if (isCorrect) {
      setScore(s => s + 10);
      setCorrect(c => c + 1);
      playSuccess();
      setFeedback('correct');
    } else {
      playWrong();
      setFeedback('wrong');
    }
    const emotion = EMOTIONS.find(e => e.id === question.answer);
    teachAfterAnswer(isCorrect, {
      type: 'emotion',
      answer: EMOTIONS.find(e => e.id === id)?.label,
      correctAnswer: emotion?.label,
      extra: EMPATHY_FACTS[question.answer] || 'Understanding how others feel helps us be kind.',
    });
    const delay = getRecommendedDelayBeforeNext(getFeedbackDelay(level, isCorrect));
    setTimeout(() => setRound(r => r + 1), delay);
  }

  if (done) {
    const accuracy = ROUNDS > 0 ? Math.round((correct / ROUNDS) * 100) : 0;
    return (
      <div className={styles.container}>
        <div className={styles.celebration}>
          <img src={TWEMOJI('1f970')} alt="" style={{ width: 80, height: 80 }} />
          <h2>Empathy Expert!</h2>
          <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>Score: {score}</p>
          <span style={{ color: 'var(--text-muted)', fontWeight: 800 }}>Accuracy: {accuracy}%</span>
        </div>
      </div>
    );
  }

  if (!question) return null;

  const getEmotion = (id) => EMOTIONS.find(e => e.id === id);

  return (
    <div className={styles.container}>
      <div className={styles.hud}>
        <span>Lv {level} · {round + 1}/{ROUNDS} · ✅ {correct} · ⭐ {score}</span>
      </div>
      <p className={styles.prompt}>How would they feel?</p>
      <div className={styles.targetArea} style={{ background: 'rgba(56,189,248,0.08)', borderRadius: 16, padding: '1rem 1.25rem', marginBottom: '1rem' }}>
        <img src={question.emoji} alt="" style={{ width: 56, height: 56, marginBottom: '0.5rem' }} />
        <p style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>{question.scenario}</p>
      </div>
      <div className={styles.choices}>
        {options.map((id) => {
          const e = getEmotion(id);
          if (!e) return null;
          const isCorrect = id === question.answer;
          const isSelectedWrong = feedback === 'wrong' && selected === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => handleChoice(id)}
              disabled={!!feedback}
              className={`${styles.choiceBtn} ${feedback && isCorrect ? styles.correct : ''} ${isSelectedWrong ? styles.wrong : ''}`}
              style={{ flexDirection: 'column', gap: '0.35rem' }}
            >
              <img src={e.emoji} alt="" style={{ width: 40, height: 40 }} />
              <span className={styles.choiceNumber} style={{ fontSize: '0.95rem' }}>{e.label}</span>
            </button>
          );
        })}
      </div>
      {feedback && (
        <div className={feedback === 'correct' ? styles.feedbackOk : styles.feedbackBad}>
          {feedback === 'correct' ? '✓ Great empathy!' : `Not quite! The correct answer is ${getEmotion(question.answer)?.label}.`}
        </div>
      )}
    </div>
  );
}
