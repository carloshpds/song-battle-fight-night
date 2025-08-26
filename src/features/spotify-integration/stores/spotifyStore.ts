import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { SpotifyAuthService } from '../services/spotifyAuthService'
import { SpotifyApiService } from '../services/spotifyApiService'
import type {
  SpotifyAuthState,
  SpotifyPlaylist,
  SpotifyTrack
} from '../types/spotify.types'

export const useSpotifyStore = defineStore('spotify', () => {
  // State
  const authState = ref<SpotifyAuthState>({
    accessToken: null,
    refreshToken: null,
    expiresAt: null,
    isAuthenticated: false,
    user: null
  })

  const userPlaylists = ref<SpotifyPlaylist[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Computed
  const isAuthenticated = computed(() => authState.value.isAuthenticated)
  const accessToken = computed(() => authState.value.accessToken)
  const user = computed(() => authState.value.user)

  // Actions
  const initializeAuth = async () => {
    const storedAuth = SpotifyAuthService.getStoredAuthState()
    if (storedAuth) {
      authState.value = storedAuth

      // Verify token is still valid
      if (authState.value.accessToken) {
        try {
          const apiService = new SpotifyApiService(authState.value.accessToken)
          const currentUser = await apiService.getCurrentUser()
          authState.value.user = currentUser
        } catch (error) {
          console.warn('Stored token is invalid, clearing auth state', error)
          await logout()
        }
      }
    }
  }

  const login = async (): Promise<void> => {
    try {
      const authUrl = SpotifyAuthService.generateAuthUrl()
      window.location.href = authUrl
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Authentication failed'
      throw err
    }
  }

  const handleAuthCallback = async (code: string, state: string): Promise<void> => {
    isLoading.value = true
    error.value = null

    try {
      const newAuthState = await SpotifyAuthService.exchangeCodeForToken(code, state)
      authState.value = newAuthState

      // Get user profile
      if (newAuthState.accessToken) {
        const apiService = new SpotifyApiService(newAuthState.accessToken)
        const currentUser = await apiService.getCurrentUser()
        authState.value.user = currentUser
      }

      // Store auth state
      SpotifyAuthService.storeAuthState(authState.value)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Authentication failed'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const refreshToken = async (): Promise<void> => {
    if (!authState.value.refreshToken) {
      throw new Error('No refresh token available')
    }

    try {
      const newAuthState = await SpotifyAuthService.refreshAccessToken(authState.value.refreshToken)
      authState.value = { ...authState.value, ...newAuthState }

      // Update stored auth state
      SpotifyAuthService.storeAuthState(authState.value)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Token refresh failed'
      await logout() // Force re-authentication
      throw err
    }
  }

  const logout = async (): Promise<void> => {
    authState.value = {
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      isAuthenticated: false,
      user: null
    }

    userPlaylists.value = []
    error.value = null

    SpotifyAuthService.removeStoredAuthState()
    SpotifyAuthService.clearAuthState()
  }

  const loadUserPlaylists = async (): Promise<void> => {
    if (!authState.value.accessToken) {
      throw new Error('Not authenticated')
    }

    isLoading.value = true
    error.value = null

    try {
      const apiService = new SpotifyApiService(authState.value.accessToken)
      const playlists = await apiService.getAllUserPlaylists()
      userPlaylists.value = playlists
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load playlists'

      // If token is expired, try to refresh
      if (err instanceof Error && err.message.includes('401')) {
        try {
          await refreshToken()
          const apiService = new SpotifyApiService(authState.value.accessToken!)
          const playlists = await apiService.getAllUserPlaylists()
          userPlaylists.value = playlists
        } catch (refreshError) {
          console.error('Error refreshing token:', refreshError)
          throw err // Throw original error
        }
      } else {
        throw err
      }
    } finally {
      isLoading.value = false
    }
  }

  const getPlaylistTracks = async (playlistId: string): Promise<SpotifyTrack[]> => {
    if (!authState.value.accessToken) {
      throw new Error('Not authenticated')
    }

    try {
      const apiService = new SpotifyApiService(authState.value.accessToken)
      return await apiService.getPlaylistTracks(playlistId)
    } catch (err) {
      // Try to refresh token if needed
      if (err instanceof Error && err.message.includes('401')) {
        await refreshToken()
        const apiService = new SpotifyApiService(authState.value.accessToken!)
        return await apiService.getPlaylistTracks(playlistId)
      }
      throw err
    }
  }

  const getTrackById = async (trackId: string): Promise<SpotifyTrack> => {
    if (!authState.value.accessToken) {
      throw new Error('Not authenticated')
    }

    try {
      const apiService = new SpotifyApiService(authState.value.accessToken)
      return await apiService.getTrackById(trackId)
    } catch (err) {
      // Try to refresh token if needed
      if (err instanceof Error && err.message.includes('401')) {
        await refreshToken()
        const apiService = new SpotifyApiService(authState.value.accessToken!)
        return await apiService.getTrackById(trackId)
      }
      throw err
    }
  }

  const searchTracks = async (query: string, limit = 20): Promise<SpotifyTrack[]> => {
    if (!authState.value.accessToken) {
      throw new Error('Not authenticated')
    }

    try {
      const apiService = new SpotifyApiService(authState.value.accessToken)
      return await apiService.searchTracks(query, limit)
    } catch (err) {
      // Try to refresh token if needed
      if (err instanceof Error && err.message.includes('401')) {
        await refreshToken()
        const apiService = new SpotifyApiService(authState.value.accessToken!)
        return await apiService.searchTracks(query, limit)
      }
      throw err
    }
  }

  const clearError = (): void => {
    error.value = null
  }

  // Check if token needs refresh
  const checkTokenExpiry = (): boolean => {
    return SpotifyAuthService.isTokenExpired(authState.value.expiresAt)
  }

  return {
    // State
    authState: computed(() => authState.value),
    userPlaylists: computed(() => userPlaylists.value),
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),

    // Computed
    isAuthenticated,
    accessToken,
    user,

    // Actions
    initializeAuth,
    login,
    handleAuthCallback,
    refreshToken,
    logout,
    loadUserPlaylists,
    getPlaylistTracks,
    getTrackById,
    searchTracks,
    clearError,
    checkTokenExpiry
  }
})
