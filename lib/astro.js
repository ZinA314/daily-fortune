// 네이털 차트용 행성 위치 계산 (Paul Schlyter 근사 알고리즘 기반)
// 황경 기준 정확도: 태양 ~0.01°, 달 ~0.3°, 행성 ~1° 이내 — 별자리·어스펙트 표시용으로 충분

import { ZODIAC_SIGNS } from './zodiac.js';

const rev = (x) => ((x % 360) + 360) % 360;
const rad = (x) => (x * Math.PI) / 180;
const deg = (x) => (x * 180) / Math.PI;
const sind = (x) => Math.sin(rad(x));
const cosd = (x) => Math.cos(rad(x));

// Schlyter 기준 일수: 2000-01-01 0h UT 근방 기준 epoch
function dayNumber(y, m, d, utHours) {
  return (
    367 * y -
    Math.floor((7 * (y + Math.floor((m + 9) / 12))) / 4) +
    Math.floor((275 * m) / 9) +
    d - 730530 + utHours / 24
  );
}

// 케플러 방정식 풀이 (E, M: 도 단위, e: 이심률)
function solveKepler(M, e) {
  let E = M + deg(e * sind(M) * (1 + e * cosd(M)));
  for (let i = 0; i < 10; i++) {
    const dE = (E - deg(e) * sind(E) - M) / (1 - e * cosd(E));
    E -= dE;
    if (Math.abs(dE) < 1e-6) break;
  }
  return E;
}

// 궤도 요소 → 궤도면 좌표 → 황도 좌표(일심)
function orbitalToEcliptic(N, i, w, a, e, M) {
  const E = solveKepler(rev(M), e);
  const xv = a * (cosd(E) - e);
  const yv = a * Math.sqrt(1 - e * e) * sind(E);
  const v = rev(deg(Math.atan2(yv, xv)));
  const r = Math.sqrt(xv * xv + yv * yv);
  const xh = r * (cosd(N) * cosd(v + w) - sind(N) * sind(v + w) * cosd(i));
  const yh = r * (sind(N) * cosd(v + w) + cosd(N) * sind(v + w) * cosd(i));
  const zh = r * sind(v + w) * sind(i);
  return { xh, yh, zh, r, v };
}

// 태양의 지심 황경 및 위치
function sunPosition(d) {
  const w = 282.9404 + 4.70935e-5 * d;
  const e = 0.016709 - 1.151e-9 * d;
  const M = rev(356.047 + 0.9856002585 * d);
  const E = solveKepler(M, e);
  const xv = cosd(E) - e;
  const yv = Math.sqrt(1 - e * e) * sind(E);
  const v = rev(deg(Math.atan2(yv, xv)));
  const r = Math.sqrt(xv * xv + yv * yv);
  const lon = rev(v + w);
  return { lon, r, xs: r * cosd(lon), ys: r * sind(lon), Ms: M, ws: w };
}

// 달의 지심 황경 (주요 섭동항 포함)
function moonLongitude(d, sun) {
  const N = 125.1228 - 0.0529538083 * d;
  const i = 5.1454;
  const w = 318.0634 + 0.1643573223 * d;
  const a = 60.2666;
  const e = 0.0549;
  const M = rev(115.3654 + 13.0649929509 * d);
  const p = orbitalToEcliptic(N, i, w, a, e, M);
  let lon = rev(deg(Math.atan2(p.yh, p.xh)));

  const Lm = rev(N + w + M); // 달 평균 황경
  const Ls = rev(sun.ws + sun.Ms); // 태양 평균 황경
  const D = rev(Lm - Ls); // 평균 이각
  const F = rev(Lm - N); // 위도 편각
  const Mm = M;
  const Ms = sun.Ms;

  lon +=
    -1.274 * sind(Mm - 2 * D) +
    0.658 * sind(2 * D) -
    0.186 * sind(Ms) -
    0.059 * sind(2 * Mm - 2 * D) -
    0.057 * sind(Mm - 2 * D + Ms) +
    0.053 * sind(Mm + 2 * D) +
    0.046 * sind(2 * D - Ms) +
    0.041 * sind(Mm - Ms) -
    0.035 * sind(D) -
    0.031 * sind(Mm + Ms) -
    0.015 * sind(2 * F - 2 * D) +
    0.011 * sind(Mm - 4 * D);
  return rev(lon);
}

