export default function CardComponent({ card, isSelected, isLegal, isFaceDown, onClick }) {
  if (!card && !isFaceDown) {
    return <div className="card placeholder" />
  }

  const handleClick = () => {
    if (isLegal && onClick) {
      onClick(card)
    }
  }

  if (isFaceDown) {
    return (
      <div className="card card-back" title="Face down card">
        <div className="card-back-pattern" />
      </div>
    )
  }

  const suitSymbol = {
    H: '♥',
    D: '♦',
    C: '♣',
    S: '♠',
    J: '🃏',
  }[card.suit] || '?'

  const suitColor = {
    H: '#e63946',
    D: '#e63946',
    C: '#000',
    S: '#000',
    J: '#c8954a',
  }[card.suit] || '#000'

  return (
    <div
      className={`card ${isSelected ? 'selected' : ''} ${isLegal ? 'legal' : 'illegal'}`}
      onClick={handleClick}
      title={`${card.rank}${card.suit}`}
      style={{
        cursor: isLegal ? 'pointer' : 'not-allowed',
        opacity: isLegal ? 1 : 0.4,
      }}
    >
      <div className="card-inner">
        <div className="card-corner top-left">
          <div className="rank">{card.rank}</div>
          <div className="suit" style={{ color: suitColor }}>
            {suitSymbol}
          </div>
        </div>
        <div className="card-center">
          <div className="suit large" style={{ color: suitColor }}>
            {suitSymbol}
          </div>
        </div>
        <div className="card-corner bottom-right">
          <div className="rank">{card.rank}</div>
          <div className="suit" style={{ color: suitColor }}>
            {suitSymbol}
          </div>
        </div>
      </div>
    </div>
  )
}
