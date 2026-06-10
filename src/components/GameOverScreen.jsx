import useGameStore from '../store/gameStore'
import useNotificationStore from '../store/notificationStore'

export default function GameOverScreen() {
  const { phase, scores, buriedCards, myPlayerId, sendMessage } = useGameStore()
  const { addNotification } = useNotificationStore()

  if (phase !== 'SCORING') return null

  // Determine if rebellion (farmers) won by checking if farmer score > 0
  // In shengji scoring: positive score = rebellion wins, 0 or negative = farmers win
  const farmerScore = scores[0] ?? 0
  const isRebellion = farmerScore > 0

  const handleNextGame = () => {
    if (sendMessage({ type: 'next_game' })) {
      addNotification('Ready for next hand', 'success', 2000)
    }
  }

  return (
    <div className="game-over-overlay">
      <div className="game-over-modal">
        <div className={`game-over-header ${isRebellion ? 'rebellion' : 'farmer'}`}>
          {isRebellion ? '🎉 Rebellion Wins!' : '👑 Farmer Wins!'}
        </div>

        <div className="game-over-scores">
          <div className="score-grid">
            {scores.map((score, idx) => (
              <div
                key={idx}
                className={`score-item ${idx === myPlayerId ? 'your-score' : ''}`}
              >
                <div className="score-player">
                  {idx === myPlayerId ? 'You' : `P${idx}`}
                </div>
                <div className="score-value">{score}</div>
              </div>
            ))}
          </div>
        </div>

        {buriedCards && buriedCards.length > 0 && (
          <div className="buried-cards-section">
            <div className="section-title">Buried Cards</div>
            <div className="buried-cards">
              {buriedCards.map((card, idx) => (
                <div key={idx} className="buried-card">
                  {card.rank}
                  {card.suit}
                </div>
              ))}
            </div>
          </div>
        )}

        <button className="next-game-btn" onClick={handleNextGame}>
          Next Hand
        </button>
      </div>
    </div>
  )
}
