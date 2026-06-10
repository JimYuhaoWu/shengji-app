import useGameStore from '../store/gameStore'

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
              {cards?.slice(0, 3).map((card, i) => (
                <div key={i} className="card-back small" />
              ))}
              {cards?.length > 3 && <span className="card-count">+{cards.length - 3}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
