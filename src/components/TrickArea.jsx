import useGameStore from '../store/gameStore'
import { cardImagePath } from '../utils/cardUtils'

export default function TrickArea() {
  const { currentTrick } = useGameStore()

  if (!currentTrick || currentTrick.length === 0) {
    return <div className="trick-area empty">No cards played yet</div>
  }

  return (
    <div className="trick-area">
      <div className="trick-cards">
        {currentTrick.map(([playerId, cards], idx) => (
          <div key={idx} className="trick-pile">
            <div className="pile-label">P{playerId}</div>
            <div className="pile-cards">
              {cards?.map((card, i) => (
                <img
                  key={i}
                  className="trick-card"
                  src={cardImagePath(card)}
                  alt={`${card.rank}${card.suit}`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
