'use client';

// 네이털 차트 휠 (SVG)
// 바깥 링: 황도 12궁 · 중간 링: 하우스 · 안쪽: 행성과 어스펙트 선

import { ZODIAC_SIGNS, ZODIAC_ELEMENT_COLOR } from '../lib/zodiac';
import { ASPECT_TYPES } from '../lib/astro';

const C = 230; // 중심
const R_OUTER = 222;
const R_SIGN_IN = 190;
const R_HOUSE_IN = 152;
const R_ASPECT = 96;

const rad = (x) => (x * Math.PI) / 180;

export default function NatalChart({ chart }) {
  const { planets, asc, mc, houses, timeKnown } = chart;
  const ref = asc ?? 0; // 회전 기준: 상승점(없으면 양자리 0도)을 왼쪽에

  const pt = (lon, r) => {
    const a = 180 + ref - lon;
    return [C + r * Math.cos(rad(a)), C + r * Math.sin(rad(a))];
  };

  // 행성 글리프 겹침 방지: 가까운 행성 무리는 반지름 3단계로 번갈아 배치
  const LEVELS = [138, 121, 104];
  const sorted = [...planets].sort((a, b) => a.lon - b.lon);
  const radiusOf = {};
  let prevLon = null;
  let level = 0;
  for (const p of sorted) {
    const gap = prevLon === null ? 999 : Math.min(Math.abs(p.lon - prevLon), 360 - Math.abs(p.lon - prevLon));
    level = gap < 10 ? (level + 1) % 3 : 0;
    radiusOf[p.key] = LEVELS[level];
    prevLon = p.lon;
  }

  return (
    <svg viewBox="-20 -14 500 488" className="natal-svg" role="img" aria-label="네이털 차트">
      {/* 링 */}
      <circle cx={C} cy={C} r={R_OUTER} className="ring" />
      <circle cx={C} cy={C} r={R_SIGN_IN} className="ring" />
      <circle cx={C} cy={C} r={R_HOUSE_IN} className="ring subtle" />
      <circle cx={C} cy={C} r={R_ASPECT} className="ring subtle" />

      {/* 5도 눈금 */}
      {Array.from({ length: 72 }, (_, i) => {
        const lon = i * 5;
        const major = i % 6 === 0;
        const [x1, y1] = pt(lon, R_SIGN_IN);
        const [x2, y2] = pt(lon, R_SIGN_IN - (major ? 7 : 4));
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} className={major ? 'tick major' : 'tick'} />;
      })}

      {/* 별자리 경계선과 글리프 */}
      {ZODIAC_SIGNS.map((s, i) => {
        const start = i * 30;
        const [x1, y1] = pt(start, R_SIGN_IN);
        const [x2, y2] = pt(start, R_OUTER);
        const [gx, gy] = pt(start + 15, (R_OUTER + R_SIGN_IN) / 2);
        return (
          <g key={s.id}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} className="sep" />
            <text x={gx} y={gy} className="sign-glyph" fill={ZODIAC_ELEMENT_COLOR[s.element]}>
              {s.emoji}
            </text>
          </g>
        );
      })}

      {/* 하우스 경계선과 번호 (출생 시각을 아는 경우) */}
      {houses &&
        houses.map((cusp, i) => {
          const [x1, y1] = pt(cusp, R_ASPECT);
          const [x2, y2] = pt(cusp, R_SIGN_IN);
          const [nx, ny] = pt(cusp + 15, (R_HOUSE_IN + R_ASPECT) / 2 + 8);
          return (
            <g key={i}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} className={i % 3 === 0 ? 'sep strong' : 'sep subtle'} />
              <text x={nx} y={ny} className="house-num">{i + 1}</text>
            </g>
          );
        })}

      {/* AC / MC 라벨 */}
      {asc != null && (
        <text x={C - R_OUTER - 2} y={C + 4} className="angle-label" textAnchor="end">AC</text>
      )}
      {mc != null && (() => {
        const [mx, my] = pt(mc, R_OUTER + 12);
        return <text x={mx} y={my + 4} className="angle-label" textAnchor="middle">MC</text>;
      })()}

      {/* 어스펙트 선 */}
      {chart.aspects.map((a, i) => {
        const [x1, y1] = pt(a.a.lon, R_ASPECT);
        const [x2, y2] = pt(a.b.lon, R_ASPECT);
        const opacity = 0.85 - (a.orb / a.type.orb) * 0.45;
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={a.type.color} strokeWidth={1.3} opacity={opacity} />
        );
      })}

      {/* 행성 */}
      {planets.map((p) => {
        const r = radiusOf[p.key];
        const [px, py] = pt(p.lon, r);
        const [tx1, ty1] = pt(p.lon, R_ASPECT);
        const [tx2, ty2] = pt(p.lon, R_ASPECT + 6);
        const [dx, dy] = pt(p.lon, r + 15);
        return (
          <g key={p.key}>
            <line x1={tx1} y1={ty1} x2={tx2} y2={ty2} stroke={p.color} strokeWidth={1.6} />
            <circle cx={px} cy={py} r={11} className="planet-bg" />
            <text x={px} y={py + 4.5} className="planet-glyph" fill={p.color}>{p.glyph}</text>
            <text x={dx} y={dy + 3} className="planet-deg">{Math.round(p.degInSign)}°</text>
          </g>
        );
      })}

      {/* 중앙 */}
      <text x={C} y={C - 2} className="center-label" textAnchor="middle">
        {timeKnown ? 'Natal Chart' : 'Natal Chart*'}
      </text>
      <text x={C} y={C + 14} className="center-sub" textAnchor="middle">
        {timeKnown ? '' : '정오 기준'}
      </text>
    </svg>
  );
}

export function AspectLegend() {
  return (
    <div className="aspect-legend">
      {ASPECT_TYPES.map((t) => (
        <span key={t.key} className="legend-item">
          <span className="legend-line" style={{ background: t.color }} />
          {t.name.split(' ')[0]} {t.angle}°
        </span>
      ))}
    </div>
  );
}
