import type { SpotifyAuthState, SpotifyTokenResponse, SpotifyAuthError } from '../types/spotify.types'

export class SpotifyAuthService {
  private static readonly CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID
  private static readonly CLIENT_SECRET = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET
  private static readonly REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI
  private static readonly SCOPES = import.meta.env.VITE_SPOTIFY_SCOPES
  private static readonly AUTH_URL = 'https://accounts.spotify.com/authorize'
  private static readonly TOKEN_URL = 'https://accounts.spotify.com/api/token'

  /**
   * Generate Spotify authorization URL
   */
  static generateAuthUrl(): string {
    if (!this.CLIENT_ID) {
      throw new Error('Spotify Client ID not configured')
    }

    if (!this.CLIENT_SECRET) {
      throw new Error('Spotify Client Secret not configured')
    }

    const state = this.generateRandomString(16)
    const params = new URLSearchParams({
      client_id: this.CLIENT_ID,
      response_type: 'code',
      redirect_uri: this.REDIRECT_URI,
      scope: this.SCOPES,
      state,
      show_dialog: 'false'
    })

    // Store state for verification
    localStorage.setItem('spotify_auth_state', state)

    return `${this.AUTH_URL}?${params.toString()}`
  }

  /**
   * Exchange authorization code for access token
   */
  static async exchangeCodeForToken(code: string, state: string): Promise<SpotifyAuthState> {
    // Verify state parameter
    const storedState = localStorage.getItem('spotify_auth_state')
    if (state !== storedState) {
      throw new Error('Invalid state parameter')
    }

    // Clean up stored state
    localStorage.removeItem('spotify_auth_state')

    // Create Basic Auth header with client credentials
    const authHeader = btoa(`${this.CLIENT_ID}:${this.CLIENT_SECRET}`)

    const response = await fetch(this.TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${authHeader}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.REDIRECT_URI
      })
    })

    if (!response.ok) {
      const error: SpotifyAuthError = await response.json()
      throw new Error(`Authentication failed: ${error.error_description || error.error}`)
    }

    const data: SpotifyTokenResponse = await response.json()
    return this.parseTokenResponse(data)
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshAccessToken(refreshToken: string): Promise<SpotifyAuthState> {
    // Create Basic Auth header with client credentials
    const authHeader = btoa(`${this.CLIENT_ID}:${this.CLIENT_SECRET}`)

    const response = await fetch(this.TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${authHeader}`
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
    })

    if (!response.ok) {
      const error: SpotifyAuthError = await response.json()
      throw new Error(`Token refresh failed: ${error.error_description || error.error}`)
    }

    const data: SpotifyTokenResponse = await response.json()
    const authState = this.parseTokenResponse(data)

    // If no new refresh token is provided, keep the existing one
    if (!authState.refreshToken) {
      authState.refreshToken = refreshToken
    }

    return authState
  }

  /**
   * Check if access token is expired
   */
  static isTokenExpired(expiresAt: number | null): boolean {
    if (!expiresAt) return true
    return Date.now() >= expiresAt - 60000 // Expire 1 minute early for safety
  }

  /**
   * Generate random string for state parameter
   */
  private static generateRandomString(length: number): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const array = new Uint8Array(length)
    crypto.getRandomValues(array)
    return Array.from(array, byte => charset[byte % charset.length]).join('')
  }

  /**
   * Parse token response from Spotify
   */
  private static parseTokenResponse(data: SpotifyTokenResponse): SpotifyAuthState {
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || null,
      expiresAt: Date.now() + (data.expires_in * 1000),
      isAuthenticated: true,
      user: null
    }
  }

  /**
   * Clear authentication state
   */
  static clearAuthState(): void {
    localStorage.removeItem('spotify_auth_state')
  }

  /**
   * Get stored auth state from localStorage
   */
  static getStoredAuthState(): SpotifyAuthState | null {
    try {
      const stored = localStorage.getItem('spotify_auth')
      if (!stored) return null

      const authState: SpotifyAuthState = JSON.parse(stored)

      // Check if token is expired
      if (this.isTokenExpired(authState.expiresAt)) {
        return null
      }

      return authState
    } catch (error) {
      console.warn('Failed to parse stored auth state:', error)
      return null
    }
  }

  /**
   * Store auth state in localStorage
   */
  static storeAuthState(authState: SpotifyAuthState): void {
    try {
      localStorage.setItem('spotify_auth', JSON.stringify(authState))
    } catch (error) {
      console.warn('Failed to store auth state:', error)
    }
  }

  /**
   * Remove stored auth state
   */
  static removeStoredAuthState(): void {
    localStorage.removeItem('spotify_auth')
  }
}
