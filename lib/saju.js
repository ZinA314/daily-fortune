// 만세력(사주 명식) 계산 로직
// 년주 · 월주 · 일주를 계산한다 (시주는 출생 시각이 없으므로 제외)

export const STEMS = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
export const STEMS_HANJA = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
export const STEM_ELEMENT = ['목', '목', '화', '화', '토', '토', '금', '금', '수', '수'];
export const STEM_YINYANG = ['양', '음', '양', '음', '양', '음', '양', '음', '양', '음'];

export const BRANCHES = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];
export const BRANCHES_HANJA = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
export const BRANCH_ELEMENT = ['수', '토', '목', '목', '토', '화', '화', '토', '금', '금', '토', '수'];
export const BRANCH_ANIMAL = ['쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양', '원숭이', '닭', '개', '돼지'];

export const ELEMENT_COLOR = {
  목: '#34c759',
  화: '#ff3b30',
  토: '#d4a017',
  금: '#8e8e93',
  수: '#007aff',
};

export const ELEMENT_EMOJI = { 목: '🌳', 화: '🔥', 토: '⛰️', 금: '⚔️', 수: '🌊' };

// 일간(일주 천간)별 성정 묘사
export const DAY_MASTER_DESC = {
  갑: '우직하게 뻗어 오르는 큰 나무(甲木)의 기운. 리더십과 추진력이 강하고 곧은 성품을 지녔습니다.',
  을: '유연하게 휘어지며 자라는 덩굴(乙木)의 기운. 적응력이 뛰어나고 섬세한 감성을 지녔습니다.',
  병: '세상을 비추는 태양(丙火)의 기운. 밝고 정열적이며 주변을 환하게 만드는 존재감이 있습니다.',
  정: '어둠 속 촛불(丁火)의 기운. 따뜻하고 헌신적이며 집중력이 뛰어난 사람입니다.',
  무: '흔들리지 않는 큰 산(戊土)의 기운. 믿음직스럽고 포용력이 크며 중심을 잘 잡습니다.',
  기: '만물을 기르는 기름진 밭(己土)의 기운. 현실적이고 세심하며 남을 잘 돌봅니다.',
  경: '단단한 무쇠(庚金)의 기운. 결단력과 의리가 강하고 목표를 향해 밀어붙이는 힘이 있습니다.',
  신: '세공된 보석(辛金)의 기운. 예리하고 감각적이며 완벽을 추구하는 세련미가 있습니다.',
  임: '넓은 바다(壬水)의 기운. 스케일이 크고 지혜로우며 흐름을 읽는 통찰력이 있습니다.',
  계: '촉촉한 이슬비(癸水)의 기운. 부드럽지만 스며드는 힘이 있고 직관이 뛰어납니다.',
};

const mod = (n, m) => ((n % m) + m) % m;

// 그레고리력 → 율리우스 적일(JDN)
export function toJDN(y, m, d) {
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  return (
    d +
    Math.floor((153 * mm + 2) / 5) +
    365 * yy +
    Math.floor(yy / 4) -
    Math.floor(yy / 100) +
    Math.floor(yy / 400) -
    32045
  );
}

// 절기 경계(근사값): 각 월지가 시작되는 [월, 일]
// 인월(입춘)부터 축월(소한)까지
const TERM_STARTS = [
  [2, 4], // 인월 · 입춘
  [3, 6], // 묘월 · 경칩
  [4, 5], // 진월 · 청명
  [5, 6], // 사월 · 입하
  [6, 6], // 오월 · 망종
  [7, 7], // 미월 · 소서
  [8, 8], // 신월 · 입추
  [9, 8], // 유월 · 백로
  [10, 8], // 술월 · 한로
  [11, 7], // 해월 · 입동
  [12, 7], // 자월 · 대설
];

function isOnOrAfter(m, d, tm, td) {
  return m > tm || (m === tm && d >= td);
}

// 입춘 기준 사주 연도와 절기 기준 월 인덱스(0 = 인월)
function solarYearAndMonth(y, m, d) {
  let sajuYear = y;
  if (!isOnOrAfter(m, d, 2, 4)) sajuYear = y - 1; // 입춘 전이면 전년도

  let monthIdx = 11; // 기본값: 축월(1/6 ~ 입춘 전)
  if (isOnOrAfter(m, d, 1, 6) && !isOnOrAfter(m, d, 2, 4)) {
    monthIdx = 11;
  } else if (!isOnOrAfter(m, d, 1, 6)) {
    monthIdx = 10; // 전년 자월의 연장
  } else {
    for (let i = TERM_STARTS.length - 1; i >= 0; i--) {
      if (isOnOrAfter(m, d, TERM_STARTS[i][0], TERM_STARTS[i][1])) {
        monthIdx = i;
        break;
      }
    }
  }
  return { sajuYear, monthIdx };
}

function pillar(stemIdx, branchIdx) {
  return {
    stem: STEMS[stemIdx],
    stemHanja: STEMS_HANJA[stemIdx],
    stemElement: STEM_ELEMENT[stemIdx],
    stemYinYang: STEM_YINYANG[stemIdx],
    branch: BRANCHES[branchIdx],
    branchHanja: BRANCHES_HANJA[branchIdx],
    branchElement: BRANCH_ELEMENT[branchIdx],
    animal: BRANCH_ANIMAL[branchIdx],
    stemIdx,
    branchIdx,
  };
}

// 생년월일 → 만세력 (년주 · 월주 · 일주)
export function calcSaju(y, m, d) {
  const { sajuYear, monthIdx } = solarYearAndMonth(y, m, d);

  // 년주: (연도 - 4) 기준 60갑자
  const yearStem = mod(sajuYear - 4, 10);
  const yearBranch = mod(sajuYear - 4, 12);

  // 월주: 월지는 인월부터, 월간은 오호둔(갑기지년 병인두) 공식
  const monthBranch = mod(monthIdx + 2, 12);
  const monthStem = mod((yearStem % 5) * 2 + 2 + monthIdx, 10);

  // 일주: 율리우스 적일 기반 60갑자 (1900-01-01 = 갑술일 기준 검증)
  const jdn = toJDN(y, m, d);
  const dayStem = mod(jdn + 9, 10);
  const dayBranch = mod(jdn + 1, 12);

  return {
    year: pillar(yearStem, yearBranch),
    month: pillar(monthStem, monthBranch),
    day: pillar(dayStem, dayBranch),
    jdn,
  };
}

// 오행 상생: 목→화→토→금→수→목
const GENERATES = { 목: '화', 화: '토', 토: '금', 금: '수', 수: '목' };
// 오행 상극: 목극토, 토극수, 수극화, 화극금, 금극목
const CONTROLS = { 목: '토', 토: '수', 수: '화', 화: '금', 금: '목' };

// 나의 일간 오행과 오늘의 일진 오행의 관계
// same(비견) · helped(인성: 오늘이 나를 생) · giving(식상: 내가 오늘을 생)
// gaining(재성: 내가 오늘을 극) · pressured(관성: 오늘이 나를 극)
export function elementRelation(mine, today) {
  if (mine === today) return 'same';
  if (GENERATES[today] === mine) return 'helped';
  if (GENERATES[mine] === today) return 'giving';
  if (CONTROLS[mine] === today) return 'gaining';
  return 'pressured';
}

export const RELATION_LABEL = {
  same: '비견 · 나와 같은 기운',
  helped: '인성 · 나를 돕는 기운',
  giving: '식상 · 내가 베푸는 기운',
  gaining: '재성 · 내가 얻는 기운',
  pressured: '관성 · 나를 단련하는 기운',
};
