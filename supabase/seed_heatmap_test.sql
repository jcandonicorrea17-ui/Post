-- Datos de prueba para verificar visualmente el heatmap (Fase 2).
-- Simula: ayer completó los 3 hábitos, hace 2 días completó 2 de 3,
-- hace 3 días completó 1 de 3. Seguro de re-ejecutar (on conflict do nothing).

insert into check_ins (habit_id, date)
select h.id, current_date - 1
from habits h
join auth.users u on u.id = h.user_id
where u.email = 'jcandoni.correa17@gmail.com'
on conflict (habit_id, date) do nothing;

insert into check_ins (habit_id, date)
select h.id, current_date - 2
from habits h
join auth.users u on u.id = h.user_id
where u.email = 'jcandoni.correa17@gmail.com'
  and h.name in ('correr', 'beber agua')
on conflict (habit_id, date) do nothing;

insert into check_ins (habit_id, date)
select h.id, current_date - 3
from habits h
join auth.users u on u.id = h.user_id
where u.email = 'jcandoni.correa17@gmail.com'
  and h.name = 'beber agua'
on conflict (habit_id, date) do nothing;
