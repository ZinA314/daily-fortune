'use client';

// 네이털 차트 휠 + 부속 정보 (Astro.com / Astro-Seek 스타일)
// 바깥 링: 황도 12궁(원소 컬러) · 중간 링: 하우스 · 안쪽: 행성과 어스펙트 선

import { ZODIAC_SIGNS, ZODIAC_ELEMENT_COLOR } from '../lib/zodiac';
import { ASPECT_TYPES, degMin } from '../lib/astro';

const C = 230; // 중심
const R_OUTER = 222;
const R_SIGN_IN = 190;
const R_HOUSE_IN = 152;
const R_ASPECT = 96;

const rad = (x) => (x * Math.PI) / 180;
const MODALITY = ['활동', '고정', '변통']; // sign.id % 3

export default function NatalChart({ chart }) {
  const { planets, node, asc, mc, houses, timeKnown } = chart;
  const ref = asc ?? 0; // 회전 기준: 상승점(없으면 양자리 0도)을 왼쪽에

  const pt = (lon, r) => {
    const a = 180 + ref - lon;
    return [C + r * Math.cos(rad(a)), C + r * Math.sin(rad(a))];
  };

  // 원소 컬러 사인 아크 (부채꼴 띠)
  const arcPath = (startLon, endLon, r) => {
    const [x1, y1] = pt(startLon, r);
    const [x2, y2] = pt(endLon, r);
    return { x1, y1, x2, y2 };
  };

  const bodies = [...planets, node];

  // 행성 글리프 겹침 방지: 가까운 행성 무리는 반지름 3단계로 번갈아 배치
  const LEVELS = [138, 121, 104];
  const sorted = [...bodies].sort((a, b) => a.lon - b.lon);
  const radiusOf = {};
  let prevLon = null;
  let level = 0;
  for (const p of sorted) {
    const gap = prevLon === null ? 999 : Math.min(Math.abs(p.lon - prevLon), 360 - Math.abs(p.lon - prevLon));
    level = gap < 11 ? (level + 1) % 3 : 0;
    radiusOf[p.key] = LEVELS[level];
    prevLon = p.lon;
  }

  const axisEnds = (lon) => {
    const [x1, y1] = pt(lon, R_SIGN_IN);
    const [x2, y2] = pt(lon + 180, R_SIGN_IN);
    return { x1, y1, x2, y2 };
  };

  return (
    <svg viewBox="-24 -18 508 496" className="natal-svg" role="img" aria-label="네이털 차트">
      <defs>
        <marker id="axis-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 1 L 9 5 L 0 9 z" className="axis-arrow" />
        </marker>
      </defs>

      {/* 원소 컬러 사인 띠 */}
      {ZODIAC_SIGNS.map((s) => {
        const mid = (R_OUTER + R_SIGN_IN) / 2;
        const start = s.id * 30;
        const [sx, sy] = pt(start, mid);
        const [ex, ey] = pt(start + 30, mid);
        const a0 = 180 + ref - start;
        const largeArc = 0;
        // 화면상 반시계 방향 진행 → sweep=0
        return (
          <path key={s.id}
            d={`M ${sx} ${sy} A ${mid} ${mid} 0 ${largeArc} 0 ${ex} ${ey}`}
            fill="none" stroke={ZODIAC_ELEMENT_COLOR[s.element]} strokeOpacity="0.13"
            strokeWidth={R_OUTER - R_SIGN_IN} />
        );
      })}

      {/* 링 */}
      <circle cx={C} cy={C} r={R_OUTER} className="ring" />
      <circle cx={C} cy={C} r={R_SIGN_IN} className="ring" />
      <circle cx={C} cy={C} r={R_HOUSE_IN} className="ring subtle" />
      <circle cx={C} cy={C} r={R_ASPECT} className="ring subtle" />

      {/* 1도 눈금 (5도·10도는 길게) */}
      {Array.from({ length: 360 }, (_, i) => {
        const len = i % 10 === 0 ? 7 : i % 5 === 0 ? 5 : 2.5;
        const [x1, y1] = pt(i, R_SIGN_IN);
        const [x2, y2] = pt(i, R_SIGN_IN - len);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} className={i % 10 === 0 ? 'tick major' : 'tick'} />;
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
            <text x={gx} y={gy + 6} className="sign-glyph" fill={ZODIAC_ELEMENT_COLOR[s.element]}>
              {s.emoji}
            </text>
          </g>
        );
      })}

      {/* 하우스 경계선과 번호 */}
      {houses &&
        houses.map((cusp, i) => {
          const [x1, y1] = pt(cusp, R_ASPECT);
          const [x2, y2] = pt(cusp, R_SIGN_IN);
          const [nx, ny] = pt(cusp + 15, (R_HOUSE_IN + R_ASPECT) / 2 + 10);
          return (
            <g key={i}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} className="sep subtle" />
              <text x={nx} y={ny} className="house-num">{i + 1}</text>
            </g>
          );
        })}

      {/* AC-DC / MC-IC 축선 */}
      {asc != null && (() => {
        const a = axisEnds(asc);
        const m = axisEnds(mc);
        return (
          <g>
            <line {...a} className="axis" markerStart="url(#axis-arrow)" />
            <line x1={m.x2} y1={m.y2} x2={m.x1} y2={m.y1} className="axis" markerEnd="url(#axis-arrow)" />
          </g>
        );
      })()}

      {/* AC / DC / MC / IC 라벨 */}
      {asc != null && (
        <>
          {[[asc, 'AC'], [asc + 180, 'DC'], [mc, 'MC'], [mc + 180, 'IC']].map(([lon, label]) => {
            const [lx, ly] = pt(lon, R_OUTER + 13);
            return <text key={label} x={lx} y={ly + 4} className="angle-label" textAnchor="middle">{label}</text>;
          })}
          {(() => {
            const [dx, dy] = pt(asc, R_OUTER + 13);
            return (
              <text x={dx} y={dy + 18} className="angle-deg" textAnchor="middle">
                {degMin(asc % 30)}
              </text>
            );
          })()}
        </>
      )}

      {/* 어스펙트 선 */}
      {chart.aspects.map((a, i) => {
        const [x1, y1] = pt(a.a.lon, R_ASPECT);
        const [x2, y2] = pt(a.b.lon, R_ASPECT);
        const opacity = 0.9 - (a.orb / a.type.orb) * 0.5;
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={a.type.color} strokeWidth={1.3} opacity={opacity} />
        );
      })}

      {/* 행성 + 노드 */}
      {bodies.map((p) => {
        const r = radiusOf[p.key];
        const [px, py] = pt(p.lon, r);
        const [tx1, ty1] = pt(p.lon, R_ASPECT);
        const [tx2, ty2] = pt(p.lon, R_ASPECT + 6);
        const [ox1, oy1] = pt(p.lon, R_SIGN_IN - 8);
        const [ox2, oy2] = pt(p.lon, R_SIGN_IN);
        const [dx, dy] = pt(p.lon, r + 16);
        return (
          <g key={p.key}>
            <line x1={tx1} y1={ty1} x2={tx2} y2={ty2} stroke={p.color} strokeWidth={1.6} />
            <line x1={ox1} y1={oy1} x2={ox2} y2={oy2} stroke={p.color} strokeWidth={1.2} opacity="0.6" />
            <circle cx={px} cy={py} r={11.5} className="planet-bg" />
            <text x={px} y={py + 4.5} className="planet-glyph" fill={p.color}>{p.glyph}</text>
            <text x={dx} y={dy + 3} className="planet-deg">
              {degMin(p.degInSign)}{p.retrograde ? ' ℞' : ''}
            </text>
          </g>
        );
      })}

      {/* 중앙 */}
      <text x={C} y={C - 2} className="center-label" textAnchor="middle">
        Natal Chart
      </text>
      {!timeKnown && (
        <text x={C} y={C + 14} className="center-sub" textAnchor="middle">정오 기준</text>
      )}
    </svg>
  );
}

