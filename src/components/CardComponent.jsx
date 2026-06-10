import { cardImagePath } from '../utils/cardUtils'

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

  const imagePath = cardImagePath(card)

  return (
    <div
      className={`card ${isSelected ? 'selected' : ''} ${isLegal ? 'legal' : 'illegal'}`}
      onClick={handleClick}
      title={`${card.rank}${card.suit}`}
      style={{
        cursor: isLegal ? 'pointer' : 'not-allowed',
        opacity: isLegal ? 1 : 0.4,
        padding: 0,
        overflow: 'hidden',
      }}
    >
      <img
        src={imagePath}
        alt={`${card.rank}${card.suit}`}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
        onError={(e) => {
          console.error('Failed to load card image:', imagePath)
          e.target.style.display = 'none'
        }}
      />
    </div>
  )
}
