-- Function to deduct credits from user profile
create or replace function public.deduct_user_credit(p_user_id uuid)
returns boolean
language plpgsql
security definer set search_path = public
as $$
declare
  v_credits integer;
begin
  select credits into v_credits from public.profiles where id = p_user_id;
  
  if v_credits > 0 then
    update public.profiles
    set credits = credits - 1,
        updated_at = now()
    where id = p_user_id;
    return true;
  else
    return false;
  end if;
end;
$$;
