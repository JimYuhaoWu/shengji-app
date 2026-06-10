import useGameStore from '../store/gameStore'
import CardComponent from './CardComponent'
import { sortHand, getSelectableCards, sameCard } from '../utils/cardUtils'

export default function Hand() {
  const { myHand, legalActions, selectedCards, currentPlayer, myPlayerId, trumpSuit, trumpLevel, selectCard, submitAction } = useGameStore()

  const isYourTurn = currentPlayer === myPlayerId
  const sortedHand = sortHand(myHand, trumpSuit, trumpLevel)
  const selectableCards = getSelectableCards(myHand, legalActions, selectedCards)

  const isLegal = (card) => selectableCards.some((c) => sameCard(c, card))

  const handleCardClick = (card) => {
    selectCard(card)
  }

  const handleSubmit = () => {
    if (selectedCards.length > 0) {
      submitAction()
    }
  }

  const matchesLegalAction = () => {
    if (selectedCards.length === 0) return false
    return legalActions.some(
      (action) =>
        selectedCards.length === action.cards?.length &&
        selectedCards.every((sc) =>
          action.cards?.some((ac) => sameCard(ac, sc))
        )
    )
  }

  return (
    <div className="hand-container">
      <div className="hand">
        {sortedHand.length === 0 ? (
          <div className="no-cards">No cards in hand</div>
        ) : (
          sortedHand.map((card, idx) => (
            <CardComponent
              key={`${card.suit}-${card.rank}-${idx}`}
              card={card}
              isSelected={selectedCards.some((c) => sameCard(c, card))}
              isLegal={isLegal(card) && isYourTurn}
              onClick={handleCardClick}
            />
          ))
        )}
      </div>

      {isYourTurn && selectedCards.length > 0 && (
        <div className="hand-actions">
          <button
            className={`submit-btn ${matchesLegalAction() ? 'enabled' : 'disabled'}`}
            onClick={handleSubmit}
            disabled={!matchesLegalAction()}
          >
            Play ({selectedCards.length})
          </button>
          <button
            className="clear-btn"
            onClick={() => {
              useGameStore.setState({ selectedCards: [] })
            }}
          >
            Clear
          </button>
        </div>
      )}
    </div>
  )
}
