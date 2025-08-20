import type { SpotifyUrlParseResult, SpotifyUrlType } from '../types/spotify.types'

export class TrackParsingService {
  private static readonly SPOTIFY_TRACK_REGEX = /spotify:track:([a-zA-Z0-9]{22})|open\.spotify\.com\/track\/([a-zA-Z0-9]{22})/
  private static readonly SPOTIFY_PLAYLIST_REGEX = /spotify:playlist:([a-zA-Z0-9]{22})|open\.spotify\.com\/playlist\/([a-zA-Z0-9]{22})/
  private static readonly SPOTIFY_ALBUM_REGEX = /spotify:album:([a-zA-Z0-9]{22})|open\.spotify\.com\/album\/([a-zA-Z0-9]{22})/
  private static readonly SPOTIFY_ARTIST_REGEX = /spotify:artist:([a-zA-Z0-9]{22})|open\.spotify\.com\/artist\/([a-zA-Z0-9]{22})/

  /**
   * Parse a Spotify URL or URI and extract the type and ID
   */
  static parseSpotifyUrl(url: string): SpotifyUrlParseResult {
    // Clean the URL
    const cleanUrl = url.trim()

    // Parse track URLs
    const trackMatch = cleanUrl.match(this.SPOTIFY_TRACK_REGEX)
    if (trackMatch) {
      const trackId = trackMatch[1] || trackMatch[2]
      return { type: 'track', id: trackId }
    }

    // Parse playlist URLs
    const playlistMatch = cleanUrl.match(this.SPOTIFY_PLAYLIST_REGEX)
    if (playlistMatch) {
      const playlistId = playlistMatch[1] || playlistMatch[2]
      return { type: 'playlist', id: playlistId }
    }

    // Parse album URLs
    const albumMatch = cleanUrl.match(this.SPOTIFY_ALBUM_REGEX)
    if (albumMatch) {
      const albumId = albumMatch[1] || albumMatch[2]
      return { type: 'album', id: albumId }
    }

    // Parse artist URLs
    const artistMatch = cleanUrl.match(this.SPOTIFY_ARTIST_REGEX)
    if (artistMatch) {
      const artistId = artistMatch[1] || artistMatch[2]
      return { type: 'artist', id: artistId }
    }

    return { type: 'unknown', id: null }
  }

  /**
   * Check if a URL is a valid Spotify URL
   */
  static isValidSpotifyUrl(url: string): boolean {
    const parsed = this.parseSpotifyUrl(url)
    return parsed.type !== 'unknown' && parsed.id !== null
  }

  /**
   * Extract track ID from a Spotify track URL
   */
  static extractTrackId(url: string): string | null {
    const parsed = this.parseSpotifyUrl(url)
    return parsed.type === 'track' ? parsed.id : null
  }

  /**
   * Extract playlist ID from a Spotify playlist URL
   */
  static extractPlaylistId(url: string): string | null {
    const parsed = this.parseSpotifyUrl(url)
    return parsed.type === 'playlist' ? parsed.id : null
  }

  /**
   * Extract album ID from a Spotify album URL
   */
  static extractAlbumId(url: string): string | null {
    const parsed = this.parseSpotifyUrl(url)
    return parsed.type === 'album' ? parsed.id : null
  }

  /**
   * Extract artist ID from a Spotify artist URL
   */
  static extractArtistId(url: string): string | null {
    const parsed = this.parseSpotifyUrl(url)
    return parsed.type === 'artist' ? parsed.id : null
  }

  /**
   * Parse multiple URLs from text (newline separated)
   */
  static parseMultipleUrls(text: string): SpotifyUrlParseResult[] {
    const urls = text.split('\n').map(line => line.trim()).filter(line => line.length > 0)
    return urls.map(url => this.parseSpotifyUrl(url)).filter(result => result.type !== 'unknown')
  }

  /**
   * Generate Spotify Web URL from ID and type
   */
  static generateSpotifyUrl(type: SpotifyUrlType, id: string): string {
    if (type === 'unknown') {
      throw new Error('Cannot generate URL for unknown type')
    }
    return `https://open.spotify.com/${type}/${id}`
  }

  /**
   * Generate Spotify URI from ID and type
   */
  static generateSpotifyUri(type: SpotifyUrlType, id: string): string {
    if (type === 'unknown') {
      throw new Error('Cannot generate URI for unknown type')
    }
    return `spotify:${type}:${id}`
  }
}
