import type {
  SpotifyTrack,
  SpotifyPlaylist,
  SpotifyUser,
  SpotifyPlaylistTrack,
  SpotifyApiError
} from '../types/spotify.types'

export class SpotifyApiService {
  private readonly baseUrl = 'https://api.spotify.com/v1'
  private accessToken: string

  constructor(accessToken: string) {
    if (!accessToken) {
      throw new Error('Access token is required')
    }
    this.accessToken = accessToken
  }

  /**
   * Make authenticated request to Spotify API
   */
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    })

    if (!response.ok) {
      const error: SpotifyApiError = await response.json().catch(() => ({
        error: {
          status: response.status,
          message: response.statusText
        }
      }))

      throw new Error(`Spotify API Error: ${error.error.status} ${error.error.message}`)
    }

    return response.json()
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<SpotifyUser> {
    return this.makeRequest<SpotifyUser>('/me')
  }

  /**
   * Get user's playlists
   */
  async getUserPlaylists(limit = 50, offset = 0): Promise<SpotifyPlaylist[]> {
    const response = await this.makeRequest<{items: SpotifyPlaylist[]}>(`/me/playlists?limit=${limit}&offset=${offset}`)
    return response.items
  }

  /**
   * Get all user's playlists (paginated)
   */
  async getAllUserPlaylists(): Promise<SpotifyPlaylist[]> {
    let allPlaylists: SpotifyPlaylist[] = []
    let offset = 0
    const limit = 50

    while (true) {
      const playlists = await this.getUserPlaylists(limit, offset)
      allPlaylists = [...allPlaylists, ...playlists]

      if (playlists.length < limit) {
        break // No more playlists
      }

      offset += limit
    }

    return allPlaylists
  }

  /**
   * Get tracks from a playlist
   */
  async getPlaylistTracks(playlistId: string): Promise<SpotifyTrack[]> {
    let allTracks: SpotifyTrack[] = []
    let nextUrl: string | null = `/playlists/${playlistId}/tracks?limit=50`

    while (nextUrl) {
      const response = await this.makeRequest<{
        items: SpotifyPlaylistTrack[]
        next: string | null
      }>(nextUrl)

      const validTracks = response.items
        .map((item: SpotifyPlaylistTrack) => item.track)
        .filter((track: any) => {
          // Filter out null tracks, local tracks, and tracks without preview
          return track &&
                 track.id &&
                 !track.is_local &&
                 (track.preview_url !== null || track.external_urls.spotify)
        }) as SpotifyTrack[]

      allTracks = [...allTracks, ...validTracks]

      // Update nextUrl - remove base URL if present
      nextUrl = response.next ?
        response.next.replace('https://api.spotify.com/v1', '') :
        null
    }

    return allTracks
  }

  /**
   * Get a specific track by ID
   */
  async getTrackById(trackId: string): Promise<SpotifyTrack> {
    return this.makeRequest<SpotifyTrack>(`/tracks/${trackId}`)
  }

  /**
   * Get multiple tracks by IDs
   */
  async getTracksByIds(trackIds: string[]): Promise<SpotifyTrack[]> {
    if (trackIds.length === 0) return []

    const chunks = this.chunkArray(trackIds, 50) // Spotify API limit
    const allTracks: SpotifyTrack[] = []

    for (const chunk of chunks) {
      const response = await this.makeRequest<{tracks: SpotifyTrack[]}>(`/tracks?ids=${chunk.join(',')}`)
      allTracks.push(...response.tracks.filter(track => track !== null))
    }

    return allTracks
  }

  /**
   * Search for tracks
   */
  async searchTracks(query: string, limit = 20, offset = 0): Promise<SpotifyTrack[]> {
    const encodedQuery = encodeURIComponent(query)
    const response = await this.makeRequest<{tracks: {items: SpotifyTrack[]}}>
      (`/search?q=${encodedQuery}&type=track&limit=${limit}&offset=${offset}`)

    // Filter tracks that have preview URLs
    return response.tracks.items.filter(track => track.preview_url !== null)
  }

  /**
   * Get playlist by ID
   */
  async getPlaylistById(playlistId: string): Promise<SpotifyPlaylist> {
    return this.makeRequest<SpotifyPlaylist>(`/playlists/${playlistId}`)
  }

  /**
   * Get album tracks
   */
  async getAlbumTracks(albumId: string): Promise<SpotifyTrack[]> {
    let allTracks: SpotifyTrack[] = []
    let nextUrl: string | null = `/albums/${albumId}/tracks?limit=50`

    while (nextUrl) {
      const response = await this.makeRequest<{
        items: SpotifyTrack[]
        next: string | null
      }>(nextUrl)

      // Filter tracks with preview URLs
      const validTracks = response.items.filter((track: SpotifyTrack) => track.preview_url !== null)
      allTracks = [...allTracks, ...validTracks]

      nextUrl = response.next ?
        response.next.replace('https://api.spotify.com/v1', '') :
        null
    }

    return allTracks
  }

  /**
   * Get artist's top tracks
   */
  async getArtistTopTracks(artistId: string, country = 'US'): Promise<SpotifyTrack[]> {
    const response = await this.makeRequest<{tracks: SpotifyTrack[]}>
      (`/artists/${artistId}/top-tracks?country=${country}`)

    // Filter tracks with preview URLs
    return response.tracks.filter(track => track.preview_url !== null)
  }

  /**
   * Helper function to chunk arrays
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }

  /**
   * Update access token
   */
  updateAccessToken(newToken: string): void {
    this.accessToken = newToken
  }

  /**
   * Check if current token is valid (make a simple API call)
   */
  async validateToken(): Promise<boolean> {
    try {
      await this.getCurrentUser()
      return true
    } catch (error) {
      return false
    }
  }
}
