// 사주(만세력) × 오늘의 일진 × 선택한 타로 카드를 조합해 운세를 생성한다.
// 같은 사람이 같은 날 같은 카드를 뽑으면 항상 같은 결과가 나오도록 시드 기반으로 동작한다.

import { calcSaju, elementRelation, RELATION_LABEL, DAY_MASTER_DESC } from './saju';
import { TAROT_CARDS, LUCKY_ITEMS, LUCKY_COLORS } from './tarot';

// mulberry32 시드 기반 난수 생성기
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(...nums) {
  let h = 2166136261;
  for (const n of nums) {
    h ^= n + 0x9e3779b9;
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];

// 오늘의 일진 오행과 나의 일간 오행 관계별 총운 톤
const RELATION_TONE = {
  same: {
    score: 8,
    lines: [
      '나와 같은 기운이 흐르는 날이라 무엇을 해도 자기다움이 살아납니다. 다만 고집은 반 스푼만 덜어내세요.',
      '동료와 친구의 기운이 강한 날입니다. 혼자보다 함께할 때 운이 배가됩니다.',
      '자신감이 차오르는 하루입니다. 내 페이스대로 가되 주변의 속도도 한 번씩 살펴보세요.',
    ],
  },
  helped: {
    score: 12,
    lines: [
      '하늘이 나를 밀어주는 인성(印星)의 날입니다. 귀인의 도움이나 좋은 소식이 자연스럽게 흘러들어옵니다.',
      '배움과 문서에 관련된 운이 밝습니다. 계약·합격·승인 소식이 있다면 오늘 도착할 확률이 높아요.',
      '어른이나 상사의 지원을 받기 좋은 날입니다. 도움을 청하는 것을 망설이지 마세요.',
    ],
  },
  giving: {
    score: 6,
    lines: [
      '재능을 밖으로 표현하는 식상(食傷)의 날입니다. 말하고, 쓰고, 만드는 모든 활동에서 빛이 납니다.',
      '베푼 만큼 돌아오는 날입니다. 에너지 소모가 크니 저녁에는 충분한 휴식을 챙기세요.',
      '아이디어가 샘솟는 하루입니다. 떠오르는 생각을 꼭 기록해 두세요. 나중에 큰 자산이 됩니다.',
    ],
  },
  gaining: {
    score: 10,
    lines: [
      '내가 주도해서 결실을 거두는 재성(財星)의 날입니다. 금전과 성과에 관한 운이 활발하게 움직입니다.',
      '노력한 만큼 확실하게 손에 쥐는 날입니다. 미뤄둔 협상이나 요청을 오늘 꺼내 보세요.',
      '실속을 챙기기 좋은 하루입니다. 부지런히 움직일수록 주머니가 두둑해집니다.',
    ],
  },
  pressured: {
    score: 3,
    lines: [
      '나를 단련시키는 관성(官星)의 날입니다. 압박이 느껴질 수 있지만 이는 성장의 다른 이름입니다.',
      '규칙과 책임이 강조되는 하루입니다. 기본기에 충실하면 오히려 인정받는 기회가 됩니다.',
      '긴장감이 도는 날이지만, 오늘을 잘 넘기면 당신의 그릇이 한 뼘 커집니다. 무리한 일정만 피하세요.',
    ],
  },
};

const SCORE_COMMENT = [
  [95, '더할 나위 없는 최상의 날'],
  [88, '기회가 스스로 문을 두드리는 날'],
  [80, '기분 좋은 순풍이 부는 날'],
  [72, '무난하고 안정적인 날'],
  [64, '한 템포 쉬어가며 정비하는 날'],
  [0, '신중함이 최고의 방어가 되는 날'],
];

const TIME_SLOTS = ['이른 아침 (5~7시)', '오전 (9~11시)', '한낮 (11~13시)', '오후 (13~15시)', '늦은 오후 (15~17시)', '저녁 (17~19시)', '밤 (19~21시)'];
const DIRECTIONS = ['동쪽', '서쪽', '남쪽', '북쪽', '동남쪽', '동북쪽', '서남쪽', '서북쪽'];

// 생년월일 + 오늘 날짜 + 뽑은 타로 카드 → 운세 결과
export function generateFortune(birth, today, cardId) {
  const saju = calcSaju(birth.y, birth.m, birth.d);
  const todaySaju = calcSaju(today.y, today.m, today.d);
  const card = TAROT_CARDS[cardId];

  const seed = hashSeed(saju.jdn, todaySaju.jdn, cardId);
  const rng = mulberry32(seed);

  const myElement = saju.day.stemElement;
  const todayElement = todaySaju.day.stemElement;
  const relation = elementRelation(myElement, todayElement);
  const tone = RELATION_TONE[relation];

  // 점수: 기본 랜덤 + 오행 관계 보정 + 타로 카드 극성 보정
  let score = 58 + Math.floor(rng() * 22) + tone.score + card.polarity * 5;
  score = Math.max(45, Math.min(100, score));
  const scoreComment = SCORE_COMMENT.find(([min]) => score >= min)[1];

  const overall = pick(rng, tone.lines);
  const luckyItem = pick(rng, LUCKY_ITEMS);
  const luckyColor = pick(rng, LUCKY_COLORS);
  const luckyNumber = 1 + Math.floor(rng() * 45);
  const luckyTime = pick(rng, TIME_SLOTS);
  const luckyDirection = pick(rng, DIRECTIONS);

  return {
    saju,
    todaySaju,
    card,
    myElement,
    todayElement,
    relation,
    relationLabel: RELATION_LABEL[relation],
    dayMasterDesc: DAY_MASTER_DESC[saju.day.stem],
    score,
    scoreComment,
    overall,
    luckyItem,
    luckyColor,
    luckyNumber,
    luckyTime,
    luckyDirection,
  };
}
