'use client'

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react'

interface Message {
  id: string
  senderId: string
  type: 'text' | 'image' | 'video' | 'audio' | 'file' | 'service_notification'
  content: string
  mediaUrl?: string
  mediaInfo?: {
    name: string
    size: number
    type: string
    storagePath: string
  }
  timestamp: number
  read: boolean
  replyTo?: string | null
}

interface Conversation {
  id: string
  participants: Record<string, boolean>
  createdAt: number
  lastMessage: string
  lastMessageTime: number
  lastSenderId: string
  type: 'regular' | 'service'
  serviceOrderId?: string
  name?: string
}

interface User {
  id: string
  displayName?: string
  name?: string
  email?: string
  photoURL?: string
}

interface MessagingContextType {
  // State
  conversations: Conversation[]
  serviceConversations: Conversation[]
  selectedConversation: Conversation | null
  messages: Message[]
  users: Record<string, User>
  loading: boolean
  sending: boolean
  uploadingMedia: boolean
  recordingAudio: boolean
  activeTab: 'messages' | 'services'
  readReceiptsEnabled: boolean

  // Actions
  setSelectedConversation: (conversation: Conversation | null) => void
  setActiveTab: (tab: 'messages' | 'services') => void
  setReadReceiptsEnabled: (enabled: boolean) => void
  sendMessage: (text: string, replyToId?: string) => Promise<boolean>
  sendMediaMessage: (file: File, type: string, caption?: string) => Promise<boolean>
  sendServiceNotification: (serviceOrderData: any) => Promise<boolean>
  startConversation: (userId: string) => Promise<void>
  createConversation: (conversationData: any) => Promise<Conversation | null>
  createOrGetConversation: (otherUserId: string, serviceOrderId?: string) => Promise<Conversation | null>
  deleteMessage: (messageId: string) => Promise<boolean>
  
  // Utilities
  getOtherParticipant: (conversation: Conversation) => User
  loadUserData: (userId: string) => Promise<User | null>
  formatTime: (timestamp: number) => string
  getUnreadCount: (conversationId: string) => number
  
  // Constants
  MESSAGE_TYPES: Record<string, string>
}

const MessagingContext = createContext<MessagingContextType | undefined>(undefined)

export const useMessaging = () => {
  const context = useContext(MessagingContext)
  if (!context) {
    throw new Error('useMessaging must be used within a MessagingProvider')
  }
  return context
}

export const MessagingProvider = ({ children }: { children: React.ReactNode }) => {
  // State
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [serviceConversations, setServiceConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [users, setUsers] = useState<Record<string, User>>({})
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const [recordingAudio, setRecordingAudio] = useState(false)
  const [activeTab, setActiveTab] = useState<'messages' | 'services'>('messages')
  const [readReceiptsEnabled, setReadReceiptsEnabled] = useState(true)
  
  // Message types
  const MESSAGE_TYPES = {
    TEXT: 'text',
    IMAGE: 'image',
    VIDEO: 'video',
    AUDIO: 'audio',
    FILE: 'file',
    SERVICE_NOTIFICATION: 'service_notification'
  }

  // Placeholder implementations for now
  const sendMessage = useCallback(async (text: string, replyToId?: string) => {
    // TODO: Implement actual message sending logic
    console.log('sendMessage called:', { text, replyToId })
    return false
  }, [])

  const sendMediaMessage = useCallback(async (file: File, type: string, caption?: string) => {
    // TODO: Implement actual media message sending logic
    console.log('sendMediaMessage called:', { file, type, caption })
    return false
  }, [])

  const sendServiceNotification = useCallback(async (serviceOrderData: any) => {
    // TODO: Implement actual service notification logic
    console.log('sendServiceNotification called:', serviceOrderData)
    return false
  }, [])

  const startConversation = useCallback(async (userId: string) => {
    // TODO: Implement actual conversation starting logic
    console.log('startConversation called:', userId)
  }, [])

  const createConversation = useCallback(async (conversationData: any) => {
    // TODO: Implement actual conversation creation logic
    console.log('createConversation called:', conversationData)
    return null
  }, [])

  const createOrGetConversation = useCallback(async (otherUserId: string, serviceOrderId?: string) => {
    // TODO: Implement actual conversation creation/getting logic
    console.log('createOrGetConversation called:', { otherUserId, serviceOrderId })
    return null
  }, [])

  const deleteMessage = useCallback(async (messageId: string) => {
    // TODO: Implement actual message deletion logic
    console.log('deleteMessage called:', messageId)
    return false
  }, [])

  const getOtherParticipant = useCallback((conversation: Conversation) => {
    // TODO: Implement actual participant logic
    return {} as User
  }, [])

  const loadUserData = useCallback(async (userId: string) => {
    // TODO: Implement actual user data loading logic
    console.log('loadUserData called:', userId)
    return null
  }, [])

  const formatTime = useCallback((timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    } else if (diffInHours < 48) {
      return 'Ontem'
    } else {
      return date.toLocaleDateString('pt-BR')
    }
  }, [])

  const getUnreadCount = useCallback((conversationId: string) => {
    // TODO: Implement actual unread count logic
    return 0
  }, [])

  const value = useMemo(() => ({
    // State
    conversations,
    serviceConversations,
    selectedConversation,
    messages,
    users,
    loading,
    sending,
    uploadingMedia,
    recordingAudio,
    activeTab,
    readReceiptsEnabled,

    // Actions
    setSelectedConversation,
    setActiveTab,
    setReadReceiptsEnabled,
    sendMessage,
    sendMediaMessage,
    sendServiceNotification,
    startConversation,
    createConversation,
    createOrGetConversation,
    deleteMessage,
    
    // Utilities
    getOtherParticipant,
    loadUserData,
    formatTime,
    getUnreadCount,
    
    // Constants
    MESSAGE_TYPES
  }), [
    conversations,
    serviceConversations,
    selectedConversation,
    messages,
    users,
    loading,
    sending,
    uploadingMedia,
    recordingAudio,
    activeTab,
    readReceiptsEnabled,
    sendMessage,
    sendMediaMessage,
    sendServiceNotification,
    startConversation,
    createConversation,
    createOrGetConversation,
    deleteMessage,
    getOtherParticipant,
    loadUserData,
    formatTime,
    getUnreadCount
  ])

  return (
    <MessagingContext.Provider value={value}>
      {children}
    </MessagingContext.Provider>
  )
}
