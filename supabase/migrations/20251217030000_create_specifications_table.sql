create table if not exists public.specifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  content text not null,
  metadata jsonb default '{}'::jsonb,
  is_public boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table public.specifications enable row level security;

create policy "Users can insert their own specs"
  on public.specifications for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own specs"
  on public.specifications for update
  using (auth.uid() = user_id);

create policy "Users can view their own specs"
  on public.specifications for select
  using (auth.uid() = user_id);

create policy "Public specs are viewable by everyone"
  on public.specifications for select
  using (is_public = true);
