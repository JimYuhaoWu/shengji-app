import useGameStore from '../store/gameStore'
import { useWebSocket } from '../hooks/useWebSocket'
import PlayerSlot from './PlayerSlot'
import TrickArea from './TrickArea'
import TrumpDisplay from './TrumpDisplay'
import Hand from './Hand'
import SpecialActions from './SpecialActions'
import ReconnectBanner from './ReconnectBanner'
import GameOverScreen from './GameOverScreen'
import Notification from './Notification'

export default function GameTable() {
  const { connected, phase, currentPlayer, myPlayerId, connectedCount, roomId, isSpectator, calledRank, calledSuit } = useGameStore()

  const suitSymbol = { H: '♥', D: '♦', C: '♣', S: '♠' }
  const suitIsRed = calledSuit === 'H' || calledSuit === 'D'

  const roomParam = new URLSearchParams(window.location.search).get('room') || 'default'
  const playerParam = new URLSearchParams(window.location.search).get('player')
  // playerId is null if not provided (spectator mode) or a number if provided
  const playerId = playerParam !== null ? parseInt(playerParam) : null

  useWebSocket(roomParam, playerId)

  // Player slots arranged in hexagon: 0 (top), 1,2 (top-right/left), 3,4 (bottom-right/left), 5 (bottom)
  const playerPositions = [0, 1, 2, 3, 4, 5]

  return (
    <div className="game-table">
      <ReconnectBanner />
      <div className="status-bar">
        <div className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
          {connected ? '✓ Connected' : '◯ Disconnected'}
        </div>
        {roomId && <div className="room-info">Room: {roomId}</div>}
        {isSpectator && <div className="player-info spectator-badge">👁️ Spectating</div>}
        {myPlayerId !== null && <div className="player-info">Player: {myPlayerId}</div>}
        {connected && <div className="player-info">{connectedCount}/6 connected</div>}
        {phase && <div className="phase">Phase: {phase}</div>}
        {calledRank && calledSuit && (
          <div className="called-helper" title="The dealer's partner is whoever holds this card">
            Helper card:{' '}
            <span className="called-card" style={{ color: suitIsRed ? '#e63946' : '#e0e0e0' }}>
              {calledRank}{suitSymbol[calledSuit] || calledSuit}
            </span>
          </div>
        )}
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

        {/* Late-joiner helper: show when game in progress but few players connected */}
        {connected && phase === 'TRICK_PLAYING' && connectedCount <= 2 && (
          <div className="info-banner">
            ⏳ Waiting for other players to connect... ({connectedCount}/6 ready)
          </div>
        )}
      </div>

      {/* Phase-driven special actions (trump bid, kitty bury, call helper, next hand) */}
      <SpecialActions />

      {/* Game-over results screen */}
      <GameOverScreen />

      {/* Player's hand at the bottom */}
      <Hand />

      {/* Notifications */}
      <Notification />
    </div>
  )
}