// 행성 궤도 요소 (Schlyter)
const PLANET_ELEMENTS = {
  mercury: (d) => [48.3313 + 3.24587e-5 * d, 7.0047 + 5.0e-8 * d, 29.1241 + 1.01444e-5 * d, 0.387098, 0.205635 + 5.59e-10 * d, 168.6562 + 4.0923344368 * d],
  venus: (d) => [76.6799 + 2.4659e-5 * d, 3.3946 + 2.75e-8 * d, 54.891 + 1.38374e-5 * d, 0.72333, 0.006773 - 1.302e-9 * d, 48.0052 + 1.6021302244 * d],
  mars: (d) => [49.5574 + 2.11081e-5 * d, 1.8497 - 1.78e-8 * d, 286.5016 + 2.92961e-5 * d, 1.523688, 0.093405 + 2.516e-9 * d, 18.6021 + 0.5240207766 * d],
  jupiter: (d) => [100.4542 + 2.76854e-5 * d, 1.303 - 1.557e-7 * d, 273.8777 + 1.64505e-5 * d, 5.20256, 0.048498 + 4.469e-9 * d, 19.895 + 0.0830853001 * d],
  saturn: (d) => [113.6634 + 2.3898e-5 * d, 2.4886 - 1.081e-7 * d, 339.3939 + 2.97661e-5 * d, 9.55475, 0.055546 - 9.499e-9 * d, 316.967 + 0.0334442282 * d],
  uranus: (d) => [74.0005 + 1.3978e-5 * d, 0.7733 + 1.9e-8 * d, 96.6612 + 3.0565e-5 * d, 19.18171 - 1.55e-8 * d, 0.047318 + 7.45e-9 * d, 142.5905 + 0.011725806 * d],
  neptune: (d) => [131.7806 + 3.0173e-5 * d, 1.77 - 2.55e-7 * d, 272.8461 - 6.027e-6 * d, 30.05826 + 3.313e-8 * d, 0.008606 + 2.15e-9 * d, 260.2471 + 0.005995147 * d],
};

function planetLongitude(key, d, sun) {
  const [N, i, w, a, e, M] = PLANET_ELEMENTS[key](d);
  const p = orbitalToEcliptic(N, i, w, a, e, rev(M));
  // 일심 → 지심 변환 (태양 위치 더하기)
  const xg = p.xh + sun.xs;
  const yg = p.yh + sun.ys;
  return rev(deg(Math.atan2(yg, xg)));
}

// 명왕성 황경 (Schlyter 급수 근사)
function plutoLongitude(d) {
  const S = 50.03 + 0.033459652 * d;
  const P = 238.95 + 0.003968789 * d;
  return rev(
    238.9508 + 0.00400703 * d -
    19.799 * sind(P) + 19.848 * cosd(P) +
    0.897 * sind(2 * P) - 4.956 * cosd(2 * P) +
    0.61 * sind(3 * P) + 1.211 * cosd(3 * P) -
    0.341 * sind(4 * P) - 0.19 * cosd(4 * P) +
    0.128 * sind(5 * P) - 0.034 * cosd(5 * P) -
    0.038 * sind(6 * P) + 0.031 * cosd(6 * P) +
    0.02 * sind(S - P) - 0.01 * cosd(S - P)
  );
}

// 지방 항성시(도) — 상승점·중천점 계산용
function localSiderealDeg(d, ut, lonEast) {
  // d는 UT 포함 일수이므로 JD - 2451543.5 = d 관계 사용
  const jd = d + 2451543.5;
  const t = jd - 2451545.0;
  return rev(280.46061837 + 360.98564736629 * t + lonEast);
}

function ascendantDeg(lst, latitude) {
  const eps = 23.4393;
  const num = -cosd(lst);
  const den = sind(lst) * cosd(eps) + Math.tan(rad(latitude)) * sind(eps);
  return rev(deg(Math.atan2(num, den)) + 180);
}

function midheavenDeg(lst) {
  const eps = 23.4393;
  return rev(deg(Math.atan2(sind(lst), cosd(lst) * cosd(eps))));
}

