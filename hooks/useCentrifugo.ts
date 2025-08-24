import { useEffect, useRef, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Centrifuge, Subscription } from 'centrifuge'
import { RealtimeEvent, RealtimeEventType, getChannels } from '@/lib/centrifugo'

interface UseCentrifugoOptions {
  onMessage?: (event: RealtimeEvent) => void
  onTyping?: (event: RealtimeEvent) => void
  onPresence?: (event: RealtimeEvent) => void
  onNotification?: (event: RealtimeEvent) => void
}

export function useCentrifugo(options: UseCentrifugoOptions = {}) {
  const { data: session } = useSession()
  const centrifugeRef = useRef<Centrifuge | null>(null)
  const subscriptionsRef = useRef<Map<string, Subscription>>(new Map())
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)

  // Initialize Centrifugo connection
  const connect = useCallback(async () => {
    if (!session?.user || centrifugeRef.current || connecting) return

    try {
      setConnecting(true)

      // Get Centrifugo token from API
      const response = await fetch('/api/centrifugo/token', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to get Centrifugo token')
      }

      const { token } = await response.json()

      // Create Centrifuge client
      const centrifuge = new Centrifuge(process.env.NEXT_PUBLIC_CENTRIFUGO_URL!, {
        token,
      })

      centrifuge.on('connected', () => {
        console.log('Connected to Centrifugo')
        setConnected(true)
        setConnecting(false)
      })

      centrifuge.on('disconnected', () => {
        console.log('Disconnected from Centrifugo')
        setConnected(false)
      })

      centrifuge.on('error', (error) => {
        console.error('Centrifugo error:', error)
        setConnecting(false)
      })

      centrifugeRef.current = centrifuge
      centrifuge.connect()

      // Subscribe to user's personal channel
      const userChannel = getChannels.user(session.user.id)
      await subscribeToChannel(userChannel, (event) => {
        switch (event.type) {
          case RealtimeEventType.NOTIFICATION:
            options.onNotification?.(event)
            break
          case RealtimeEventType.CONVERSATION_CREATED:
            // Handle new conversation
            break
          default:
            console.log('Received user event:', event)
        }
      })
    } catch (error) {
      console.error('Error connecting to Centrifugo:', error)
      setConnecting(false)
    }
  }, [session, connecting, options])

  // Disconnect from Centrifugo
  const disconnect = useCallback(() => {
    if (centrifugeRef.current) {
      centrifugeRef.current.disconnect()
      centrifugeRef.current = null
    }
    subscriptionsRef.current.clear()
    setConnected(false)
  }, [])

  // Subscribe to a channel
  const subscribeToChannel = useCallback(async (
    channel: string,
    onEvent: (event: RealtimeEvent) => void
  ) => {
    if (!centrifugeRef.current || subscriptionsRef.current.has(channel)) {
      return
    }

    try {
      const subscription = centrifugeRef.current.newSubscription(channel)

      subscription.on('publication', (ctx) => {
        const event: RealtimeEvent = {
          type: ctx.data.type,
          data: ctx.data.data,
          timestamp: ctx.data.timestamp || Date.now(),
          userId: ctx.data.userId,
        }
        onEvent(event)
      })

      subscription.on('error', (error) => {
        console.error(`Subscription error for channel ${channel}:`, error)
      })

      subscription.subscribe()
      subscriptionsRef.current.set(channel, subscription)
    } catch (error) {
      console.error(`Error subscribing to channel ${channel}:`, error)
    }
  }, [])

  // Unsubscribe from a channel
  const unsubscribeFromChannel = useCallback((channel: string) => {
    const subscription = subscriptionsRef.current.get(channel)
    if (subscription) {
      subscription.unsubscribe()
      subscriptionsRef.current.delete(channel)
    }
  }, [])

  // Subscribe to conversation
  const subscribeToConversation = useCallback((conversationId: string) => {
    const messageChannel = getChannels.conversation(conversationId)
    const typingChannel = getChannels.typing(conversationId)

    subscribeToChannel(messageChannel, (event) => {
      switch (event.type) {
        case RealtimeEventType.MESSAGE_SENT:
        case RealtimeEventType.MESSAGE_READ:
          options.onMessage?.(event)
          break
        default:
          console.log('Received conversation event:', event)
      }
    })

    subscribeToChannel(typingChannel, (event) => {
      if (event.type === RealtimeEventType.TYPING_START || 
          event.type === RealtimeEventType.TYPING_STOP) {
        options.onTyping?.(event)
      }
    })
  }, [options, subscribeToChannel])

  // Unsubscribe from conversation
  const unsubscribeFromConversation = useCallback((conversationId: string) => {
    unsubscribeFromChannel(getChannels.conversation(conversationId))
    unsubscribeFromChannel(getChannels.typing(conversationId))
  }, [unsubscribeFromChannel])

  // Send typing indicator
  const sendTyping = useCallback(async (conversationId: string, isTyping: boolean) => {
    if (!session?.user) return

    try {
      await fetch('/api/centrifugo/typing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId,
          isTyping,
        }),
      })
    } catch (error) {
      console.error('Error sending typing indicator:', error)
    }
  }, [session])

  // Auto-connect when session is available
  useEffect(() => {
    if (session?.user && !centrifugeRef.current && !connecting) {
      connect()
    }

    return () => {
      if (!session?.user) {
        disconnect()
      }
    }
  }, [session, connect, disconnect, connecting])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    connected,
    connecting,
    connect,
    disconnect,
    subscribeToConversation,
    unsubscribeFromConversation,
    sendTyping,
  }
}
