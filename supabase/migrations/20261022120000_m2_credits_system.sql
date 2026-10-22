-- M2 schema: Stripe credits system
-- Adds profiles (with credits_balance), credit_transactions ledger,
-- credit_products catalog, a 30-credit signup-bonus trigger, and the
-- 'insufficient_credits' job status. Idempotent + additive on top of M1.

-- 0. profiles table (M1 in this project did NOT create it — create from scratch).
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user',
  email text,
  credits_balance numeric not null default 30,
  created_at timestamptz not null default now()
);

-- Belt-and-suspenders in case a prior partial run created profiles without the column.
alter table public.profiles
  add column if not exists credits_balance numeric not null default 30;

alter table public.profiles enable row level security;

do $$ begin
  create policy "Users can view own profile" on public.profiles
    for select using (id = auth.uid());
exception when duplicate_object then null; end $$;

-- Backfill: every existing auth user gets a profile row with the 30-credit bonus.
insert into public.profiles (id, role, credits_balance)
select u.id, 'user', 30
from auth.users u
on conflict (id) do nothing;

-- 1. Ledger table
create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric not null,
  type text not null check (type in ('purchase', 'deduction', 'signup_bonus', 'admin_grant')),
  description text,
  job_id uuid references public.jobs(id),
  stripe_payment_intent_id text,
  created_at timestamptz not null default now()
);

create index if not exists idx_credit_transactions_user_id
  on public.credit_transactions(user_id, created_at desc);

-- Idempotency: at most one purchase row per payment_intent (protects against
-- duplicate webhook deliveries racing within the same tick).
create unique index if not exists uniq_credit_tx_payment_intent
  on public.credit_transactions(stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;

alter table public.credit_transactions enable row level security;

do $$ begin
  create policy "Users can view own transactions" on public.credit_transactions
    for select using (user_id = auth.uid());
exception when duplicate_object then null; end $$;

-- 2. Products catalog
create table if not exists public.credit_products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  credits numeric not null,
  price_usd numeric not null,
  stripe_price_id text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.credit_products enable row level security;

do $$ begin
  create policy "Authenticated users can view active products" on public.credit_products
    for select to authenticated using (active = true);
exception when duplicate_object then null; end $$;

-- Seed the three tiers with the real sandbox price IDs created in Step 3.
insert into public.credit_products (name, credits, price_usd, stripe_price_id) values
  ('10 Credits', 10, 10.00, 'price_1UTKUxC8gZniH3Vkw2Oa3iPB'),
  ('45 Credits', 45, 30.00, 'price_1UTKUyC8gZniH3VkWDe7WQh2'),
  ('90 Credits', 90, 60.00, 'price_1UTKUzC8gZniH3VkCGATRZEk')
on conflict do nothing;

-- 3. Signup trigger: 30-credit welcome bonus
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, credits_balance)
    values (new.id, 'user', 30)
    on conflict (id) do nothing;
  insert into public.credit_transactions (user_id, amount, type, description)
    values (new.id, 30, 'signup_bonus', 'Welcome bonus - 30 free credits');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. New job status: insufficient_credits.
-- M1's actual CHECK is ('pending','downloading','transcribe','done') — keep those
-- exact values (NOT the generic template set) and just add the new terminal state.
alter table public.jobs drop constraint if exists jobs_status_check;
alter table public.jobs add constraint jobs_status_check
  check (status in ('pending', 'downloading', 'transcribe', 'done', 'insufficient_credits'));

-- 5. Backfill signup_bonus ledger rows for users created before this migration.
insert into public.credit_transactions (user_id, amount, type, description)
select u.id, 30, 'signup_bonus', 'Welcome bonus - 30 free credits (backfilled)'
from auth.users u
left join public.credit_transactions ct
  on ct.user_id = u.id and ct.type = 'signup_bonus'
where ct.id is null;
