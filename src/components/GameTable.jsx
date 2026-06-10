import useGameStore from '../store/gameStore'
import { useWebSocket } from '../hooks/useWebSocket'

export default function GameTable() {
  const { connected, phase, currentPlayer, myPlayerId, connectedPlayers, roomId } = useGameStore()

  const roomParam = new URLSearchParams(window.location.search).get('room') || 'default'
  const playerParam = new URLSearchParams(window.location.search).get('player')

  useWebSocket(roomParam, playerParam ? parseInt(playerParam) : null)

  return (
    <div className="game-table">
      <div className="status-bar">
        <div className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
          {connected ? '✓ Connected' : '◯ Disconnected'}
        </div>
        {roomId && <div className="room-info">Room: {roomId}</div>}
        {myPlayerId !== null && <div className="player-info">Player: {myPlayerId}</div>}
        {phase && <div className="phase">Phase: {phase}</div>}
        {currentPlayer !== null && (
          <div className={`current-player ${currentPlayer === myPlayerId ? 'your-turn' : ''}`}>
            Current: {currentPlayer === myPlayerId ? 'You' : `P${currentPlayer}`}
          </div>
        )}
      </div>

      <div className="table-layout">
        <div className="placeholder">
          <h1>Game Table</h1>
          <p>
            {!connected
              ? 'Waiting to connect...'
              : phase
                ? `In ${phase} phase`
                : 'Game not started'}
          </p>
          {connectedPlayers.length > 0 && (
            <div className="connected-players">
              Connected: {connectedPlayers.join(', ')}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
