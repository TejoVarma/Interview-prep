create table if not exists public.tickets (
    id                 uuid primary key default gen_random_uuid(),
    title              text not null check (length(trim(title)) > 0),
    description        text,
    priority           text not null default 'medium'
                       check (priority in ('low', 'medium', 'high')),
    status             text not null default 'open'
                       check (status in ('open', 'in-progress', 'done')),
    created_date       timestamptz not null default now(),
    last_modified_date timestamptz not null default now()
);

create index if not exists tickets_created_date_idx on public.tickets (created_date desc);

-- now() is fixed for the whole transaction, so on insert both dates get the exact same value
create or replace function public.set_last_modified_date()
returns trigger
language plpgsql
as $$
begin
    new.last_modified_date := now();
    new.created_date := old.created_date;
    return new;
end;
$$;

drop trigger if exists tickets_set_last_modified_date on public.tickets;
create trigger tickets_set_last_modified_date
    before update on public.tickets
    for each row
    execute function public.set_last_modified_date();

alter table public.tickets enable row level security;
