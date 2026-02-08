/**
 * Quiz sound effects manager
 * Uses Web Audio API for low-latency sounds
 */

let audioContext = null
let soundsLoaded = false
const soundBuffers = {}

// Sound URLs (using short, license-free sounds)
const SOUND_URLS = {
  correct: null,   // We'll generate these
  incorrect: null,
  complete: null
}

/**
 * Initialize audio context (must be called after user interaction)
 */
function initAudio() {
  if (audioContext) return
  audioContext = new (window.AudioContext || window.webkitAudioContext)()
}

/**
 * Generate a simple "ding" sound
 */
function createDingSound(frequency = 880, duration = 0.15) {
  if (!audioContext) initAudio()
  
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()
  
  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)
  
  oscillator.type = 'sine'
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime)
  
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration)
  
  oscillator.start(audioContext.currentTime)
  oscillator.stop(audioContext.currentTime + duration)
}

/**
 * Generate a "bonk" sound for incorrect answers
 */
function createBonkSound() {
  if (!audioContext) initAudio()
  
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()
  
  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)
  
  oscillator.type = 'triangle'
  oscillator.frequency.setValueAtTime(200, audioContext.currentTime)
  oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.15)
  
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15)
  
  oscillator.start(audioContext.currentTime)
  oscillator.stop(audioContext.currentTime + 0.15)
}

/**
 * Generate celebratory sound for completion
 */
function createCompleteSound(passed = true) {
  if (!audioContext) initAudio()
  
  const notes = passed 
    ? [523.25, 659.25, 783.99, 1046.50] // C-E-G-C (major chord arpeggio)
    : [392.00, 349.23, 329.63, 293.66]   // G-F-E-D (descending)
  
  notes.forEach((freq, i) => {
    setTimeout(() => createDingSound(freq, 0.2), i * 100)
  })
}

/**
 * Play a sound effect
 * @param {string} type - 'correct', 'incorrect', or 'complete'
 * @param {number|boolean} param - streak count for correct, pass/fail for complete
 */
export function playSound(type, param = 1) {
  try {
    initAudio()
    
    switch (type) {
      case 'correct':
        // Higher pitch for longer streaks
        const streak = typeof param === 'number' ? param : 1
        const frequency = 880 + (Math.min(streak - 1, 5) * 100)
        createDingSound(frequency, 0.15)
        
        // Extra ding for streaks of 3+
        if (streak >= 3) {
          setTimeout(() => createDingSound(frequency * 1.5, 0.1), 100)
        }
        break
        
      case 'incorrect':
        createBonkSound()
        break
        
      case 'complete':
        const passed = typeof param === 'boolean' ? param : param >= 70
        createCompleteSound(passed)
        break
    }
  } catch (e) {
    // Silently fail - audio is enhancement, not required
    console.log('Audio not available:', e.message)
  }
}

/**
 * Preload sounds (optional, for loading screen)
 */
export function preloadSounds() {
  initAudio()
  // With synthesized sounds, nothing to preload
  soundsLoaded = true
}

export default {
  playSound,
  preloadSounds
}
