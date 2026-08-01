// 행성 × 별자리 성향 해석과 어스펙트(행성 간 관계) 해석 텍스트 생성기
// 12별자리의 표현 방식 × 행성별 삶의 영역을 조합해 문장을 만든다.

// 별자리별 표현 스타일 (조사까지 포함한 완성 구절)
const SIGN_FLAVOR = {
  0: { manner: '불꽃처럼 빠르고 직선적으로', strength: '먼저 부딪히는 용기가', caution: '쉽게 달아올랐다 식는 성급함이' },
  1: { manner: '서두르지 않고 착실하게', strength: '끝까지 지켜내는 뚝심이', caution: '변화를 거부하는 고집이' },
  2: { manner: '가볍고 재치 있게', strength: '빠른 두뇌 회전과 말솜씨가', caution: '쉽게 흩어지는 산만함이' },
  3: { manner: '부드럽고 세심하게', strength: '상대를 품어주는 공감력이', caution: '기분 따라 출렁이는 감정 기복이' },
  4: { manner: '당당하고 화려하게', strength: '사람을 끌어당기는 존재감이', caution: '인정받고 싶은 욕심이' },
  5: { manner: '꼼꼼하고 정확하게', strength: '디테일을 놓치지 않는 분석력이', caution: '지나친 자기 검열이' },
  6: { manner: '우아하고 조화롭게', strength: '균형을 맞추는 감각이', caution: '결정을 미루는 우유부단함이' },
  7: { manner: '깊고 강렬하게', strength: '끝까지 파고드는 집중력이', caution: '쉽게 놓지 못하는 집착이' },
  8: { manner: '자유롭고 낙천적으로', strength: '멀리 내다보는 넓은 시야가', caution: '디테일을 건너뛰는 대범함이' },
  9: { manner: '신중하고 끈질기게', strength: '목표를 향한 인내심이', caution: '즐거움을 뒤로 미루는 과로 습관이' },
  10: { manner: '독창적이고 쿨하게', strength: '남다른 발상이', caution: '한 발 떨어져 있는 정서적 거리감이' },
  11: { manner: '감성적이고 유연하게', strength: '경계 없는 상상력과 공감이', caution: '현실의 초점을 흐리는 몽상이' },
};

// 행성(포인트)별 해석 프레임
const FRAMES = {
  sun: (f) => `무엇을 하든 ${f.manner} 자신을 표현할 때 가장 빛나는 사람입니다. ${f.strength} 삶의 중심 동력이 되고, ${f.caution} 스스로 다듬어야 할 평생의 숙제가 됩니다.`,
  moon: (f) => `감정이 ${f.manner} 움직입니다. 마음의 안정에는 ${f.strength} 필수 조건이고, 지치거나 불안할 때는 ${f.caution} 먼저 드러납니다.`,
  mercury: (f) => `생각과 말이 ${f.manner} 흘러갑니다. 배우고 소통할 때 ${f.strength} 큰 무기가 되지만, 대화가 꼬일 때는 ${f.caution} 원인일 때가 많습니다.`,
  venus: (f) => `사랑 앞에서 ${f.manner} 마음을 표현합니다. 관계에서 ${f.strength} 매력 포인트로 작용하고, ${f.caution} 애정 갈등의 불씨가 되곤 합니다.`,
  mars: (f) => `원하는 것을 향해 ${f.manner} 돌진합니다. 승부처에서 ${f.strength} 폭발적인 추진력을 만들지만, ${f.caution} 페이스를 흔들 수 있습니다.`,
  jupiter: (f) => `행운과 성장의 문이 ${f.manner} 움직일 때 열립니다. ${f.strength} 기회를 몇 배로 키워주는 확장 버튼이니, 이 방식을 의식적으로 자주 쓰세요.`,
  saturn: (f) => `인생의 훈련장이 이곳에 있습니다. ${f.manner} 임해야 하는 과제가 반복되지만, 그 과정을 통과할 때마다 ${f.strength} 흔들리지 않는 실력으로 굳어집니다.`,
  uranus: (f) => `남들과 다른 지점이 ${f.manner} 드러납니다. 관습을 깨는 순간 ${f.strength} 세대의 신선한 바람이 되어줍니다.`,
  neptune: (f) => `꿈과 영감이 ${f.manner} 스며듭니다. ${f.strength} 예술적 감수성의 원천이 되지만, ${f.caution} 현실 감각을 흐리지 않도록 균형이 필요합니다.`,
  pluto: (f) => `삶을 뿌리째 바꾸는 힘이 ${f.manner} 작동합니다. 위기의 순간 ${f.strength} 재탄생의 에너지로 바뀌는, 깊고 강한 저력의 자리입니다.`,
  node: (f) => `이번 생의 성장 방향이 이 별자리를 가리킵니다. 익숙함을 벗어나 ${f.manner} 사는 법을 배울 때, ${f.strength} 운명의 순풍이 되어줍니다.`,
  asc: (f) => `처음 만나는 사람들에게 ${f.manner} 다가가는 인상을 남깁니다. 첫인상에서 ${f.strength} 먼저 읽히며, 이는 세상을 향해 열어둔 당신의 대문과 같습니다.`,
  mc: (f) => `사회적 무대에서는 ${f.manner} 일하는 모습으로 기억됩니다. 커리어에서 ${f.strength} 평판의 핵심이 되니, 이 강점을 직업의 축으로 삼으면 좋습니다.`,
};

