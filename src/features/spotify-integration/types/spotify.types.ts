export interface SpotifyImage {
  height: number | null
  url: string
  width: number | null
}

export interface SpotifyArtist {
  id: string
  name: string
  type: 'artist'
  uri: string
  external_urls: {
    spotify: string
  }
}

export interface SpotifyAlbum {
  id: string
  name: string
  artists: SpotifyArtist[]
  images: SpotifyImage[]
  release_date: string
  type: 'album'
  uri: string
  external_urls: {
    spotify: string
  }
}

export interface SpotifyTrack {
  id: string
  name: string
  artists: SpotifyArtist[]
  album: SpotifyAlbum
  duration_ms: number
  preview_url: string | null
  external_urls: {
    spotify: string
  }
  popularity: number
  explicit: boolean
  disc_number: number
  track_number: number
  type: 'track'
  uri: string
}

export interface SpotifyUser {
  id: string
  display_name: string
  email?: string
  images: SpotifyImage[]
  followers: {
    total: number
  }
  country?: string
  product?: string
}

export interface SpotifyPlaylist {
  id: string
  name: string
  description: string
  tracks: {
    total: number
    items: SpotifyPlaylistTrack[]
    href: string
    limit: number
    next: string | null
    offset: number
    previous: string | null
  }
  owner: SpotifyUser
  public: boolean | null
  collaborative: boolean
  images: SpotifyImage[]
  followers: {
    total: number
  }
  external_urls: {
    spotify: string
  }
  snapshot_id: string
  type: 'playlist'
  uri: string
}

export interface SpotifyPlaylistTrack {
  track: SpotifyTrack
  added_at: string
  added_by: SpotifyUser
  is_local: boolean
  primary_color: string | null
  video_thumbnail: {
    url: string | null
  }
}

export interface SpotifyAuthState {
  accessToken: string | null
  refreshToken: string | null
  expiresAt: number | null
  isAuthenticated: boolean
  user: SpotifyUser | null
}

export interface SpotifyTokenResponse {
  access_token: string
  token_type: string
  scope: string
  expires_in: number
  refresh_token?: string
}

export interface SpotifyAuthError {
  error: string
  error_description?: string
}

export interface SpotifyApiError {
  error: {
    status: number
    message: string
  }
}

export type SpotifyUrlType = 'track' | 'playlist' | 'album' | 'artist' | 'unknown'

export interface SpotifyUrlParseResult {
  type: SpotifyUrlType
  id: string | null
}
