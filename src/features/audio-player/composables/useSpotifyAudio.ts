import { ref, computed, onUnmounted } from 'vue'
import { Howl } from 'howler'
import type { SpotifyTrack } from '@/features/spotify-integration/types/spotify.types'

export function useSpotifyAudio() {
  // State
  const currentTrack = ref<SpotifyTrack | null>(null)
  const isPlaying = ref(false)
  const currentTime = ref(0)
  const duration = ref(0)
  const volume = ref(0.5)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Audio instance
  let howlerInstance: Howl | null = null
  let progressInterval: number | null = null

  // Computed
  const progress = computed(() => {
    return duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0
  })

  const canPlay = computed(() => {
    return currentTrack.value?.preview_url !== null
  })

  const formattedCurrentTime = computed(() => {
    return formatTime(currentTime.value)
  })

  const formattedDuration = computed(() => {
    return formatTime(duration.value)
  })

  // Actions
  const playTrack = async (track: SpotifyTrack): Promise<void> => {
    if (!track.preview_url) {
      error.value = 'Track has no preview available'
      throw new Error('Track has no preview available')
    }

    try {
      isLoading.value = true
      error.value = null

      // Stop current track if playing
      await stopTrack()

      currentTrack.value = track

      howlerInstance = new Howl({
        src: [track.preview_url],
        html5: true,
        volume: volume.value,
        format: ['mp3'],
        onload: () => {
          duration.value = howlerInstance?.duration() || 30 // Spotify previews are 30s
          isLoading.value = false
        },
        onplay: () => {
          isPlaying.value = true
          startProgressTracking()
        },
        onpause: () => {
          isPlaying.value = false
          stopProgressTracking()
        },
        onend: () => {
          isPlaying.value = false
          currentTime.value = 0
          stopProgressTracking()
        },
        onloaderror: (_id, errorMsg) => {
          console.error('Audio load error:', errorMsg)
          error.value = 'Failed to load audio preview'
          isLoading.value = false
        },
        onplayerror: (_id, errorMsg) => {
          console.error('Audio play error:', errorMsg)
          error.value = 'Failed to play audio preview'
          isPlaying.value = false
          isLoading.value = false
        }
      })

      howlerInstance.play()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown audio error'
      isLoading.value = false
      throw err
    }
  }

  const pauseTrack = (): void => {
    if (howlerInstance && isPlaying.value) {
      howlerInstance.pause()
    }
  }

  const resumeTrack = (): void => {
    if (howlerInstance && !isPlaying.value) {
      howlerInstance.play()
    }
  }

  const stopTrack = async (): Promise<void> => {
    if (howlerInstance) {
      howlerInstance.stop()
      howlerInstance.unload()
      howlerInstance = null
    }

    isPlaying.value = false
    currentTime.value = 0
    isLoading.value = false
    stopProgressTracking()
  }

  const togglePlayback = async (): Promise<void> => {
    if (!currentTrack.value) return

    if (isPlaying.value) {
      pauseTrack()
    } else if (howlerInstance) {
      resumeTrack()
    } else {
      await playTrack(currentTrack.value)
    }
  }

  const setVolume = (newVolume: number): void => {
    volume.value = Math.max(0, Math.min(1, newVolume))
    if (howlerInstance) {
      howlerInstance.volume(volume.value)
    }
  }

  const seek = (position: number): void => {
    if (howlerInstance && duration.value > 0) {
      const seekTime = (position / 100) * duration.value
      howlerInstance.seek(seekTime)
      currentTime.value = seekTime
    }
  }

  const fadeOut = (duration = 1000): Promise<void> => {
    return new Promise((resolve) => {
      if (howlerInstance && isPlaying.value) {
        howlerInstance.fade(volume.value, 0, duration)
        howlerInstance.once('fade', () => {
          stopTrack()
          resolve()
        })
      } else {
        resolve()
      }
    })
  }

  const fadeIn = (track: SpotifyTrack, duration = 1000): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      try {
        await playTrack(track)
        if (howlerInstance) {
          howlerInstance.volume(0)
          howlerInstance.fade(0, volume.value, duration)
          howlerInstance.once('fade', () => resolve())
        } else {
          reject(new Error('Failed to create audio instance'))
        }
      } catch (err) {
        reject(err)
      }
    })
  }

  // Helper functions
  const startProgressTracking = (): void => {
    stopProgressTracking() // Clear any existing interval

    progressInterval = window.setInterval(() => {
      if (howlerInstance && isPlaying.value) {
        currentTime.value = howlerInstance.seek() as number
      }
    }, 100) // Update every 100ms for smooth progress
  }

  const stopProgressTracking = (): void => {
    if (progressInterval) {
      clearInterval(progressInterval)
      progressInterval = null
    }
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const clearError = (): void => {
    error.value = null
  }

  // Cleanup on unmount
  onUnmounted(() => {
    stopTrack()
  })

  return {
    // State
    currentTrack: computed(() => currentTrack.value),
    isPlaying: computed(() => isPlaying.value),
    currentTime: computed(() => currentTime.value),
    duration: computed(() => duration.value),
    volume: computed(() => volume.value),
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),

    // Computed
    progress,
    canPlay,
    formattedCurrentTime,
    formattedDuration,

    // Actions
    playTrack,
    pauseTrack,
    resumeTrack,
    stopTrack,
    togglePlayback,
    setVolume,
    seek,
    fadeOut,
    fadeIn,
    clearError
  }
}
