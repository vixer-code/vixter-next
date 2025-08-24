'use client'

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react'

interface Notification {
  id: number
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  duration: number
}

interface NotificationContextType {
  notifications: Notification[]
  addNotification: (notification: Partial<Notification>) => number
  removeNotification: (id: number) => void
  showSuccess: (message: string, title?: string, duration?: number) => number
  showError: (message: string, title?: string, duration?: number) => number
  showWarning: (message: string, title?: string, duration?: number) => number
  showInfo: (message: string, title?: string, duration?: number) => number
  clearAll: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = useCallback((notification: Partial<Notification>) => {
    const id = Date.now() + Math.random()
    const newNotification: Notification = {
      id,
      type: 'info',
      title: '',
      message: '',
      duration: 5000,
      ...notification,
    }

    setNotifications(prev => [...prev, newNotification])

    // Auto-remove notification after duration
    if (newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, newNotification.duration)
    }

    return id
  }, [])

  const removeNotification = useCallback((id: number) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }, [])

  const showSuccess = useCallback((message: string, title = 'Success', duration = 5000) => {
    return addNotification({
      type: 'success',
      title,
      message,
      duration,
    })
  }, [addNotification])

  const showError = useCallback((message: string, title = 'Error', duration = 7000) => {
    return addNotification({
      type: 'error',
      title,
      message,
      duration,
    })
  }, [addNotification])

  const showWarning = useCallback((message: string, title = 'Warning', duration = 6000) => {
    return addNotification({
      type: 'warning',
      title,
      message,
      duration,
    })
  }, [addNotification])

  const showInfo = useCallback((message: string, title = 'Info', duration = 5000) => {
    return addNotification({
      type: 'info',
      title,
      message,
      duration,
    })
  }, [addNotification])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  const value = useMemo(() => ({
    notifications,
    addNotification,
    removeNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    clearAll,
  }), [notifications, addNotification, removeNotification, showSuccess, showError, showWarning, showInfo, clearAll])

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}
