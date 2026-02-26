import { useState, useEffect, useCallback } from 'react'

interface UseOnlineStatusReturn {
  isOnline: boolean
  wasOffline: boolean
  checkConnection: () => Promise<boolean>
}

export function useOnlineStatus(): UseOnlineStatusReturn {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [wasOffline, setWasOffline] = useState(false)

  const handleOnline = useCallback(() => {
    setIsOnline(true)
    if (!navigator.onLine) {
      setWasOffline(true)
    }
  }, [])

  const handleOffline = useCallback(() => {
    setIsOnline(false)
    setWasOffline(true)
  }, [])

  // Check actual connectivity by attempting to reach the API
  const checkConnection = useCallback(async (): Promise<boolean> => {
    try {
      // Try to ping the API
      const response = await fetch('http://localhost:8000/health', {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      })
      return response.ok
    } catch {
      return false
    }
  }, [])

  useEffect(() => {
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [handleOnline, handleOffline])

  return { isOnline, wasOffline, checkConnection }
}

export default useOnlineStatus
