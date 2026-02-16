import { useState, useEffect, useRef } from 'react';
import { useTeaching } from './useTeaching';
import { useNoRepeat } from './useNoRepeat';
import styles from './GameCommon.module.css';
import { getRounds, getChoiceCount, getFeedbackDelay } from './levelConfig';
import { useAudio } from '../context/AudioContext';
import { RHYME_IMAGES, GameImage } from './gameImages';

const RHYMES = [
  { word: 'cat', options: ['hat', 'dog', 'run', 'mat', 'bat'], img: RHYME_IMAGES.cat },
  { word: 'sun', options: ['fun', 'car', 'tree', 'run', 'bun'], img: RHYME_IMAGES.sun },
  { word: 'ball', options: ['tall', 'fish', 'blue', 'call', 'fall'], img: RHYME_IMAGES.ball },
  { word: 'dog', options: ['fog', 'cat', 'red', 'log', 'jog'], img: RHYME_IMAGES.dog },
  { word: 'tree', options: ['bee', 'car', 'hat', 'see', 'free'], img: RHYME_IMAGES.tree },
  { word: 'hat', options: ['cat', 'mat', 'rat', 'sat', 'bat'], img: RHYME_IMAGES.hat },
  { word: 'fish', options: ['dish', 'sun', 'bed', 'wish', 'swish'], img: RHYME_IMAGES.fish },
  { word: 'bed', options: ['red', 'fed', 'led', 'sad', 'head'], img: RHYME_IMAGES.bed },
  { word: 'star', options: ['car', 'far', 'bar', 'jar', 'tar'], img: RHYME_IMAGES.star },
  { word: 'key', options: ['bee', 'see', 'tree', 'free', 'tea'], img: RHYME_IMAGES.key },
];

function doRhyme(w1, w2) {
  const r = RHYMES.find(x => x.word === w1);
  if (r) return r.options.slice(0, 4).includes(w2);
  const r2 = RHYMES.find(x => x.options.includes(w1));
  if (r2) return r2.word === w2 || r2.options.slice(0, 4).includes(w2);
  return false;
}

const RHYME_PAIRS = [
  { w1: 'cat', w2: 'hat', rhyme: true },
  { w1: 'dog', w2: 'fog', rhyme: true },
  { w1: 'sun', w2: 'fun', rhyme: true },
  { w1: 'cat', w2: 'dog', rhyme: false },
  { w1: 'ball', w2: 'call', rhyme: true },
  { w1: 'tree', w2: 'car', rhyme: false },
  { w1: 'fish', w2: 'dish', rhyme: true },
  { w1: 'bed', w2: 'red', rhyme: true },
  { w1: 'hat', w2: 'run', rhyme: false },
  { w1: 'star', w2: 'car', rhyme: true },
  { w1: 'key', w2: 'bee', rhyme: true },
  { w1: 'ball', w2: 'fish', rhyme: false },
];

function getMode(level, round) {
  if (level <= 5) return 0; // What rhymes with X?
  if (level <= 10) return round % 2; // 0: what rhymes, 1: do they rhyme (yes/no)
  if (level <= 15) return round % 3; // 0: what rhymes, 1: do they rhyme, 2: find the one that DOESN'T rhyme
  return round % 4; // add 3: make a rhyming pair from 6 words
}

function getOptionsForLevel(item, count) {
  const correct = item.options[0];
  const wrong = item.options.slice(1).sort(() => Math.random() - 0.5).slice(0, count - 1);
  return [correct, ...wrong].sort(() => Math.random() - 0.5);
}

