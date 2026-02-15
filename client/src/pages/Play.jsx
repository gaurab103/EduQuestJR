import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { progress as progressApi } from '../api/client';
import GameLayout from '../components/GameLayout';
import LevelSelector from '../components/LevelSelector';
import RewardModal from '../components/RewardModal';
import { useGameSession } from '../hooks/useGameSession';
import { GAME_COMPONENTS } from '../games/registry';

export default function Play() {
  const { gameSlug } = useParams();
  const [searchParams] = useSearchParams();
  const childId = searchParams.get('child');
  const navigate = useNavigate();

  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [rewardData, setRewardData] = useState(null);
  const [level, setLevel] = useState(null);
  const { start: startSession, end: endSession } = useGameSession();

  useEffect(() => {
    if (!childId || !gameSlug) {
      setError('Missing child or game. Go to Dashboard and choose a child, then pick a game.');
      setLoading(false);
      return;
    }
    progressApi
      .playStatus(childId, gameSlug)
      .then((data) => setStatus(data))
      .catch((err) => {
        setError(err.message || 'Could not load game');
      })
      .finally(() => setLoading(false));
  }, [childId, gameSlug]);

  const GameComponent = gameSlug ? GAME_COMPONENTS[gameSlug] : null;

  async function handleComplete(score, accuracy) {
    if (!status?.canPlay || !childId || !gameSlug) return;
    const timeSpentSeconds = endSession();
    try {
      const res = await progressApi.submit({
        childId,
        gameSlug,
        score,
        accuracy,
        timeSpentSeconds,
        gameLevel: level || 1,
      });
      setRewardData({
        rewards: res.rewards,
        child: res.child,
      });
      setResult('done');
    } catch (err) {
      // Handle level locked or premium required errors
      if (err.code === 'LEVEL_LOCKED' || err.code === 'PREMIUM_LEVEL_REQUIRED') {
        setError(err.message);
        setLevel(null);
      } else {
        setError(err.message || 'Could not save progress');
      }
    }
  }

  function handleCloseReward() {
    setRewardData(null);
    // Reload play status to get updated completedLevels
    if (childId && gameSlug) {
      setLoading(true);
      setLevel(null);
      setResult(null);
      setError(null);
      progressApi
        .playStatus(childId, gameSlug)
        .then((data) => setStatus(data))
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      navigate('/games');
    }
  }

  if (loading) {
    return (
      <GameLayout child={null} game={null}>
        <div className="loading-screen">Loading game...</div>
      </GameLayout>
    );
  }

  if (error) {
    return (
      <GameLayout child={status?.child} game={status?.game}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>{error}</p>
          <Link to="/games">← Back to games</Link>
        </div>
      </GameLayout>
    );
  }

  if (!status.canPlay) {
    const reason = status.reason === 'PREMIUM_REQUIRED'
      ? 'This game is for Premium members. Upgrade to unlock!'
      : "You've used your free play time for today. Come back tomorrow or upgrade to Premium for unlimited play.";
    return (
      <GameLayout
        child={status.child}
        game={status.game}
        minutesLeftToday={status.minutesLeftToday}
        isPremium={status.isPremium}
      >
        <div style={{ textAlign: 'center', padding: '2rem', maxWidth: '400px' }}>
          <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>{reason}</p>
          <Link to="/games" style={{ fontWeight: 700 }}>← Back to games</Link>
        </div>
      </GameLayout>
    );
  }

  if (rewardData) {
    return (
      <GameLayout child={rewardData.child} game={status?.game}>
        <RewardModal
          rewards={rewardData.rewards}
          child={rewardData.child}
          onClose={handleCloseReward}
        />
      </GameLayout>
    );
  }

  if (!GameComponent) {
    return (
      <GameLayout child={status.child} game={status.game}>
        <p style={{ color: 'var(--text-muted)' }}>
          Game &quot;{gameSlug}&quot; is not available yet. Try Shape Match Quest or Counting Adventure!
        </p>
        <Link to="/games">Back to games</Link>
      </GameLayout>
    );
  }

  if (level === null) {
    return (
      <GameLayout child={status.child} game={status.game}>
        <LevelSelector
          gameTitle={status.game.title}
          gameSlug={gameSlug}
          completedLevels={status.completedLevels || []}
          isPremium={status.isPremium}
          onSelect={(l) => {
            setLevel(l);
            startSession();
          }}
        />
      </GameLayout>
    );
  }

  return (
    <GameLayout
      child={status.child}
      game={status.game}
      minutesLeftToday={status.minutesLeftToday}
      isPremium={status.isPremium}
      progressToNextLevel={status.child?.progressToNextLevel}
    >
      <GameComponent
        onComplete={handleComplete}
        level={level}
        childName={status.child?.name}
        childAge={status.child?.age}
      />
    </GameLayout>
  );
}
