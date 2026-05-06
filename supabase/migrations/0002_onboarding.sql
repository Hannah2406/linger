-- Track onboarding completion so the welcome cards only show on first sign-in.

alter table public.profiles
  add column if not exists onboarding_completed_at timestamptz;
