// OpenRouter를 통해 AI가 오늘의 운세를 새로 생성하는 서버 API
// 키는 서버 환경변수(OPENROUTER_API_KEY)에만 존재하며 브라우저에 노출되지 않는다.

const MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5';

export async function POST(req) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: 'OPENROUTER_API_KEY가 설정되지 않았습니다.' },
      { status: 500 }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  }

  const { saju, todayPillar, card, score, relationLabel, name } = body || {};
  if (!saju || !card) {
    return Response.json({ error: '사주와 카드 정보가 필요합니다.' }, { status: 400 });
  }

  const prompt = `당신은 따뜻하고 통찰력 있는 한국의 사주·타로 상담가입니다.
아래 정보를 바탕으로 "오늘의 운세"를 새로 써 주세요.

[의뢰인 정보]
- 호칭: ${String(name || '').trim() || '님'}
- 사주 명식: 년주 ${saju.year}, 월주 ${saju.month}, 일주 ${saju.day} (일간 오행: ${saju.dayElement})
- 오늘의 일진: ${todayPillar}
- 일간과 오늘의 관계: ${relationLabel}
- 뽑은 타로 카드: ${card.name} (${card.en}) — 키워드: ${card.keywords}
- 오늘의 운세 점수: ${score}점

[작성 규칙]
- 반말이 아닌 존댓말로, 다정하지만 구체적으로.
- 총운 3~4문장 → 오늘 조심할 것 1문장 → 오늘의 행동 조언 1문장 순서로.
- 사주의 오행 기운과 타로 카드의 상징을 자연스럽게 엮어서 해석할 것.
- 과장된 미신적 단정은 피하고, 희망적이되 현실적인 톤으로.
- 전체 5~6문장, 300자 이내. 제목이나 머리말 없이 본문만.`;

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://daily-fortune-supersta.vercel.app',
        'X-Title': 'Daily Fortune',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 600,
        temperature: 0.9,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error('OpenRouter error:', res.status, detail.slice(0, 300));
      return Response.json(
        { error: 'AI 운세 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.' },
        { status: 502 }
      );
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content?.trim();
    if (!text) {
      return Response.json(
        { error: 'AI 응답이 비어 있습니다. 다시 시도해 주세요.' },
        { status: 502 }
      );
    }

    return Response.json({ text, model: data.model || MODEL });
  } catch (e) {
    console.error('AI fortune error:', e);
    return Response.json(
      { error: 'AI 운세 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
