import { useEffect } from 'react'
import useGameStore from '../store/gameStore'
import useNotificationStore from '../store/notificationStore'
import CardComponent from './CardComponent'
import { sortHand, getSelectableCards, sameCard } from '../utils/cardUtils'

const KITTY_BURY_COUNT = 6

export default function Hand() {
  const {
    myHand,
    legalActions,
    legalActionsTruncated,
    selectedCards,
    currentPlayer,
    myPlayerId,
    phase,
    trumpSuit,
    trumpLevel,
    lastError,
    selectCard,
    submitAction,
    clearSelection,
  } = useGameStore()
  const { addNotification } = useNotificationStore()

  const isYourTurn = currentPlayer === myPlayerId
  const sortedHand = sortHand(myHand, trumpSuit, trumpLevel)

  // KITTY: legal actions are truncated (C(32,6)); the player freely picks any
  // 6 cards to bury. Otherwise selection is constrained to the legal actions.
  const isKitty = phase === 'KITTY' && legalActionsTruncated
  const selectableCards = getSelectableCards(myHand, legalActions, selectedCards)

  // Show server error notifications.
  useEffect(() => {
    if (lastError) {
      addNotification(`Invalid move: ${lastError}`, 'error', 4000)
      useGameStore.setState({ lastError: null })
    }
  }, [lastError, addNotification])

  const isSelected = (card) => selectedCards.some((c) => sameCard(c, card))

  const isLegal = (card) => {
    if (!isYourTurn) return false
    if (isKitty) {
      // Any card is buriable; once 6 are picked, lock the rest.
      return isSelected(card) || selectedCards.length < KITTY_BURY_COUNT
    }
    return selectableCards.some((c) => sameCard(c, card))
  }

  const handleCardClick = (card) => {
    if (isLegal(card)) selectCard(card)
  }

  const matchesLegalAction = () => {
    if (selectedCards.length === 0) return false
    return legalActions.some(
      (action) =>
        selectedCards.length === action.cards?.length &&
        selectedCards.every((sc) => action.cards?.some((ac) => sameCard(ac, sc)))
    )
  }

  const handleSubmit = () => {
    if (matchesLegalAction()) {
      submitAction()
      addNotification('Action sent', 'success', 2000)
    }
  }

  // The Hand's own Play button only applies to card-play phases. Trump/kitty/
  // helper phases are driven by SpecialActions.
  const showPlayButton = isYourTurn && !isKitty && selectedCards.length > 0

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
              isSelected={isSelected(card)}
              isLegal={isLegal(card)}
              onClick={handleCardClick}
            />
          ))
        )}
      </div>

      {!isYourTurn && <div className="hand-status">Waiting for your turn...</div>}

      {showPlayButton && (
        <div className="hand-actions">
          <button
            className={`submit-btn ${matchesLegalAction() ? '' : 'disabled'}`}
            onClick={handleSubmit}
            disabled={!matchesLegalAction()}
          >
            Play ({selectedCards.length})
          </button>
          <button className="clear-btn" onClick={clearSelection}>
            Clear
          </button>
        </div>
      )}
    </div>
  )
}
