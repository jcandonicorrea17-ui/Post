# Checklist de Testing — Fase 1

## Auth

- [ ] Registro con email/password válidos crea cuenta y perfil
- [ ] Registro con password < 6 caracteres muestra error
- [ ] Registro con passwords que no coinciden muestra error
- [ ] Login con credenciales correctas entra a la app
- [ ] Login con credenciales incorrectas muestra error
- [ ] Logout vuelve a la pantalla de onboarding/registro
- [ ] Recargar la página mantiene la sesión activa

## Onboarding (5 pantallas)

- [ ] Pantalla 1 (Bienvenida) muestra título y tagline correctos
- [ ] Pantalla 2 (Registro) permite alternar entre registro y login
- [ ] Pantalla 3 (Teléfono): checkbox de marketing empieza **desmarcado**
- [ ] Pantalla 3: se puede continuar sin ingresar teléfono
- [ ] Pantalla 3: los datos se guardan en `profiles.phone` y `profiles.marketing_opt_in`
- [ ] Pantalla 4 (Redes): los links abren en nueva pestaña
- [ ] Pantalla 4: "Omitir" no bloquea el avance
- [ ] Pantalla 5: plantillas crean un hábito con frecuencia diaria
- [ ] Pantalla 5: hábito personalizado valida nombre obligatorio
- [ ] Pantalla 5: frecuencia semanal exige al menos un día seleccionado
- [ ] Al completar pantalla 5, `profiles.onboarding_completed = true` y se entra al Dashboard
- [ ] Progress bar refleja el paso actual (1/5 ... 5/5)

## CRUD de Hábitos

- [ ] Crear hábito diario desde "Mis Hábitos"
- [ ] Crear hábito semanal con días específicos
- [ ] Nombre vacío bloquea la creación
- [ ] Lista de hábitos muestra nombre, identity phrase y frecuencia
- [ ] Eliminar hábito pide confirmación
- [ ] Eliminar hábito lo quita de la BD y de la lista

## Check-in diario ("Hoy")

- [ ] Círculo vacío (○) cambia a marcado (✓) al hacer tap
- [ ] Tap de nuevo desmarca el check-in (toggle)
- [ ] Progress "X de Y completados" se actualiza en tiempo real
- [ ] Botón de reflexión (✨) solo aparece tras marcar el hábito
- [ ] Selector de emoji guarda la reflexión en `check_ins.reflection_emoji`
- [ ] Check-ins persisten tras recargar la página
- [ ] Un hábito no puede tener dos check-ins el mismo día (constraint `unique(habit_id, date)`)

## Navegación

- [ ] Barra inferior alterna entre "Hoy" y "Mis Hábitos"
- [ ] Estado activo se resalta en dorado
- [ ] Transiciones son fluidas, sin saltos visuales

## Responsive / Diseño

- [ ] Mobile (375px): sin overflow horizontal
- [ ] Botones táctiles ≥ 44x44px
- [ ] Tablet/desktop: layout centrado, legible
- [ ] Colores: fondo negro (#0a0a0a), acento dorado (#F5C518)

## Persistencia / Seguridad

- [ ] Cerrar sesión y volver a entrar mantiene hábitos y check-ins
- [ ] Un usuario no puede ver hábitos de otro usuario (verificar RLS)
- [ ] Un usuario no puede eliminar/editar hábitos ajenos vía API directa

## Test rápido (5 min)

1. `npm run dev` → localhost:3000
2. Completar registro (pantalla 2 del onboarding)
3. Pasar pantallas 3, 4, 5 (crear hábito con plantilla)
4. En "Hoy", marcar el hábito y añadir una reflexión
5. Ir a "Mis Hábitos" → "+ Nuevo hábito" → crear uno personalizado
6. Volver a "Hoy" → confirmar que aparecen ambos hábitos

---

# Checklist de Testing — Fase 2

## Heatmap

- [ ] Pestaña "Progreso" muestra el mes actual con el día de hoy coloreado según check-ins reales
- [ ] Un día sin check-ins se ve claramente vacío/gris, no como error
- [ ] Selector "Todos los hábitos" vs hábito individual cambia los colores correctamente
- [ ] Navegar a mes anterior funciona; "mes siguiente" está deshabilitado en el mes actual
- [ ] Colores confirmados contra filas reales de `check_ins` en Table Editor (no mock)

## Habit Score

- [ ] Hábito recién creado (< 3 días) muestra "Sin datos aún", no error ni NaN
- [ ] Hábito con ≥ 3 días de historial muestra un % coherente con sus check-ins reales
- [ ] El score sube con check-ins recientes y baja con inactividad reciente
- [ ] "Promedio general" en la parte superior de "Mis Hábitos" refleja el promedio de los hábitos con datos

## Modal de plantillas

- [ ] Al crear un hábito nuevo aparece primero la grilla de 7 plantillas
- [ ] Elegir una plantilla precarga nombre/identity phrase/frecuencia pero permite editarlos antes de guardar
- [ ] "Crear personalizado" sigue funcionando exactamente igual que en Fase 1
- [ ] El hábito creado desde plantilla aparece como fila real en `habits` (Table Editor), no solo en pantalla

## Notificaciones

- [ ] Banner "Activa recordatorios diarios" aparece la primera vez (permiso no otorgado aún)
- [ ] Al aceptar el permiso, el banner desaparece
- [ ] Con hábitos pendientes y permiso concedido, aparece una notificación al entrar a "Hoy" (una vez al día)
- [ ] Click en la notificación abre/enfoca la app
- [ ] **Probado en un Android real** (no solo navegador de escritorio) — ver NOTIFICATIONS.md
- [ ] Confirmado que NO es push en segundo plano (solo se dispara con la app abierta)
