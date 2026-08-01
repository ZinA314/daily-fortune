'use client';

import { useMemo, useRef, useState } from 'react';
import { ELEMENT_COLOR, ELEMENT_EMOJI } from '../lib/saju';
import { TAROT_CARDS } from '../lib/tarot';
import { generateFortune } from '../lib/fortune';
import { logDraw, todayDrawCount } from '../lib/supabase';

const ROMAN = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI'];
const SPREAD_SIZE = 6;

function shuffleSpread() {
  const ids = TAROT_CARDS.map((c) => c.id);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids.slice(0, SPREAD_SIZE);
}

function ElemChip({ element }) {
  return (
    <span className="elem-chip" style={{ background: ELEMENT_COLOR[element] }}>
      {ELEMENT_EMOJI[element]} {element}
    </span>
  );
}

function Pillar({ title, p }) {
  return (
    <div className="pillar">
      <div className="pillar-name">{title}</div>
      <div className="hanja">
        {p.stemHanja}
        <br />
        {p.branchHanja}
      </div>
      <div className="reading">
        {p.stem}{p.branch} · {p.animal}띠
      </div>
      <div style={{ marginTop: 6 }}>
        <ElemChip element={p.stemElement} />
        <ElemChip element={p.branchElement} />
      </div>
    </div>
  );
}

function ScoreRing({ score }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  return (
    <div className="score-ring">
      <svg width="96" height="96" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={r} fill="none" stroke="var(--separator)" strokeWidth="8" />
        <circle
          cx="48"
          cy="48"
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - score / 100)}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.22, 1, 0.36, 1)' }}
        />
      </svg>
      <div className="num">
        {score}
        <span>점</span>
      </div>
    </div>
  );
}

