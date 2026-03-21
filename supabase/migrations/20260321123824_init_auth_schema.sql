create extension if not exists pgcrypto;

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create table public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    email text not null,
    display_name text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.rooms (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    name varchar(255) not null,
    icon varchar(100),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.devices (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    name varchar(255) not null,
    type varchar(50) not null check (type in ('light', 'switch', 'sensor', 'thermostat', 'camera', 'lock', 'blind', 'fan', 'media_player')),
    room_id uuid references public.rooms(id) on delete set null,
    status varchar(20) not null default 'offline' check (status in ('online', 'offline', 'unavailable')),
    icon varchar(100),
    last_seen timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.device_states (
    id uuid primary key default gen_random_uuid(),
    device_id uuid not null unique references public.devices(id) on delete cascade,
    on_state boolean default false,
    brightness integer check (brightness >= 0 and brightness <= 100),
    color varchar(20),
    color_temp integer,
    temperature decimal(5,2),
    target_temperature decimal(5,2),
    mode varchar(20) check (mode in ('heat', 'cool', 'auto', 'off')),
    humidity decimal(5,2),
    value decimal(10,2),
    unit varchar(20),
    locked boolean default false,
    position integer check (position >= 0 and position <= 100),
    speed integer check (speed >= 0 and speed <= 100),
    playing boolean default false,
    volume integer check (volume >= 0 and volume <= 100),
    source varchar(100),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.automations (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    name varchar(255) not null,
    description text,
    enabled boolean not null default true,
    trigger jsonb not null,
    conditions jsonb,
    actions jsonb not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.automation_history (
    id uuid primary key default gen_random_uuid(),
    automation_id uuid not null references public.automations(id) on delete cascade,
    executed_at timestamptz not null default now(),
    success boolean not null default true,
    error_message text
);

create table public.cameras (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    name varchar(255) not null,
    ip varchar(45) not null,
    username varchar(255) not null,
    password varchar(255) not null,
    stream varchar(10) not null default 'stream1' check (stream in ('stream1', 'stream2')),
    port integer not null default 554,
    enabled boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.camera_recordings (
    id uuid primary key default gen_random_uuid(),
    camera_id uuid not null references public.cameras(id) on delete cascade,
    file_path varchar(500) not null,
    file_size bigint,
    duration integer,
    start_time timestamptz not null,
    end_time timestamptz,
    created_at timestamptz not null default now()
);

create index idx_profiles_email on public.profiles(email);
create index idx_rooms_user_id on public.rooms(user_id);
create index idx_devices_user_id on public.devices(user_id);
create index idx_devices_room_id on public.devices(room_id);
create index idx_devices_type on public.devices(type);
create index idx_devices_status on public.devices(status);
create index idx_device_states_device_id on public.device_states(device_id);
create index idx_automations_user_id on public.automations(user_id);
create index idx_automations_enabled on public.automations(enabled);
create index idx_automation_history_automation_id on public.automation_history(automation_id);
create index idx_cameras_user_id on public.cameras(user_id);
create index idx_cameras_enabled on public.cameras(enabled);
create index idx_camera_recordings_camera_id on public.camera_recordings(camera_id);
create index idx_camera_recordings_start_time on public.camera_recordings(start_time);

create trigger update_profiles_updated_at
before update on public.profiles
for each row execute function public.update_updated_at_column();

create trigger update_rooms_updated_at
before update on public.rooms
for each row execute function public.update_updated_at_column();

create trigger update_devices_updated_at
before update on public.devices
for each row execute function public.update_updated_at_column();

create trigger update_device_states_updated_at
before update on public.device_states
for each row execute function public.update_updated_at_column();

create trigger update_automations_updated_at
before update on public.automations
for each row execute function public.update_updated_at_column();

create trigger update_cameras_updated_at
before update on public.cameras
for each row execute function public.update_updated_at_column();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.profiles (id, email, display_name)
    values (
        new.id,
        coalesce(new.email, ''),
        coalesce(new.raw_user_meta_data ->> 'display_name', split_part(coalesce(new.email, ''), '@', 1))
    )
    on conflict (id) do update
    set email = excluded.email,
        display_name = coalesce(profiles.display_name, excluded.display_name),
        updated_at = now();

    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.devices enable row level security;
alter table public.device_states enable row level security;
alter table public.automations enable row level security;
alter table public.automation_history enable row level security;
alter table public.cameras enable row level security;
alter table public.camera_recordings enable row level security;

create policy "Profiles are viewable by owner"
on public.profiles
for select
using (auth.uid() = id);

create policy "Profiles are updatable by owner"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Rooms are viewable by owner"
on public.rooms
for select
using (auth.uid() = user_id);

create policy "Rooms are insertable by owner"
on public.rooms
for insert
with check (auth.uid() = user_id);

create policy "Rooms are updatable by owner"
on public.rooms
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Rooms are deletable by owner"
on public.rooms
for delete
using (auth.uid() = user_id);

create policy "Devices are viewable by owner"
on public.devices
for select
using (auth.uid() = user_id);

create policy "Devices are insertable by owner"
on public.devices
for insert
with check (auth.uid() = user_id);

create policy "Devices are updatable by owner"
on public.devices
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Devices are deletable by owner"
on public.devices
for delete
using (auth.uid() = user_id);

create policy "Device states are viewable by device owner"
on public.device_states
for select
using (
    exists (
        select 1
        from public.devices
        where public.devices.id = public.device_states.device_id
          and public.devices.user_id = auth.uid()
    )
);

create policy "Device states are insertable by device owner"
on public.device_states
for insert
with check (
    exists (
        select 1
        from public.devices
        where public.devices.id = public.device_states.device_id
          and public.devices.user_id = auth.uid()
    )
);

create policy "Device states are updatable by device owner"
on public.device_states
for update
using (
    exists (
        select 1
        from public.devices
        where public.devices.id = public.device_states.device_id
          and public.devices.user_id = auth.uid()
    )
)
with check (
    exists (
        select 1
        from public.devices
        where public.devices.id = public.device_states.device_id
          and public.devices.user_id = auth.uid()
    )
);

create policy "Device states are deletable by device owner"
on public.device_states
for delete
using (
    exists (
        select 1
        from public.devices
        where public.devices.id = public.device_states.device_id
          and public.devices.user_id = auth.uid()
    )
);

create policy "Automations are viewable by owner"
on public.automations
for select
using (auth.uid() = user_id);

create policy "Automations are insertable by owner"
on public.automations
for insert
with check (auth.uid() = user_id);

create policy "Automations are updatable by owner"
on public.automations
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Automations are deletable by owner"
on public.automations
for delete
using (auth.uid() = user_id);

create policy "Automation history is viewable by automation owner"
on public.automation_history
for select
using (
    exists (
        select 1
        from public.automations
        where public.automations.id = public.automation_history.automation_id
          and public.automations.user_id = auth.uid()
    )
);

create policy "Automation history is insertable by automation owner"
on public.automation_history
for insert
with check (
    exists (
        select 1
        from public.automations
        where public.automations.id = public.automation_history.automation_id
          and public.automations.user_id = auth.uid()
    )
);

create policy "Cameras are viewable by owner"
on public.cameras
for select
using (auth.uid() = user_id);

create policy "Cameras are insertable by owner"
on public.cameras
for insert
with check (auth.uid() = user_id);

create policy "Cameras are updatable by owner"
on public.cameras
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Cameras are deletable by owner"
on public.cameras
for delete
using (auth.uid() = user_id);

create policy "Camera recordings are viewable by camera owner"
on public.camera_recordings
for select
using (
    exists (
        select 1
        from public.cameras
        where public.cameras.id = public.camera_recordings.camera_id
          and public.cameras.user_id = auth.uid()
    )
);

create policy "Camera recordings are insertable by camera owner"
on public.camera_recordings
for insert
with check (
    exists (
        select 1
        from public.cameras
        where public.cameras.id = public.camera_recordings.camera_id
          and public.cameras.user_id = auth.uid()
    )
);

create policy "Camera recordings are updatable by camera owner"
on public.camera_recordings
for update
using (
    exists (
        select 1
        from public.cameras
        where public.cameras.id = public.camera_recordings.camera_id
          and public.cameras.user_id = auth.uid()
    )
)
with check (
    exists (
        select 1
        from public.cameras
        where public.cameras.id = public.camera_recordings.camera_id
          and public.cameras.user_id = auth.uid()
    )
);

create policy "Camera recordings are deletable by camera owner"
on public.camera_recordings
for delete
using (
    exists (
        select 1
        from public.cameras
        where public.cameras.id = public.camera_recordings.camera_id
          and public.cameras.user_id = auth.uid()
    )
);