export const PLANET_INFO = [
  { key: 'sun', name: '태양', glyph: '☉', color: '#ff9500', meaning: '자아와 본질', desc: '내가 세상에 빛나는 방식' },
  { key: 'moon', name: '달', glyph: '☽', color: '#8e8e93', meaning: '감정과 내면', desc: '무의식적 반응과 안정의 조건' },
  { key: 'mercury', name: '수성', glyph: '☿', color: '#af52de', meaning: '사고와 소통', desc: '생각하고 말하는 스타일' },
  { key: 'venus', name: '금성', glyph: '♀', color: '#ff2d95', meaning: '사랑과 미감', desc: '애정 표현과 끌리는 것' },
  { key: 'mars', name: '화성', glyph: '♂', color: '#ff3b30', meaning: '열정과 추진력', desc: '욕망을 향해 움직이는 방식' },
  { key: 'jupiter', name: '목성', glyph: '♃', color: '#30b0c7', meaning: '행운과 확장', desc: '성장의 기회가 오는 영역' },
  { key: 'saturn', name: '토성', glyph: '♄', color: '#a2845e', meaning: '책임과 단련', desc: '인생의 과제와 단단해지는 지점' },
  { key: 'uranus', name: '천왕성', glyph: '♅', color: '#32ade6', meaning: '혁신과 자유', desc: '남다름이 드러나는 방식' },
  { key: 'neptune', name: '해왕성', glyph: '♆', color: '#5e5ce6', meaning: '꿈과 영감', desc: '상상력과 이상이 흐르는 곳' },
  { key: 'pluto', name: '명왕성', glyph: '♇', color: '#636366', meaning: '변혁과 심층', desc: '깊은 변화가 일어나는 영역' },
];

// 어스펙트 정의 (각도, 허용 오브, 표기)
export const ASPECT_TYPES = [
  { key: 'conjunction', name: '합 (Conjunction)', symbol: '☌', angle: 0, orb: 8, color: '#8e8e93', meaning: '에너지가 하나로 합쳐짐' },
  { key: 'opposition', name: '충 (Opposition)', symbol: '☍', angle: 180, orb: 7, color: '#ff3b30', meaning: '갈등 속에서 균형을 찾음' },
  { key: 'trine', name: '삼합 (Trine)', symbol: '△', angle: 120, orb: 6, color: '#34c759', meaning: '타고난 재능과 자연스러운 흐름' },
  { key: 'square', name: '사각 (Square)', symbol: '□', angle: 90, orb: 6, color: '#ff9500', meaning: '도전을 통한 성장' },
  { key: 'sextile', name: '육합 (Sextile)', symbol: '✱', angle: 60, orb: 4, color: '#5ac8fa', meaning: '기회와 협력의 가능성' },
];

function signOf(lon) {
  const idx = Math.floor(rev(lon) / 30) % 12;
  return { sign: ZODIAC_SIGNS[idx], degInSign: rev(lon) - idx * 30 };
}

// 네이털 차트 계산
// timeKnown=false면 정오(12:00)를 기준으로 행성만 계산 (상승점·하우스 없음)
export function calcNatalChart({ y, m, d, hour, minute, city, timeKnown }) {
  const h = timeKnown ? hour + minute / 60 : 12;
  const ut = h - city.tz;
  const dn = dayNumber(y, m, d, ut);

  const sun = sunPosition(dn);
  const positions = {
    sun: sun.lon,
    moon: moonLongitude(dn, sun),
    mercury: planetLongitude('mercury', dn, sun),
    venus: planetLongitude('venus', dn, sun),
    mars: planetLongitude('mars', dn, sun),
    jupiter: planetLongitude('jupiter', dn, sun),
    saturn: planetLongitude('saturn', dn, sun),
    uranus: planetLongitude('uranus', dn, sun),
    neptune: planetLongitude('neptune', dn, sun),
    pluto: plutoLongitude(dn),
  };

  const planets = PLANET_INFO.map((p) => ({
    ...p,
    lon: positions[p.key],
    ...signOf(positions[p.key]),
  }));

  let asc = null;
  let mc = null;
  let houses = null;
  if (timeKnown) {
    const lst = localSiderealDeg(dn, ut, city.lon);
    asc = ascendantDeg(lst, city.lat);
    mc = midheavenDeg(lst);
    houses = Array.from({ length: 12 }, (_, i) => rev(asc + i * 30)); // 등분 하우스
  }

  // 어스펙트 계산 (행성 10개 쌍별)
  const aspects = [];
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      let diff = Math.abs(planets[i].lon - planets[j].lon);
      if (diff > 180) diff = 360 - diff;
      for (const t of ASPECT_TYPES) {
        const orb = Math.abs(diff - t.angle);
        if (orb <= t.orb) {
          aspects.push({ a: planets[i], b: planets[j], type: t, orb });
          break;
        }
      }
    }
  }
  aspects.sort((x, y2) => x.orb - y2.orb);

  return { planets, asc, mc, houses, aspects, timeKnown };
}
