// Card comparison by value (ignoring deck_id)
export function sameCard(card1, card2) {
  if (!card1 || !card2) return false
  return card1.suit === card2.suit && card1.rank === card2.rank
}

// Card string representation
export function cardString(card) {
  return `${card.suit}${card.rank}`
}

// Parse rank order for sorting
const rankOrder = {
  '2': 0, '3': 1, '4': 2, '5': 3, '6': 4, '7': 5, '8': 6, '9': 7, T: 8,
  J: 9, Q: 10, K: 11, A: 12, Js: 13, Jl: 14,
}

const suitOrder = { H: 0, D: 1, C: 2, S: 3, J: 4 }

export function sortHand(cards, trumpSuit, trumpLevel) {
  if (!cards || cards.length === 0) return []

  const isTrumpCard = (card) => {
    if (card.suit === trumpSuit) {
      // Trump suit card - order by rank
      return true
    }
    if (trumpSuit === 'J' && (card.rank === 'Js' || card.rank === 'Jl')) {
      // Joker trump
      return true
    }
    if (card.rank === trumpLevel) {
      // Trump level card
      return true
    }
    return false
  }

  const trump = []
  const other = []

  cards.forEach((card) => {
    if (isTrumpCard(card)) {
      trump.push(card)
    } else {
      other.push(card)
    }
  })

  // Sort trump cards
  trump.sort((a, b) => {
    if (a.rank === 'Jl' && b.rank === 'Jl') return 0
    if (a.rank === 'Jl') return 1
    if (b.rank === 'Jl') return -1
    if (a.rank === 'Js' && b.rank === 'Js') return 0
    if (a.rank === 'Js') return 1
    if (b.rank === 'Js') return -1
    return rankOrder[a.rank] - rankOrder[b.rank]
  })

  // Sort other cards by suit then rank
  other.sort((a, b) => {
    if (suitOrder[a.suit] !== suitOrder[b.suit]) {
      return suitOrder[a.suit] - suitOrder[b.suit]
    }
    return rankOrder[a.rank] - rankOrder[b.rank]
  })

  return [...trump, ...other]
}

// Determine which cards are selectable given current selection
export function getSelectableCards(hand, legalActions, selectedCards) {
  if (!hand || !legalActions || legalActions.length === 0) {
    return []
  }

  return hand.filter((card) =>
    legalActions.some((action) => {
      // Check if this card is in this action
      const hasCard = action.cards?.some((ac) => sameCard(ac, card))
      if (!hasCard) return false

      // Check if all selected cards are in this action
      const hasAllSelected = selectedCards.every((sc) =>
        action.cards?.some((ac) => sameCard(ac, sc))
      )
      return hasAllSelected
    })
  )
}

// Card image path
export function cardImagePath(card) {
  if (card.rank === 'Js') return '/cards/joker-small.svg'
  if (card.rank === 'Jl') return '/cards/joker-large.svg'
  return `/cards/${card.rank.toLowerCase()}-${card.suit.toLowerCase()}.svg`
}
