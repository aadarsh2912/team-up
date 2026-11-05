create schema teamup_private;
revoke all on schema teamup_private from public, anon;
grant usage on schema teamup_private to authenticated;
create table public.teams(id uuid primary key default gen_random_uuid(), name text not null check(length(name) between 1 and 60), owner uuid not null references auth.users(id), created timestamptz not null default now());
create table public.members(id uuid primary key references auth.users(id), team_id uuid not null references public.teams(id), name text not null check(length(name) between 1 and 40), color text not null default 'sage');
create table public.habits(id uuid primary key default gen_random_uuid(), team_id uuid not null references public.teams(id), user_id uuid not null references public.members(id), name text not null check(length(name) between 1 and 70), identity text not null check(length(identity) between 1 and 100), target text not null check(length(target) between 1 and 70), category text not null check(category in ('mind','body','growth','calm')), time text not null check(time in ('Morning','Afternoon','Evening','Anytime')), created timestamptz not null default now());
create table public.checkins(habit_id uuid not null references public.habits(id) on delete cascade, day date not null, created timestamptz not null default now(), primary key(habit_id,day));
create table public.notes(id uuid primary key default gen_random_uuid(),team_id uuid not null references public.teams(id),user_id uuid not null references public.members(id),recipient uuid references public.members(id),kind text not null check(kind in ('encourage','reflect')),message text not null check(length(message) between 1 and 400),created timestamptz not null default now());
create table public.invites(token text primary key,team_id uuid not null references public.teams(id),expires timestamptz not null);
create index members_team_idx on public.members(team_id);
create index habits_team_idx on public.habits(team_id);
create index habits_user_idx on public.habits(user_id);
create index notes_team_idx on public.notes(team_id,created desc);
create index notes_user_idx on public.notes(user_id);
create index notes_recipient_idx on public.notes(recipient);
create index invites_team_idx on public.invites(team_id);
create index teams_owner_idx on public.teams(owner);
alter table public.teams enable row level security;
alter table public.members enable row level security;
alter table public.habits enable row level security;
alter table public.checkins enable row level security;
alter table public.notes enable row level security;
alter table public.invites enable row level security;
revoke all on public.teams,public.members,public.habits,public.checkins,public.notes,public.invites from anon,authenticated;
-- All data access is mediated by a narrow authenticated RPC. Tables have deny-by-default RLS.
create function teamup_private.team_action(payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare
 u uuid:=auth.uid(); t uuid; h uuid; token_value text; day_value date;
 a text:=payload->>'action'; display_name text; state_value jsonb;
begin
 if u is null then raise exception 'Sign in to continue.' using errcode='42501'; end if;
 select team_id into t from public.members where id=u;
 if a='state' then
  if t is null then return jsonb_build_object('user',jsonb_build_object('id',u,'name',split_part(auth.jwt()->>'email','@',1)),'team',null); end if;
  select jsonb_build_object(
   'user',(select jsonb_build_object('id',id,'name',name,'color',color) from public.members where id=u),
   'team',(select jsonb_build_object('id',id,'name',name) from public.teams where id=t),
   'members',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'name',name,'color',color)),'[]') from public.members where team_id=t),
   'habits',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'userId',user_id,'name',name,'identity',identity,'target',target,'category',category,'time',time,'created',created) order by created),'[]') from public.habits where team_id=t),
   'checkins',(select coalesce(jsonb_agg(jsonb_build_object('habitId',c.habit_id,'day',c.day,'created',c.created)),'[]') from public.checkins c join public.habits x on x.id=c.habit_id where x.team_id=t),
   'notes',(select coalesce(jsonb_agg(jsonb_build_object('id',n.id,'userId',n.user_id,'recipient',n.recipient,'kind',n.kind,'message',n.message,'created',n.created) order by n.created desc),'[]') from (select * from public.notes where team_id=t order by created desc limit 80)n)
  ) into state_value; return state_value;
 end if;
 if a in ('create_team','join_team') then
  if t is not null then raise exception 'You already belong to a circle.'; end if;
  display_name:=trim(payload->>'displayName');
  if display_name is null or length(display_name) not between 1 and 40 then raise exception 'Enter your name (up to 40 characters).'; end if;
  if a='create_team' then
   insert into public.teams(name,owner) values(trim(payload->>'name'),u) returning id into t;
  else
   select team_id into t from public.invites where token=payload->>'token' and expires>now();
   if t is null then raise exception 'This invitation has expired or is invalid.'; end if;
  end if;
  insert into public.members(id,team_id,name,color) values(u,t,display_name,'sage');
  return '{"ok":true}';
 end if;
 if t is null then raise exception 'Create or join a circle first.' using errcode='42501'; end if;
 if a in ('edit_habit','toggle','delete_habit') then
  select id into h from public.habits where id=(payload->>'id')::uuid and user_id=u and team_id=t;
  if h is null then raise exception 'Habit not found.' using errcode='42501'; end if;
 end if;
 if a in ('add_habit','edit_habit') then
  if a='add_habit' then
   insert into public.habits(team_id,user_id,name,identity,target,category,time) values(t,u,trim(payload->>'name'),trim(payload->>'identity'),trim(payload->>'target'),payload->>'category',payload->>'time');
  else
   update public.habits set name=trim(payload->>'name'),identity=trim(payload->>'identity'),target=trim(payload->>'target'),category=payload->>'category',time=payload->>'time' where id=h;
  end if;
 elsif a='toggle' then
  day_value:=(current_timestamp at time zone coalesce(payload->>'timezone','UTC'))::date;
  if (payload->>'day')::date<>day_value or payload->>'day' is null then raise exception 'You can check in for today only.'; end if;
  if jsonb_typeof(payload->'done') is distinct from 'boolean' then raise exception 'Invalid check-in.'; end if;
  if (payload->>'done')::boolean then insert into public.checkins(habit_id,day) values(h,day_value) on conflict do nothing;
  else delete from public.checkins where habit_id=h and day=day_value; end if;
 elsif a='delete_habit' then delete from public.habits where id=h;
 elsif a='invite' then
  token_value:=replace(gen_random_uuid()::text||gen_random_uuid()::text,'-','');
  insert into public.invites values(token_value,t,now()+interval '7 days');
  return jsonb_build_object('token',token_value);
 elsif a in ('encourage','reflect') then
  if a='encourage' and not exists(select 1 from public.members where id=(payload->>'recipient')::uuid and team_id=t) then raise exception 'Teammate not found.'; end if;
  insert into public.notes(team_id,user_id,recipient,kind,message) values(t,u,case when a='encourage' then (payload->>'recipient')::uuid else null end,a,trim(payload->>'message'));
 else raise exception 'Unknown action.';
 end if;
 return '{"ok":true}';
end $$;
revoke all on function teamup_private.team_action(jsonb) from public,anon;
grant execute on function teamup_private.team_action(jsonb) to authenticated;
create function public.team_action(payload jsonb) returns jsonb language sql security invoker set search_path='' as $$ select teamup_private.team_action(payload); $$;
revoke all on function public.team_action(jsonb) from public,anon;
grant execute on function public.team_action(jsonb) to authenticated;