export default function RhymingMatch({ onComplete, level = 1 }) {
  const { playSuccess, playWrong, playClick } = useAudio();
  const { teachAfterAnswer, readQuestion, getRecommendedDelayBeforeNext } = useTeaching();
  const { generate } = useNoRepeat(level);
  const [round, setRound] = useState(0);
  const [item, setItem] = useState(null);
  const [options, setOptions] = useState([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [mode, setModeState] = useState(0);
  const [rhymePair, setRhymePair] = useState(null);
  const [makePairWords, setMakePairWords] = useState([]);
  const [correctPair, setCorrectPair] = useState(null);
  const [pairSelection, setPairSelection] = useState([]);
  const completedRef = useRef(false);
  const ROUNDS = getRounds(level);
  const choiceCount = getChoiceCount(level);

  useEffect(() => {
    window.speechSynthesis?.cancel();
    if (round >= ROUNDS && !completedRef.current) {
      completedRef.current = true;
      onComplete(score, Math.round((score / ROUNDS) * 100));
      return;
    }
    const m = getMode(level, round);
    setModeState(m);

    if (m === 0) {
      const r = generate(
        () => RHYMES[Math.floor(Math.random() * RHYMES.length)],
        (x) => x.word
      );
      setItem(r);
      setOptions(getOptionsForLevel(r, choiceCount));
      setRhymePair(null);
      setMakePairWords([]);
      setCorrectPair(null);
      setFeedback(null);
      const cancelRead = readQuestion('Which rhymes with "' + r.word + '"?');
      return cancelRead;
    }

    if (m === 1) {
      const pair = generate(
        () => RHYME_PAIRS[Math.floor(Math.random() * RHYME_PAIRS.length)],
        (x) => `${x.w1}-${x.w2}`
      );
      setRhymePair(pair);
      setItem(null);
      setOptions(['Yes', 'No']);
      setMakePairWords([]);
      setCorrectPair(null);
      setFeedback(null);
      const cancelRead = readQuestion('Do "' + pair.w1 + '" and "' + pair.w2 + '" rhyme?');
      return cancelRead;
    }

    if (m === 2) {
      const r = generate(
        () => RHYMES[Math.floor(Math.random() * RHYMES.length)],
        (x) => `not-${x.word}`
      );
      const rhymeWord = r.options[0];
      const nonRhymes = r.options.slice(1, 5).filter(Boolean);
      const opts = [rhymeWord, nonRhymes[0], nonRhymes[1]].sort(() => Math.random() - 0.5);
      setItem({ word: r.word, correct: rhymeWord, wrongOne: nonRhymes[0] });
      setOptions(opts);
      setRhymePair(null);
      setMakePairWords([]);
      setCorrectPair(null);
      setFeedback(null);
      const cancelRead = readQuestion('Find the word that does NOT rhyme with "' + r.word + '"');
      return cancelRead;
    }

    if (m === 3) {
      const { r1, r2 } = generate(
        () => {
          const r1 = RHYMES[Math.floor(Math.random() * RHYMES.length)];
          const r2 = RHYMES[Math.floor(Math.random() * RHYMES.length)];
          return { r1, r2 };
        },
        (x) => `${x.r1.word}-${x.r2.word}`
      );
      const words = [r1.word, r1.options[0], r2.word, r2.options[0], RHYMES[2].word, RHYMES[2].options[1]];
      const shuffled = words.sort(() => Math.random() - 0.5);
      setMakePairWords(shuffled);
      setCorrectPair([r1.word, r1.options[0]].sort());
      setPairSelection([]);
      setItem(null);
      setOptions(shuffled);
      setRhymePair(null);
      setFeedback(null);
      const cancelRead = readQuestion('Tap two words that rhyme!');
      return cancelRead;
    }

    setFeedback(null);
  }, [round, score, ROUNDS, choiceCount, level]);

  function handlePick(opt) {
    if (feedback !== null) return;
    playClick();

    if (mode === 1) {
      const correct = (opt === 'Yes' && rhymePair?.rhyme) || (opt === 'No' && !rhymePair?.rhyme);
      if (correct) { setScore(s => s + 1); setStreak(s => s + 1); playSuccess(); }
      else { setStreak(0); playWrong(); }
      setFeedback(correct ? 'correct' : 'wrong');
      const extra = rhymePair?.rhyme ? `"${rhymePair.w1}" and "${rhymePair.w2}" rhyme!` : `"${rhymePair.w1}" and "${rhymePair.w2}" don't rhyme.`;
      teachAfterAnswer(correct, { type: 'word', answer: opt, correctAnswer: rhymePair?.rhyme ? 'Yes' : 'No', extra });
      const delay = getRecommendedDelayBeforeNext(getFeedbackDelay(level, correct));
      setTimeout(() => setRound(r => r + 1), delay);
      return;
    }

    if (mode === 2) {
      const correct = !doRhyme(item?.word, opt);
      if (correct) { setScore(s => s + 1); setStreak(s => s + 1); playSuccess(); }
      else { setStreak(0); playWrong(); }
      setFeedback(correct ? 'correct' : 'wrong');
      teachAfterAnswer(correct, { type: 'word', answer: opt, correctAnswer: 'a word that does not rhyme', extra: correct ? '"' + opt + '" does not rhyme with "' + item?.word + '"!' : '"' + item?.word + '" and "' + item?.correct + '" rhyme!' });
      const delay = getRecommendedDelayBeforeNext(getFeedbackDelay(level, correct));
      setTimeout(() => setRound(r => r + 1), delay);
      return;
    }

    if (mode === 0) {
      const correct = item?.options[0] === opt;
      if (correct) { setScore(s => s + 1); setStreak(s => s + 1); playSuccess(); }
      else { setStreak(0); playWrong(); }
      setFeedback(correct ? 'correct' : 'wrong');
      teachAfterAnswer(correct, { type: 'word', answer: opt, correctAnswer: item?.options[0], extra: '"' + item?.word + '" and "' + item?.options[0] + '" rhyme!' });
      const delay = getRecommendedDelayBeforeNext(getFeedbackDelay(level, correct));
      setTimeout(() => setRound(r => r + 1), delay);
    }
  }

  function handleMakePairPick(word, idx) {
    if (feedback !== null || mode !== 3) return;
    if (pairSelection.length >= 2) return;
    const newSel = pairSelection.includes(idx) ? pairSelection.filter(i => i !== idx) : [...pairSelection, idx];
    setPairSelection(newSel);
    if (newSel.length === 2) {
      const w1 = makePairWords[newSel[0]];
      const w2 = makePairWords[newSel[1]];
      const correct = doRhyme(w1, w2);
      if (correct) { setScore(s => s + 1); setStreak(s => s + 1); playSuccess(); }
      else { setStreak(0); playWrong(); }
      setFeedback(correct ? 'correct' : 'wrong');
      teachAfterAnswer(correct, { type: 'word', answer: w1 + ' & ' + w2, correctAnswer: w1 + ' & ' + w2, extra: correct ? '"' + w1 + '" and "' + w2 + '" rhyme!' : 'Try to find two words that end with the same sound!' });
      const delay = getRecommendedDelayBeforeNext(getFeedbackDelay(level, correct));
      setTimeout(() => setRound(r => r + 1), delay);
    }
  }

  if (round >= ROUNDS) return <div className={styles.container}>Calculating your rewards...</div>;

  if (mode === 3) {
    return (
      <div className={styles.container}>
        <div className={styles.progress}>
          <span>Lv {level} · Round {round + 1}/{ROUNDS}</span><span>·</span><span>Score: {score}</span>
          {streak > 1 && <span>· 🔥 {streak}</span>}
        </div>
        <p className={styles.prompt}>Tap two words that rhyme!</p>
        <div className={styles.choices} style={{ flexWrap: 'wrap' }}>
          {makePairWords.map((w, i) => (
            <button key={i} type="button" onClick={() => handleMakePairPick(w, i)} className={`${styles.choiceBtn} ${styles.choiceNumber} ${pairSelection.includes(i) ? styles.correct : ''}`} disabled={feedback !== null}>{w}</button>
          ))}
        </div>
        {pairSelection.length === 1 && feedback === null && <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary)' }}>Now tap the word that rhymes!</p>}
        {feedback === 'correct' && <p className={styles.feedbackOk}>✓ Correct!</p>}
        {feedback === 'wrong' && (
          <div className={styles.feedbackBad}>
            <p>✗ The answer is <strong>{correctPair?.join(' and ')}</strong></p>
          </div>
        )}
      </div>
    );
  }

  if (mode === 2) {
    return (
      <div className={styles.container}>
        <div className={styles.progress}>
          <span>Lv {level} · Round {round + 1}/{ROUNDS}</span><span>·</span><span>Score: {score}</span>
          {streak > 1 && <span>· 🔥 {streak}</span>}
        </div>
        <p className={styles.prompt}>Find the one that does NOT rhyme with "<strong>{item?.word}</strong>"</p>
        <div className={styles.targetArea} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
          {item?.word && <strong style={{ fontSize: '1.5rem' }}>{item.word}</strong>}
        </div>
        <div className={styles.choices}>
          {options.map((opt, i) => (
            <button key={i} type="button" onClick={() => handlePick(opt)} className={`${styles.choiceBtn} ${styles.choiceNumber}`} disabled={feedback !== null}>{opt}</button>
          ))}
        </div>
        {feedback === 'correct' && <p className={styles.feedbackOk}>✓ Correct!</p>}
        {feedback === 'wrong' && (
          <div className={styles.feedbackBad}>
            <p>✗ The answer is <strong>{options.find(o => !doRhyme(item?.word, o)) || 'a word that does not rhyme'}</strong></p>
          </div>
        )}
      </div>
    );
  }

  if (mode === 1) {
    return (
      <div className={styles.container}>
        <div className={styles.progress}>
          <span>Lv {level} · Round {round + 1}/{ROUNDS}</span><span>·</span><span>Score: {score}</span>
          {streak > 1 && <span>· 🔥 {streak}</span>}
        </div>
        <p className={styles.prompt}>Do "<strong>{rhymePair?.w1}</strong>" and "<strong>{rhymePair?.w2}</strong>" rhyme?</p>
        <div className={styles.choices}>
          <button type="button" onClick={() => handlePick('Yes')} className={`${styles.choiceBtn} ${styles.choiceNumber}`} disabled={feedback !== null}>Yes</button>
          <button type="button" onClick={() => handlePick('No')} className={`${styles.choiceBtn} ${styles.choiceNumber}`} disabled={feedback !== null}>No</button>
        </div>
        {feedback === 'correct' && <p className={styles.feedbackOk}>✓ Correct!</p>}
        {feedback === 'wrong' && (
          <div className={styles.feedbackBad}>
            <p>✗ The answer is <strong>{rhymePair?.rhyme ? 'Yes' : 'No'}</strong></p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.progress}>
        <span>Lv {level} · Round {round + 1}/{ROUNDS}</span><span>·</span><span>Score: {score}</span>
        {streak > 1 && <span>· 🔥 {streak}</span>}
      </div>
      <p className={styles.prompt}>Which rhymes with "<strong>{item?.word}</strong>"?</p>
      <div className={styles.targetArea} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
        {item?.img && <GameImage src={item.img} alt={item.word} size={56} />}
        <strong style={{ fontSize: '1.5rem' }}>{item?.word}</strong>
      </div>
      <div className={styles.choices}>
        {options.map((opt, i) => (
          <button key={i} type="button" onClick={() => handlePick(opt)} className={`${styles.choiceBtn} ${styles.choiceNumber}`} disabled={feedback !== null}>{opt}</button>
        ))}
      </div>
      {feedback === 'correct' && <p className={styles.feedbackOk}>✓ Correct!</p>}
      {feedback === 'wrong' && (
        <div className={styles.feedbackBad}>
          <p>✗ The answer is <strong>{item?.options[0]}</strong></p>
        </div>
      )}
    </div>
  );
}