export default function Home() {
  const today = useMemo(() => {
    const now = new Date();
    return { y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() };
  }, []);

  const [birth, setBirth] = useState({ y: 1995, m: 1, d: 1 });
  const [step, setStep] = useState('input'); // 'input' | 'cards'
  const [spread, setSpread] = useState([]);
  const [flippedId, setFlippedId] = useState(null);
  const [result, setResult] = useState(null);
  const [drawCount, setDrawCount] = useState(null);
  const resultRef = useRef(null);

  const years = useMemo(() => {
    const list = [];
    for (let y = today.y; y >= 1930; y--) list.push(y);
    return list;
  }, [today.y]);

  const daysInMonth = new Date(birth.y, birth.m, 0).getDate();

  const startCards = () => {
    setSpread(shuffleSpread());
    setFlippedId(null);
    setResult(null);
    setStep('cards');
  };

  const pickCard = (cardId) => {
    if (flippedId !== null) return;
    setFlippedId(cardId);
    setTimeout(() => {
      const fortune = generateFortune(birth, today, cardId);
      setResult(fortune);
      logDraw({ birth, cardId, cardName: fortune.card.name, score: fortune.score })
        .then(() => todayDrawCount())
        .then((count) => setDrawCount(count));
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    }, 850);
  };

  const retry = () => {
    setSpread(shuffleSpread());
    setFlippedId(null);
    setResult(null);
    setDrawCount(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const sajuPreview = useMemo(() => {
    if (step !== 'cards') return null;
    return generateFortune(birth, today, 0).saju;
  }, [step, birth, today]);

  const dateLabel = `${today.y}년 ${today.m}월 ${today.d}일`;

  return (
    <main className="container">
      <header className="header">
        <div className="date-chip">{dateLabel}</div>
        <h1>
          오늘의 운세<span style={{ color: 'var(--accent)' }}>.</span>
        </h1>
        <p className="subtitle">만세력과 타로가 만나, 당신의 하루를 읽습니다</p>
      </header>

      {step === 'input' && (
        <section className="panel">
          <h2 className="panel-title">생년월일을 알려주세요</h2>
          <p className="panel-caption">양력 기준으로 만세력(사주 명식)을 세워 드립니다.</p>
          <div className="birth-row">
            <div className="field">
              <label htmlFor="by">년</label>
              <select id="by" value={birth.y} onChange={(e) => setBirth((b) => ({ ...b, y: +e.target.value }))}>
                {years.map((y) => (
                  <option key={y} value={y}>{y}년</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="bm">월</label>
              <select id="bm" value={birth.m} onChange={(e) => setBirth((b) => ({ ...b, m: +e.target.value, d: Math.min(b.d, new Date(b.y, +e.target.value, 0).getDate()) }))}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>{m}월</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="bd">일</label>
              <select id="bd" value={birth.d} onChange={(e) => setBirth((b) => ({ ...b, d: +e.target.value }))}>
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>{d}일</option>
                ))}
              </select>
            </div>
          </div>
          <button className="cta" onClick={startCards}>만세력 세우고 카드 뽑기</button>
        </section>
      )}

      {step === 'cards' && sajuPreview && (
        <>
          <section className="panel">
            <h2 className="panel-title">나의 만세력</h2>
            <p className="panel-caption">
              {birth.y}년 {birth.m}월 {birth.d}일생 · 년주 / 월주 / 일주
            </p>
            <div className="pillars">
              <Pillar title="년주 (뿌리)" p={sajuPreview.year} />
              <Pillar title="월주 (환경)" p={sajuPreview.month} />
              <Pillar title="일주 (나)" p={sajuPreview.day} />
            </div>
            <div className="day-master">
              <strong>일간 {sajuPreview.day.stem}({sajuPreview.day.stemHanja})</strong> — {' '}
              {result ? result.dayMasterDesc : generateFortune(birth, today, 0).dayMasterDesc}
            </div>
          </section>

          <section className="panel">
            <h2 className="panel-title">마음이 가는 카드를 한 장 고르세요</h2>
            <p className="panel-caption">당신의 사주 기운과 카드가 만나 오늘의 운세가 완성됩니다.</p>
            <div className="spread">
              {spread.map((cardId) => {
                const card = TAROT_CARDS[cardId];
                const isFlipped = flippedId === cardId;
                return (
                  <button
                    key={cardId}
                    className={`tarot-card${isFlipped ? ' flipped' : ''}`}
                    onClick={() => pickCard(cardId)}
                    disabled={flippedId !== null}
                    aria-label={isFlipped ? `${card.name} 카드` : '뒷면 타로 카드'}
                  >
                    <div className="card-face card-back">
                      <span className="star">✦</span>
                    </div>
                    <div className="card-face card-front">
                      <span className="numeral">{ROMAN[card.id]}</span>
                      <span className="art">{card.emoji}</span>
                      <span className="card-name">{card.name}</span>
                      <span className="card-en">{card.en}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {result && (
            <>
              <section className="panel" ref={resultRef} style={{ scrollMarginTop: 16 }}>
                <div className="score-wrap">
                  <ScoreRing score={result.score} />
                  <div className="score-info">
                    <span className="relation">{result.relationLabel}</span>
                    <div className="comment">{result.scoreComment}</div>
                  </div>
                </div>
                {drawCount != null && (
                  <p className="draw-count">🔮 오늘 {drawCount.toLocaleString()}번째로 뽑힌 운세예요</p>
                )}
                <p className="fortune-text">
                  오늘의 일진은 <strong>{result.todaySaju.day.stem}{result.todaySaju.day.branch}
                  ({result.todaySaju.day.stemHanja}{result.todaySaju.day.branchHanja})</strong>,{' '}
                  {ELEMENT_EMOJI[result.todayElement]} {result.todayElement}(
                  {result.todayElement === result.myElement ? '나와 같은' : '나의 ' + result.myElement + ' 기운을 만나는'}
                  ) 기운의 날입니다. {result.overall}
                </p>
              </section>

              <section className="panel">
                <h2 className="panel-title">
                  {result.card.emoji} {result.card.name} <span style={{ color: 'var(--text-tertiary)', fontWeight: 600, fontSize: 15 }}>{result.card.en}</span>
                </h2>
                <div className="keywords">
                  {result.card.keywords.map((k) => (
                    <span className="keyword" key={k}>#{k}</span>
                  ))}
                </div>
                <p className="fortune-text">{result.card.message}</p>
                <div className="section-list" style={{ marginTop: 16 }}>
                  <div className="f-section">
                    <span className="icon">💗</span>
                    <div>
                      <div className="label">애정운</div>
                      <div className="body">{result.card.love}</div>
                    </div>
                  </div>
                  <div className="f-section">
                    <span className="icon">💰</span>
                    <div>
                      <div className="label">재물운</div>
                      <div className="body">{result.card.money}</div>
                    </div>
                  </div>
                  <div className="f-section">
                    <span className="icon">💼</span>
                    <div>
                      <div className="label">직장 · 학업운</div>
                      <div className="body">{result.card.work}</div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="panel">
                <h2 className="panel-title">오늘의 행운</h2>
                <p className="panel-caption">사주와 카드의 기운이 알려주는 행운 포인트</p>
                <div className="lucky-grid">
                  <div className="lucky-cell">
                    <span className="l-emoji">{result.luckyItem.emoji}</span>
                    <div className="l-label">행운의 아이템</div>
                    <div className="l-value">{result.luckyItem.item}</div>
                  </div>
                  <div className="lucky-cell">
                    <span className="l-emoji">🎨</span>
                    <div className="l-label">행운의 색</div>
                    <div className="l-value">
                      <span className="color-dot" style={{ background: result.luckyColor.hex }} />
                      {result.luckyColor.color}
                    </div>
                  </div>
                  <div className="lucky-cell">
                    <span className="l-emoji">🔢</span>
                    <div className="l-label">행운의 숫자</div>
                    <div className="l-value">{result.luckyNumber}</div>
                  </div>
                  <div className="lucky-cell">
                    <span className="l-emoji">⏰</span>
                    <div className="l-label">행운의 시간</div>
                    <div className="l-value">{result.luckyTime}</div>
                  </div>
                  <div className="lucky-cell">
                    <span className="l-emoji">🧭</span>
                    <div className="l-label">행운의 방향</div>
                    <div className="l-value">{result.luckyDirection}</div>
                  </div>
                  <div className="lucky-cell">
                    <span className="l-emoji">{ELEMENT_EMOJI[result.todayElement]}</span>
                    <div className="l-label">오늘의 일진</div>
                    <div className="l-value">
                      {result.todaySaju.day.stem}{result.todaySaju.day.branch}일 · {result.todaySaju.day.animal}
                    </div>
                  </div>
                </div>
                <div className="actions">
                  <button className="cta secondary" style={{ marginTop: 0 }} onClick={() => setStep('input')}>
                    생년월일 변경
                  </button>
                  <button className="cta" style={{ marginTop: 0 }} onClick={retry}>
                    카드 다시 뽑기
                  </button>
                </div>
              </section>
            </>
          )}
        </>
      )}

      <p className="footer-note">
        절기 경계는 근사값을 사용하며, 운세는 재미로 봐주세요 ✨
      </p>
    </main>
  );
}
