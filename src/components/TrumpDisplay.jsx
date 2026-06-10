import useGameStore from '../store/gameStore'

export default function TrumpDisplay() {
  const { trumpSuit, trumpLevel } = useGameStore()

  if (!trumpSuit) {
    return <div className="trump-display empty">No trump yet</div>
  }

  const suitSymbol = {
    H: '♥',
    D: '♦',
    C: '♣',
    S: '♠',
    J: 'Joker',
  }[trumpSuit] || trumpSuit

  return (
    <div className="trump-display">
      <div className="trump-label">Trump:</div>
      <div className="trump-content">
        <span className="trump-suit">{suitSymbol}</span>
        <span className="trump-level">{trumpLevel}</span>
      </div>
    </div>
  )
}
