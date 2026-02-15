import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { stickers as stickersApi, children as childrenApi } from '../api/client';
import { useAudio } from '../context/AudioContext';
import styles from './StickerShop.module.css';

const CATEGORIES = ['all', 'rewards', 'animals', 'nature', 'space', 'food', 'fun', 'fantasy', 'emotions'];

export default function StickerShop() {
  const [searchParams] = useSearchParams();
  const childIdParam = searchParams.get('child');
  const { playSuccess, playClick } = useAudio();
  const [allStickers, setAllStickers] = useState([]);
  const [childList, setChildList] = useState([]);
  const [selectedChild, setSelectedChild] = useState(childIdParam || '');
  const [child, setChild] = useState(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(null);
  const [tab, setTab] = useState('shop');
  const [catFilter, setCatFilter] = useState('all');
  const [equipping, setEquipping] = useState(false);
  const [equipped, setEquipped] = useState([]);
  const [buyAnimation, setBuyAnimation] = useState(null);

  useEffect(() => {
    Promise.all([stickersApi.list(), childrenApi.list()])
      .then(([stRes, chRes]) => {
        setAllStickers(stRes.stickers || []);
        setChildList(chRes.children || []);
        const firstId = childIdParam || chRes.children?.[0]?._id;
        if (firstId) {
          setSelectedChild(firstId);
          const c = chRes.children.find(x => x._id === firstId);
          setChild(c || null);
          setEquipped(c?.equippedStickers || []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [childIdParam]);

  function selectChild(id) {
    setSelectedChild(id);
    const c = childList.find(x => x._id === id);
    setChild(c || null);
    setEquipped(c?.equippedStickers || []);
  }

  async function handleBuy(stickerSlug) {
    if (!selectedChild || buying) return;
    playClick();
    setBuying(stickerSlug);
    try {
      const res = await stickersApi.buy(selectedChild, stickerSlug);
      setChild((prev) => prev ? { ...prev, coins: res.child.coins, ownedStickers: res.child.ownedStickers } : prev);
      setChildList((prev) => prev.map(c => c._id === selectedChild ? { ...c, coins: res.child.coins, ownedStickers: res.child.ownedStickers } : c));
      setBuyAnimation(stickerSlug);
      playSuccess();
      setTimeout(() => setBuyAnimation(null), 1000);
    } catch (err) {
      alert(err.message || 'Could not buy sticker');
    }
    setBuying(null);
  }

  function toggleEquip(slug) {
    playClick();
    setEquipped(prev => {
      if (prev.includes(slug)) return prev.filter(s => s !== slug);
      if (prev.length >= 5) return prev;
      return [...prev, slug];
    });
  }

  async function saveEquipped() {
    if (!selectedChild) return;
    setEquipping(true);
    try {
      await stickersApi.equip(selectedChild, equipped);
      playSuccess();
    } catch (_) {}
    setEquipping(false);
  }

  if (loading) return <div className="loading-screen">Loading shop...</div>;

  const owned = new Set(child?.ownedStickers || []);
  const coins = child?.coins || 0;
  const filteredStickers = catFilter === 'all' ? allStickers : allStickers.filter(s => s.category === catFilter);
  const ownedStickers = allStickers.filter(s => owned.has(s.slug));

  return (
    <div className={styles.page}>
      <div className={styles.shopHeader}>
        <div>
          <h1 className={styles.title}>🎁 Sticker Shop</h1>
          <p className={styles.subtitle}>Buy stickers with coins, then equip them on your profile!</p>
        </div>
      </div>

      {childList.length > 0 && (
        <div className={styles.childBanner}>
          <span className={styles.childAvatar}>{child?.avatarConfig?.emoji || '👤'}</span>
          <div className={styles.childInfo}>
            <span className={styles.childName}>{child?.name || 'Select child'}</span>
            {childList.length > 1 && (
              <select value={selectedChild} onChange={(e) => selectChild(e.target.value)} className={styles.select}>
                {childList.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            )}
          </div>
          <div className={styles.coinsBadge}>
            <span className={styles.coinsIcon}>🪙</span>
            <span className={styles.coinsValue}>{coins}</span>
            <span className={styles.coinsLabel}>coins</span>
          </div>
        </div>
      )}

      {/* Equipped stickers display */}
      <div className={styles.equippedSection}>
        <h3 className={styles.equippedTitle}>My Display ({equipped.length}/5)</h3>
        <p className={styles.equippedDesc}>These stickers show on your profile card!</p>
        <div className={styles.equippedSlots}>
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className={`${styles.equippedSlot} ${equipped[i] ? styles.equippedFilled : ''}`}>
              {equipped[i] ? (() => {
                const stk = allStickers.find(s => s.slug === equipped[i]);
                return stk?.imageUrl ? (
                  <img src={stk.imageUrl} alt={stk.name} className={styles.equippedImg} />
                ) : (
                  <span className={styles.equippedEmoji}>{stk?.emoji || '?'}</span>
                );
              })() : (
                <span className={styles.emptySlot}>+</span>
              )}
            </div>
          ))}
        </div>
        {JSON.stringify(equipped) !== JSON.stringify(child?.equippedStickers || []) && (
          <button type="button" onClick={saveEquipped} disabled={equipping} className={styles.saveEquipBtn}>
            {equipping ? 'Saving...' : '💾 Save Display'}
          </button>
        )}
      </div>

      <div className={styles.tabs}>
        <button type="button" onClick={() => setTab('shop')} className={tab === 'shop' ? styles.tabActive : styles.tab}>
          🛒 Shop
        </button>
        <button type="button" onClick={() => setTab('album')} className={tab === 'album' ? styles.tabActive : styles.tab}>
          📖 My Album ({owned.size}/{allStickers.length})
        </button>
      </div>

      {tab === 'shop' && (
        <>
          <div className={styles.catFilters}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setCatFilter(cat)}
                className={catFilter === cat ? styles.catActive : styles.catBtn}
              >
                {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
          <div className={styles.grid}>
            {filteredStickers.map((s) => {
              const isOwned = owned.has(s.slug);
              const canAfford = coins >= s.price;
              const justBought = buyAnimation === s.slug;
              return (
                <div key={s.slug} className={`${styles.card} ${isOwned ? styles.cardOwned : ''} ${justBought ? styles.cardBounce : ''}`}>
                  {s.imageUrl ? (
                    <img src={s.imageUrl} alt={s.name} className={styles.stickerImg} loading="lazy" />
                  ) : (
                    <span className={styles.stickerEmoji}>{s.emoji}</span>
                  )}
                  <span className={styles.stickerName}>{s.name}</span>
                  <span className={styles.stickerPrice}>🪙 {s.price}</span>
                  {isOwned ? (
                    <button type="button" onClick={() => toggleEquip(s.slug)} className={`${styles.equipBtn} ${equipped.includes(s.slug) ? styles.equipped : ''}`}>
                      {equipped.includes(s.slug) ? '⭐ Displayed' : 'Equip'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleBuy(s.slug)}
                      disabled={!canAfford || buying === s.slug}
                      className={styles.buyBtn}
                    >
                      {buying === s.slug ? '...' : canAfford ? '🛒 Buy' : '🔒 Need coins'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {tab === 'album' && (
        <div className={styles.albumSection}>
          {ownedStickers.length === 0 ? (
            <div className={styles.emptyAlbum}>
              <span style={{ fontSize: '3rem' }}>📖</span>
              <h3>Your sticker album is empty!</h3>
              <p>Play games to earn coins, then buy stickers from the shop.</p>
              <Link to="/games" className={styles.playLink}>🎮 Play Games to Earn Coins</Link>
            </div>
          ) : (
            <>
              <div className={styles.albumProgress}>
                <div className={styles.albumBar}>
                  <div className={styles.albumFill} style={{ width: `${(owned.size / allStickers.length) * 100}%` }} />
                </div>
                <span className={styles.albumCount}>{owned.size} of {allStickers.length} collected</span>
              </div>
              <div className={styles.albumGrid}>
                {allStickers.map(s => {
                  const isOwned = owned.has(s.slug);
                  return (
                    <div key={s.slug} className={`${styles.albumCard} ${isOwned ? styles.albumOwned : styles.albumLocked}`}>
                      {isOwned && s.imageUrl ? (
                        <img src={s.imageUrl} alt={s.name} className={styles.albumImg} loading="lazy" />
                      ) : (
                        <span className={styles.albumEmoji}>{isOwned ? s.emoji : '❓'}</span>
                      )}
                      <span className={styles.albumName}>{isOwned ? s.name : '???'}</span>
                      {isOwned && equipped.includes(s.slug) && (
                        <span className={styles.albumStar}>⭐</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
