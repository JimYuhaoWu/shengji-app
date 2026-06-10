import useGameStore from '../store/gameStore'

export default function PlayerSlot({ playerId, position }) {
  const { currentPlayer, dealerId, myPlayerId, connectedPlayers, phase } = useGameStore()

  const isCurrentTurn = currentPlayer === playerId
  const isDealer = dealerId === playerId
  const isConnected = connectedPlayers.includes(playerId)
  const isYou = playerId === myPlayerId

  return (
    <div className={`player-slot player-${position}`}>
      <div className={`player-card ${isCurrentTurn ? 'current-turn' : ''}`}>
        {isDealer && <div className="dealer-badge">D</div>}

        <div className="player-info">
          <div className="player-name">
            {isYou ? 'You' : `Player ${playerId}`}
          </div>
          <div className={`connection-indicator ${isConnected ? 'connected' : 'disconnected'}`} />
        </div>

        <div className="hand-preview">
          <div className="card-fan">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="card-back" />
            ))}
          </div>
          <div className="card-count">...</div>
        </div>
      </div>
    </div>
  )
}
