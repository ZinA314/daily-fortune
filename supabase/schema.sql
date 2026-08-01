-- 운세 뽑기 기록 테이블
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 Run 하세요.

create table if not exists public.fortune_draws (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  birth_date date not null,
  card_id smallint not null,
  card_name text not null,
  score smallint not null
);

alter table public.fortune_draws enable row level security;

-- 익명(publishable key) 사용자: 기록 추가 허용
create policy "anon can insert draws"
  on public.fortune_draws for insert
  to anon
  with check (true);

-- 익명 사용자: 집계(카운트) 조회 허용
create policy "anon can read draws"
  on public.fortune_draws for select
  to anon
  using (true);

-- 운세 내용 저장 테이블 (날짜 · 이름 · 운세 내용)
create table if not exists public.fortunes (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  draw_date date not null default current_date,
  name text not null default '익명',
  content text not null
);

alter table public.fortunes enable row level security;

create policy "anon can insert fortunes"
  on public.fortunes for insert
  to anon
  with check (true);
