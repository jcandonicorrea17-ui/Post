alter table profiles enable row level security;
alter table habits enable row level security;
alter table check_ins enable row level security;

-- Profiles: el usuario solo ve/edita su propia fila
create policy "Profiles are viewable by owner"
  on profiles for select
  using (auth.uid() = id);

create policy "Profiles are updatable by owner"
  on profiles for update
  using (auth.uid() = id);

create policy "Profiles are insertable by owner"
  on profiles for insert
  with check (auth.uid() = id);

-- Habits: el usuario solo ve/edita sus propios hábitos
create policy "Habits are viewable by owner"
  on habits for select
  using (auth.uid() = user_id);

create policy "Habits are insertable by owner"
  on habits for insert
  with check (auth.uid() = user_id);

create policy "Habits are updatable by owner"
  on habits for update
  using (auth.uid() = user_id);

create policy "Habits are deletable by owner"
  on habits for delete
  using (auth.uid() = user_id);

-- Check-ins: el usuario solo ve/edita check-ins de sus propios hábitos
create policy "Check-ins are viewable by owner"
  on check_ins for select
  using (
    exists (
      select 1 from habits
      where habits.id = check_ins.habit_id
      and habits.user_id = auth.uid()
    )
  );

create policy "Check-ins are insertable by owner"
  on check_ins for insert
  with check (
    exists (
      select 1 from habits
      where habits.id = check_ins.habit_id
      and habits.user_id = auth.uid()
    )
  );

create policy "Check-ins are updatable by owner"
  on check_ins for update
  using (
    exists (
      select 1 from habits
      where habits.id = check_ins.habit_id
      and habits.user_id = auth.uid()
    )
  );

create policy "Check-ins are deletable by owner"
  on check_ins for delete
  using (
    exists (
      select 1 from habits
      where habits.id = check_ins.habit_id
      and habits.user_id = auth.uid()
    )
  );
