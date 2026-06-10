import { useEffect } from 'react'
import useGameStore from '../store/gameStore'
import useNotificationStore from '../store/notificationStore'
import CardComponent from './CardComponent'
import { sortHand, getSelectableCards, sameCard } from '../utils/cardUtils'

export default function Hand() {
  const { myHand, legalActions, selectedCards, currentPlayer, myPlayerId, trumpSuit, trumpLevel, lastError, selectCard, submitAction } = useGameStore()
  const { addNotification } = useNotificationStore()

  const isYourTurn = currentPlayer === myPlayerId
  const sortedHand = sortHand(myHand, trumpSuit, trumpLevel)
  const selectableCards = getSelectableCards(myHand, legalActions, selectedCards)

  // Show error notification when error occurs
  useEffect(() => {
    if (lastError) {
      addNotification(`Invalid move: ${lastError}`, 'error', 4000)
      useGameStore.setState({ lastError: null })
    }
  }, [lastError, addNotification])

  const isLegal = (card) => selectableCards.some((c) => sameCard(c, card))

  const handleCardClick = (card) => {
    if (isYourTurn) {
      selectCard(card)
    }
  }

  const handleSubmit = () => {
    if (selectedCards.length > 0 && matchesLegalAction()) {
      submitAction()
      addNotification('Action sent', 'success', 2000)
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

  if (!isYourTurn) {
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
                isSelected={false}
                isLegal={false}
              />
            ))
          )}
        </div>
        <div className="hand-status">Waiting for your turn...</div>
      </div>
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
              isLegal={isLegal(card)}
              onClick={handleCardClick}
            />
          ))
        )}
      </div>

      {selectedCards.length > 0 && (
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
