-- Tabela de Horários de Funcionamento
create table if not exists public.business_hours (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  day_of_week integer not null check (day_of_week >= 0 and day_of_week <= 6), -- 0 = Domingo, 6 = Sábado
  is_open boolean default true,
  open_time time,
  close_time time,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, day_of_week)
);

alter table public.business_hours enable row level security;

create policy "Users can manage their own business hours" 
  on public.business_hours 
  for all 
  using (auth.uid() = user_id);

-- Permitir leitura pública dos horários (para o cardápio online)
create policy "Anyone can view business hours" 
  on public.business_hours 
  for select 
  using (true);

-- Índices para melhor performance
create index if not exists business_hours_user_id_idx on public.business_hours(user_id);
create index if not exists business_hours_day_of_week_idx on public.business_hours(day_of_week);

-- Inserir horários padrão para usuários existentes (segunda a quinta: 11:00-22:00, sexta a sábado: 11:00-23:00, domingo fechado)
insert into public.business_hours (user_id, day_of_week, is_open, open_time, close_time)
select 
  u.id as user_id,
  d.day_of_week,
  case 
    when d.day_of_week = 0 then false -- Domingo fechado
    else true
  end as is_open,
  case 
    when d.day_of_week = 0 then null -- Domingo fechado
    else '11:00:00'::time
  end as open_time,
  case 
    when d.day_of_week = 0 then null -- Domingo fechado
    when d.day_of_week in (5, 6) then '23:00:00'::time -- Sexta e Sábado até 23h
    else '22:00:00'::time -- Seg-Qui até 22h
  end as close_time
from 
  auth.users u
  cross join (
    select generate_series(0, 6) as day_of_week
  ) d
where not exists (
  select 1 
  from public.business_hours bh 
  where bh.user_id = u.id and bh.day_of_week = d.day_of_week
)
on conflict (user_id, day_of_week) do nothing;
