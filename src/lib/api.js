import { supabase } from './supabase'

// --- Profile ---

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data
}

export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single()
  if (error) throw error
  return data
}

// Guarda el timezone IANA detectado en el dispositivo (ver lib/dates.js) para
// que cálculos server-side puedan usar el mismo "día local" que el cliente.
export async function updateProfileTimezone(userId, timezone) {
  const { error } = await supabase.from('profiles').update({ timezone }).eq('id', userId)
  if (error) throw error
}

// --- Habits ---

export async function getHabits(userId) {
  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function createHabit(userId, { name, identityPhrase, frequency }) {
  const { data, error } = await supabase
    .from('habits')
    .insert({
      user_id: userId,
      name,
      identity_phrase: identityPhrase || null,
      frequency,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteHabit(habitId) {
  const { error } = await supabase.from('habits').delete().eq('id', habitId)
  if (error) throw error
}

// --- Check-ins ---

export async function getCheckInsForDate(userId, date) {
  const { data, error } = await supabase
    .from('check_ins')
    .select('*, habits!inner(user_id)')
    .eq('date', date)
    .eq('habits.user_id', userId)
  if (error) throw error
  return data
}

export async function getCheckInsForRange(userId, startDate, endDate) {
  const { data, error } = await supabase
    .from('check_ins')
    .select('habit_id, date, reflection_emoji, habits!inner(user_id)')
    .eq('habits.user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate)
  if (error) throw error
  return data
}

export async function toggleCheckIn(habitId, date, existingCheckInId) {
  if (existingCheckInId) {
    const { error } = await supabase.from('check_ins').delete().eq('id', existingCheckInId)
    if (error) throw error
    return null
  }

  const { data, error } = await supabase
    .from('check_ins')
    .insert({ habit_id: habitId, date })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function setCheckInReflection(checkInId, emoji) {
  const { data, error } = await supabase
    .from('check_ins')
    .update({ reflection_emoji: emoji })
    .eq('id', checkInId)
    .select()
    .single()
  if (error) throw error
  return data
}
