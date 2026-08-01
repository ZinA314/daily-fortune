// Supabase 브라우저 클라이언트
// 환경변수가 없으면 null을 반환해 앱이 Supabase 없이도 동작하도록 한다.

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const supabase = url && key ? createClient(url, key) : null;

// 운세 뽑기 기록을 저장 (실패해도 앱 흐름에는 영향 없음)
export async function logDraw({ birth, cardId, cardName, score }) {
  if (!supabase) return;
  try {
    await supabase.from('fortune_draws').insert({
      birth_date: `${birth.y}-${String(birth.m).padStart(2, '0')}-${String(birth.d).padStart(2, '0')}`,
      card_id: cardId,
      card_name: cardName,
      score,
    });
  } catch {
    // 네트워크/설정 오류는 조용히 무시
  }
}

// 오늘 뽑힌 운세 수 조회
export async function todayDrawCount() {
  if (!supabase) return null;
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const { count, error } = await supabase
      .from('fortune_draws')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', start.toISOString());
    if (error) return null;
    return count;
  } catch {
    return null;
  }
}
