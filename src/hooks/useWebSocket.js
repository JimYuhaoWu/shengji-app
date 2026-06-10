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

    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      console.log('WebSocket connected')
      connect(roomId, playerId, ws)
    }

    ws.onmessage = (event) => {
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
      console.log('WebSocket disconnected')
      disconnect()
    }

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close()
      }
    }
  }, [roomId, playerId, connect, handleMessage, disconnect])
}
