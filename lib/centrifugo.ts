import { createHmac } from 'crypto'

export interface CentrifugoConfig {
  apiUrl: string
  apiKey: string
  tokenSecret: string
}

// Default configuration for local development
const defaultConfig: CentrifugoConfig = {
  apiUrl: process.env.CENTRIFUGO_API_URL || 'http://localhost:8000',
  apiKey: process.env.CENTRIFUGO_API_KEY || 'your_api_key_here',
  tokenSecret: process.env.CENTRIFUGO_TOKEN_SECRET || 'your_token_secret_here',
}

export class CentrifugoClient {
  private config: CentrifugoConfig

  constructor(config?: Partial<CentrifugoConfig>) {
    this.config = { ...defaultConfig, ...config }
  }

  // Generate JWT token for user authentication with Centrifugo
  generateToken(userId: string, expiresIn: number = 3600): string {
    const now = Math.floor(Date.now() / 1000)
    const payload = {
      sub: userId,
      iat: now,
      exp: now + expiresIn,
    }

    // Create HMAC signature
    const header = Buffer.from(JSON.stringify({ typ: 'JWT', alg: 'HS256' })).toString('base64url')
    const payloadEncoded = Buffer.from(JSON.stringify(payload)).toString('base64url')
    
    const signature = createHmac('sha256', this.config.tokenSecret)
      .update(`${header}.${payloadEncoded}`)
      .digest('base64url')

    return `${header}.${payloadEncoded}.${signature}`
  }

  // Publish message to a channel
  async publish(channel: string, data: any): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.apiUrl}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `apikey ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          channel,
          data,
        }),
      })

      return response.ok
    } catch (error) {
      console.error('Error publishing to Centrifugo:', error)
      return false
    }
  }

  // Publish message to multiple channels
  async broadcast(channels: string[], data: any): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.apiUrl}/broadcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `apikey ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          channels,
          data,
        }),
      })

      return response.ok
    } catch (error) {
      console.error('Error broadcasting to Centrifugo:', error)
      return false
    }
  }

  // Subscribe user to a channel
  async subscribe(userId: string, channel: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.apiUrl}/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `apikey ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          user: userId,
          channel,
        }),
      })

      return response.ok
    } catch (error) {
      console.error('Error subscribing to Centrifugo channel:', error)
      return false
    }
  }

  // Unsubscribe user from a channel
  async unsubscribe(userId: string, channel: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.apiUrl}/unsubscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `apikey ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          user: userId,
          channel,
        }),
      })

      return response.ok
    } catch (error) {
      console.error('Error unsubscribing from Centrifugo channel:', error)
      return false
    }
  }

  // Disconnect user from all channels
  async disconnect(userId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.apiUrl}/disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `apikey ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          user: userId,
        }),
      })

      return response.ok
    } catch (error) {
      console.error('Error disconnecting user from Centrifugo:', error)
      return false
    }
  }

  // Get channel presence information
  async presence(channel: string): Promise<any> {
    try {
      const response = await fetch(`${this.config.apiUrl}/presence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `apikey ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          channel,
        }),
      })

      if (response.ok) {
        return await response.json()
      }
      return null
    } catch (error) {
      console.error('Error getting channel presence:', error)
      return null
    }
  }
}

// Create singleton instance
export const centrifugo = new CentrifugoClient({
  apiUrl: process.env.CENTRIFUGO_API_URL!,
  apiKey: process.env.CENTRIFUGO_API_KEY!,
  tokenSecret: process.env.CENTRIFUGO_TOKEN_HMAC_SECRET!,
})

// Channel naming conventions
export const getChannels = {
  user: (userId: string) => `user:${userId}`,
  conversation: (conversationId: string) => `conversation:${conversationId}`,
  typing: (conversationId: string) => `typing:${conversationId}`,
  presence: (conversationId: string) => `presence:${conversationId}`,
}

// Message types for real-time events
export enum RealtimeEventType {
  MESSAGE_SENT = 'message_sent',
  MESSAGE_READ = 'message_read',
  TYPING_START = 'typing_start',
  TYPING_STOP = 'typing_stop',
  USER_ONLINE = 'user_online',
  USER_OFFLINE = 'user_offline',
  CONVERSATION_CREATED = 'conversation_created',
  NOTIFICATION = 'notification',
}

export interface RealtimeEvent {
  type: RealtimeEventType
  data: any
  timestamp: number
  userId?: string
}
