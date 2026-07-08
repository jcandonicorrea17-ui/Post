// Sonidos sintetizados con Web Audio API — sin archivos externos que cargar.
let audioContext = null

function getAudioContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext
  if (!AudioContextClass) return null
  if (!audioContext) {
    audioContext = new AudioContextClass()
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume()
  }
  return audioContext
}

function playTone(freq, duration, { type = 'sine', volume = 0.15, delay = 0 } = {}) {
  const ctx = getAudioContext()
  if (!ctx) return

  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()
  oscillator.type = type
  oscillator.frequency.value = freq

  const startTime = ctx.currentTime + delay
  gain.gain.setValueAtTime(0, startTime)
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)

  oscillator.connect(gain)
  gain.connect(ctx.destination)
  oscillator.start(startTime)
  oscillator.stop(startTime + duration + 0.02)
}

// Mini chime ascendente para un check-in completado.
export function playSuccessSound() {
  try {
    playTone(880, 0.12, { volume: 0.18 })
    playTone(1318.5, 0.18, { volume: 0.16, delay: 0.08 })
  } catch (err) {
    console.error('No se pudo reproducir el sonido:', err)
  }
}

// Tick suave para interacciones menores (ej. tocar un día del heatmap).
export function playTickSound() {
  try {
    playTone(600, 0.05, { type: 'triangle', volume: 0.08 })
  } catch (err) {
    console.error('No se pudo reproducir el sonido:', err)
  }
}
