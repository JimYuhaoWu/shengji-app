import useGameStore from '../store/gameStore'
import { useWebSocket } from '../hooks/useWebSocket'
import PlayerSlot from './PlayerSlot'
import TrickArea from './TrickArea'
import TrumpDisplay from './TrumpDisplay'
import Hand from './Hand'

export default function GameTable() {
  const { connected, phase, currentPlayer, myPlayerId, connectedPlayers, roomId } = useGameStore()

  const roomParam = new URLSearchParams(window.location.search).get('room') || 'default'
  const playerParam = new URLSearchParams(window.location.search).get('player')

  useWebSocket(roomParam, playerParam ? parseInt(playerParam) : null)

  // Player slots arranged in hexagon: 0 (top), 1,2 (top-right/left), 3,4 (bottom-right/left), 5 (bottom)
  const playerPositions = [0, 1, 2, 3, 4, 5]

  return (
    <div className="game-table">
      <div className="status-bar">
        <div className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
          {connected ? '✓ Connected' : '◯ Disconnected'}
        </div>
        {roomId && <div className="room-info">Room: {roomId}</div>}
        {myPlayerId !== null && <div className="player-info">Player: {myPlayerId}</div>}
        {phase && <div className="phase">Phase: {phase}</div>}
        <div className="trump-container">
          <TrumpDisplay />
        </div>
      </div>

      <div className="table-layout">
        <div className="table-container">
          {/* Player slots in hexagon arrangement */}
          <div className="hexagon-table">
            {playerPositions.map((position) => (
              <PlayerSlot key={position} playerId={position} position={position} />
            ))}
          </div>

          {/* Center trick area */}
          <div className="center-area">
            <TrickArea />
          </div>
        </div>

        {/* Fallback message when game hasn't started */}
        {!connected && (
          <div className="overlay-message">
            <p>Waiting to connect...</p>
          </div>
        )}
      </div>

      {/* Player's hand at the bottom */}
      <Hand />
    </div>
  )
}
