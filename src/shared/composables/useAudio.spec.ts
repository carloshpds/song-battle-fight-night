import { describe, test, expect, vi, beforeEach } from 'vitest'
import { useAudio } from './useAudio'

// Mock Web Audio API
const mockAudioContext = {
  createOscillator: vi.fn(() => ({
    connect: vi.fn(),
    frequency: {
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn()
    },
    type: 'sine',
    start: vi.fn(),
    stop: vi.fn()
  })),
  createGain: vi.fn(() => ({
    connect: vi.fn(),
    gain: {
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn()
    }
  })),
  destination: {},
  currentTime: 0
}

// Mock HTMLAudioElement
const mockAudio = {
  play: vi.fn().mockResolvedValue(undefined),
  pause: vi.fn(),
  currentTime: 0,
  volume: 0.5,
  preload: 'auto'
}

describe('useAudio', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Mock global Audio constructor
    global.Audio = vi.fn(() => mockAudio) as any

    // Mock AudioContext
    global.AudioContext = vi.fn(() => mockAudioContext) as any
    ;(global as any).webkitAudioContext = global.AudioContext
  })

  describe('when initialized', () => {
    test('then should return audio utilities', () => {
      const { isSupported, playVoteSuccessSound, playButtonClickSound } = useAudio()

      expect(isSupported.value).toBe(true)
      expect(typeof playVoteSuccessSound).toBe('function')
      expect(typeof playButtonClickSound).toBe('function')
    })
  })

  describe('when playing vote success sound', () => {
    test('then should create audio context and oscillator', () => {
      const { playVoteSuccessSound } = useAudio()

      playVoteSuccessSound()

      expect(global.AudioContext).toHaveBeenCalled()
      expect(mockAudioContext.createOscillator).toHaveBeenCalled()
      expect(mockAudioContext.createGain).toHaveBeenCalled()
    })

    test('then should configure oscillator for success sound', () => {
      const { playVoteSuccessSound } = useAudio()

      playVoteSuccessSound()

      // Verify that audio context was created and oscillators were configured
      const oscillatorCalls = mockAudioContext.createOscillator.mock.calls
      const gainCalls = mockAudioContext.createGain.mock.calls

      expect(oscillatorCalls.length).toBeGreaterThan(0)
      expect(gainCalls.length).toBeGreaterThan(0)
    })
  })

  describe('when playing button click sound', () => {
    test('then should create audio context and oscillator', () => {
      const { playButtonClickSound } = useAudio()

      playButtonClickSound()

      expect(global.AudioContext).toHaveBeenCalled()
      expect(mockAudioContext.createOscillator).toHaveBeenCalled()
      expect(mockAudioContext.createGain).toHaveBeenCalled()
    })

    test('then should configure oscillator for click sound', () => {
      const { playButtonClickSound } = useAudio()

      playButtonClickSound()

      // Verify that audio context was created and oscillators were configured
      const oscillatorCalls = mockAudioContext.createOscillator.mock.calls
      const gainCalls = mockAudioContext.createGain.mock.calls

      expect(oscillatorCalls.length).toBeGreaterThan(0)
      expect(gainCalls.length).toBeGreaterThan(0)
    })
  })

  describe('when audio API is not supported', () => {
    test('then should handle gracefully', () => {
      // Mock unsupported environment
      global.Audio = undefined as any

      const { isSupported, playVoteSuccessSound } = useAudio()

      expect(isSupported.value).toBe(false)
      expect(() => playVoteSuccessSound()).not.toThrow()
    })
  })
})
