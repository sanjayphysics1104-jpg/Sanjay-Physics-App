create table if not exists public.app_questions (
  question_id text not null,
  section text not null check (section in ('questionBanks', 'quizzes', 'boardQuestions')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  primary key (question_id, section)
);

create table if not exists public.question_deletions (
  question_id text not null,
  section text not null check (section in ('questionBanks', 'quizzes', 'boardQuestions')),
  deleted_at timestamptz not null default now(),
  primary key (question_id, section)
);

alter table public.app_questions enable row level security;
alter table public.question_deletions enable row level security;

-- No browser-facing policies are intentionally created. Only the server-side
-- service-role client can mutate these tables.
create or replace function public.delete_question(p_question_id text, p_section text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_question_id !~ '^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$'
     or p_section not in ('questionBanks', 'quizzes', 'boardQuestions') then
    raise exception 'Invalid question identifier or section';
  end if;

  delete from public.app_questions
  where question_id = p_question_id and section = p_section;

  insert into public.question_deletions(question_id, section, deleted_at)
  values (p_question_id, p_section, now())
  on conflict (question_id, section)
  do update set deleted_at = excluded.deleted_at;
end;
$$;

revoke all on function public.delete_question(text, text) from public, anon, authenticated;
grant execute on function public.delete_question(text, text) to service_role;