// 행성(포인트) × 별자리 → 성향 해석 문장
export function pointInSignText(pointKey, sign) {
  const frame = FRAMES[pointKey];
  const flavor = SIGN_FLAVOR[sign.id];
  if (!frame || !flavor) return '';
  return frame(flavor);
}

// 어스펙트 유형별 관계 해석 프레임
const ASPECT_FRAMES = {
  conjunction: (A, B) =>
    `'${A}'의 기운과 '${B}'의 기운이 한 지점에서 합쳐져 서로를 증폭시킵니다. 두 영역이 늘 세트로 움직이는 강력한 조합이라, 이 에너지를 의식적으로 쓰면 누구도 흉내 내기 어려운 뚜렷한 개성이 됩니다.`,
  opposition: (A, B) =>
    `'${A}'의 기운과 '${B}'의 기운이 시소처럼 마주 보고 있습니다. 한쪽으로 치우치면 마음이나 관계가 흔들리지만, 둘 사이의 균형점을 찾는 순간 양쪽을 모두 아우르는 폭넓은 시야가 생깁니다.`,
  trine: (A, B) =>
    `'${A}'의 기운과 '${B}'의 기운이 같은 원소의 흐름을 타고 자연스럽게 협력합니다. 애쓰지 않아도 발휘되는 타고난 재능 구간이니, 의식적으로 자주 꺼내 쓸수록 인생이 수월해집니다.`,
  square: (A, B) =>
    `'${A}'의 기운과 '${B}'의 기운이 서로 다른 방향으로 당기며 팽팽한 긴장을 만듭니다. 마찰이 잦은 만큼 단련도 빠른 조합 — 이 갈등을 넘어설 때마다 실력이 한 계단씩 올라갑니다.`,
  sextile: (A, B) =>
    `'${A}'의 기운과 '${B}'의 기운이 가볍게 손을 내밀어 협력할 기회를 만듭니다. 저절로 굴러가지는 않지만, 조금만 의식적으로 연결해 쓰면 기분 좋은 시너지를 내는 조합입니다.`,
};

// 어스펙트 → 관계 해석 문장
export function aspectText(aspect) {
  const frame = ASPECT_FRAMES[aspect.type.key];
  if (!frame) return aspect.type.meaning;
  return frame(aspect.a.meaning, aspect.b.meaning);
}
