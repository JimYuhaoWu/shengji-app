import { useEffect } from 'react'
import useGameStore from '../store/gameStore'

export function useWebSocket(roomId, playerId) {
  const { connect, handleMessage, disconnect } = useGameStore()

  useEffect(() => {
    if (!roomId) return

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    // For spectators (playerId === null), connect with a spectator marker
    const wsUrl = playerId !== null
      ? `${wsProtocol}//${window.location.host}/ws/${roomId}/${playerId}`
      : `${wsProtocol}//${window.location.host}/ws/${roomId}/spectator`

    // Guard against this socket's stale callbacks firing after the effect has
    // been torn down (HMR / unmount). Without this, a closing socket's onclose
    // could call disconnect() and tear down a newer, live connection.
    let cancelled = false

    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      if (cancelled) {
        ws.close()
        return
      }
      console.log('WebSocket connected')
      connect(roomId, playerId, ws)
    }

    ws.onmessage = (event) => {
      if (cancelled) return
      try {
        const msg = JSON.parse(event.data)
        handleMessage(msg)
      } catch (error) {
        console.error('Failed to parse message:', error)
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    ws.onclose = () => {
      if (cancelled) return
      console.log('WebSocket disconnected')
      disconnect()
    }

    return () => {
      cancelled = true
      // Detach handlers so this socket's onclose can't disconnect a newer one,
      // and always close it regardless of readyState (CONNECTING included).
      ws.onopen = null
      ws.onmessage = null
      ws.onerror = null
      ws.onclose = null
      try {
        ws.close()
      } catch {
        // ignore
      }
    }
  }, [roomId, playerId, connect, handleMessage, disconnect])
}
