import useGameStore from '../store/gameStore'

export default function PlayerSlot({ playerId, position }) {
  const { currentPlayer, dealerId, myPlayerId, connectedPlayers, handsSize, helperPlayers, playerLevels } = useGameStore()

  const isCurrentTurn = currentPlayer === playerId
  const isDealer = dealerId === playerId
  const isConnected = connectedPlayers.includes(playerId)
  const isYou = playerId === myPlayerId
  const isHelper = helperPlayers?.includes(playerId)
  const cardCount = handsSize?.[playerId] ?? 0
  const level = playerLevels?.[playerId]

  // Render a small fan capped at 5 backs regardless of true count.
  const fanCount = Math.min(cardCount, 5)

  return (
    <div className={`player-slot player-${position}`}>
      <div className={`player-card ${isCurrentTurn ? 'current-turn' : ''}`}>
        {isDealer && <div className="dealer-badge" title="Dealer">D</div>}
        {isHelper && <div className="helper-badge" title="Helper">H</div>}

        <div className="player-info">
          <div className="player-name">
            {isYou ? 'You' : `Player ${playerId}`}
          </div>
          {level && <div className="player-level">{level}</div>}
          <div className={`connection-indicator ${isConnected ? 'connected' : 'disconnected'}`} />
        </div>

        <div className="hand-preview">
          <div className="card-fan">
            {Array.from({ length: fanCount }).map((_, i) => (
              <div key={i} className="card-back" />
            ))}
          </div>
          <div className="card-count">{cardCount} cards</div>
        </div>
      </div>
    </div>
  )
}
