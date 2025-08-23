import { ref } from 'vue'

interface AudioOptions {
  volume?: number
  preload?: boolean
}

export function useAudio() {
  const audioCache = new Map<string, HTMLAudioElement>()
  const isSupported = ref(typeof Audio !== 'undefined')

  const createAudio = (src: string, options: AudioOptions = {}) => {
    const { volume = 0.5, preload = true } = options

    if (!isSupported.value) return null

    const audio = new Audio(src)
    audio.volume = volume

    if (preload) {
      audio.preload = 'auto'
    }

    return audio
  }

  const preloadAudio = (src: string, options: AudioOptions = {}): HTMLAudioElement | null => {
    if (audioCache.has(src)) return audioCache.get(src)!

    const audio = createAudio(src, options)
    if (audio) {
      audioCache.set(src, audio)
    }
    return audio
  }

  const playAudio = async (src: string, options: AudioOptions = {}) => {
    try {
      let audio: HTMLAudioElement | null = audioCache.get(src) || null

      if (!audio) {
        audio = preloadAudio(src, options)
      }

      if (!audio) return

      // Reset audio to beginning
      audio.currentTime = 0

      // Play the audio
      await audio.play()
    } catch (error) {
      console.warn('Failed to play audio:', error)
    }
  }

  const playVoteSuccessSound = () => {
    // Using a Web Audio API generated sound for satisfaction
    if (!isSupported.value) return

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

    // Create a satisfying "ding" sound
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    // Configuration for a pleasant "success" sound
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime) // High frequency
    oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1) // Descending tone

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

    oscillator.type = 'sine'
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.3)
  }

  const playButtonClickSound = () => {
    if (!isSupported.value) return

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

    // Create a subtle click sound
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.setValueAtTime(1000, audioContext.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.05)

    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05)

    oscillator.type = 'triangle'
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.05)
  }

  return {
    isSupported,
    preloadAudio,
    playAudio,
    playVoteSuccessSound,
    playButtonClickSound
  }
}