export function AspectLegend() {
  return (
    <div className="aspect-legend">
      {ASPECT_TYPES.map((t) => (
        <span key={t.key} className="legend-item">
          <span className="legend-line" style={{ background: t.color }} />
          {t.symbol} {t.name.split(' ')[0]} {t.angle}°
        </span>
      ))}
    </div>
  );
}

// 행성 위치표 (행성 | 별자리 | 도수 | 하우스)
export function PlanetTable({ chart }) {
  const rows = [...chart.planets, chart.node];
  return (
    <div className="history-scroll">
      <table className="planet-table">
        <thead>
          <tr>
            <th>천체</th>
            <th>별자리</th>
            <th>도수</th>
            {chart.houses && <th>하우스</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.key}>
              <td className="pt-name">
                <span style={{ color: p.color }}>{p.glyph}</span> {p.name}
                {p.retrograde && <span className="pt-retro">℞</span>}
              </td>
              <td>
                {p.sign.emoji} {p.sign.name}
              </td>
              <td className="pt-deg">{degMin(p.degInSign)}</td>
              {chart.houses && <td className="pt-house">{p.house}</td>}
            </tr>
          ))}
          {chart.asc != null && (
            <tr>
              <td className="pt-name"><span className="pt-axis">AC</span> 상승점</td>
              <td>{ZODIAC_SIGNS[Math.floor(chart.asc / 30)].emoji} {ZODIAC_SIGNS[Math.floor(chart.asc / 30)].name}</td>
              <td className="pt-deg">{degMin(chart.asc % 30)}</td>
              <td className="pt-house">1</td>
            </tr>
          )}
          {chart.mc != null && (
            <tr>
              <td className="pt-name"><span className="pt-axis">MC</span> 중천점</td>
              <td>{ZODIAC_SIGNS[Math.floor(chart.mc / 30)].emoji} {ZODIAC_SIGNS[Math.floor(chart.mc / 30)].name}</td>
              <td className="pt-deg">{degMin(chart.mc % 30)}</td>
              <td className="pt-house">{Math.floor(((chart.mc - chart.asc + 360) % 360) / 30) + 1}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// 원소 × 특질 분포표
export function ElementBalance({ chart }) {
  const elements = ['불', '흙', '공기', '물'];
  const cell = {};
  for (const e of elements) for (const mo of MODALITY) cell[e + mo] = [];
  for (const p of chart.planets) {
    cell[p.sign.element + MODALITY[p.sign.id % 3]].push(p);
  }
  const elemCount = (e) => chart.planets.filter((p) => p.sign.element === e).length;
  const modCount = (mo) => chart.planets.filter((p) => MODALITY[p.sign.id % 3] === mo).length;

  return (
    <div className="history-scroll">
      <table className="balance-table">
        <thead>
          <tr>
            <th></th>
            {MODALITY.map((mo) => <th key={mo}>{mo}</th>)}
            <th>합계</th>
          </tr>
        </thead>
        <tbody>
          {elements.map((e) => (
            <tr key={e}>
              <th style={{ color: ZODIAC_ELEMENT_COLOR[e] }}>{e}</th>
              {MODALITY.map((mo) => (
                <td key={mo}>
                  {cell[e + mo].map((p) => (
                    <span key={p.key} style={{ color: p.color }} title={p.name}>{p.glyph}</span>
                  ))}
                </td>
              ))}
              <td className="bt-total">{elemCount(e)}</td>
            </tr>
          ))}
          <tr>
            <th>합계</th>
            {MODALITY.map((mo) => <td key={mo} className="bt-total">{modCount(mo)}</td>)}
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// 삼각형 어스펙트 그리드
export function AspectGrid({ chart }) {
  const ps = chart.planets;
  const lookup = {};
  for (const a of chart.aspects) {
    lookup[a.a.key + '|' + a.b.key] = a;
    lookup[a.b.key + '|' + a.a.key] = a;
  }
  return (
    <div className="history-scroll">
      <table className="aspect-grid">
        <tbody>
          {ps.slice(1).map((row, i) => (
            <tr key={row.key}>
              <th style={{ color: row.color }}>{row.glyph}</th>
              {ps.slice(0, i + 1).map((col) => {
                const a = lookup[row.key + '|' + col.key];
                return (
                  <td key={col.key}>
                    {a && (
                      <span style={{ color: a.type.color }} title={`${row.name} ${a.type.name} ${col.name} (오브 ${a.orb.toFixed(1)}°)`}>
                        {a.type.symbol}
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
          <tr className="ag-footer">
            <th></th>
            {ps.slice(0, ps.length - 1).map((p) => (
              <th key={p.key} style={{ color: p.color }}>{p.glyph}</th>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
