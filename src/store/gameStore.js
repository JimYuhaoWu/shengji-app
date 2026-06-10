import { create } from 'zustand'

const useGameStore = create((set, get) => ({
  // Connection state
  ws: null,
  connected: false,
  roomId: null,
  myPlayerId: null,

  // Game state (mirrors last server message)
  phase: null,
  currentPlayer: null,
  myHand: [],
  handsSize: [],          // card count per player (opponents' hands stay hidden)
  legalActions: [],
  legalActionsTruncated: false,  // KITTY phase: too many actions to send
  currentTrick: [],
  tricksWon: [],
  scores: [],             // array per the engine (NOT a scalar)
  trumpSuit: null,
  trumpLevel: null,
  trumpLocked: false,
  currentTrumpBid: null,  // {count, suit, bidder_id}
  dealerId: null,
  cardsDealt: 0,
  playerLevels: [],
  calledRank: null,
  calledSuit: null,
  helperPlayers: [],
  kitty: null,            // dealer-only, during KITTY phase
  buriedCards: null,      // revealed at SCORING
  connectedPlayers: [],

  // Local UI state
  selectedCards: [],
  lastError: null,

  // Actions
  connect: (roomId, playerId, ws) => {
    set({
      roomId,
      myPlayerId: playerId,
      ws,
      connected: true,
    })
  },

  disconnect: () => {
    const { ws } = get()
    if (ws) {
      ws.close()
    }
    set({
      ws: null,
      connected: false,
      roomId: null,
      myPlayerId: null,
    })
  },

  handleMessage: (msg) => {
    switch (msg.type) {
      case 'joined':
        set({
          myPlayerId: msg.player_id,
          roomId: msg.room_id,
          connectedPlayers: msg.connected_players || [],
        })
        break

      case 'state_update':
        // NOTE: state_update does NOT carry connected_players — that field comes
        // only from joined / player_connected / player_disconnected. Do not reset it here.
        set({
          phase: msg.phase,
          currentPlayer: msg.current_player,
          myPlayerId: msg.your_player_id ?? get().myPlayerId,
          myHand: msg.your_hand || [],
          handsSize: msg.hands_size || [],
          legalActions: msg.legal_actions || [],
          legalActionsTruncated: msg.legal_actions_truncated || false,
          currentTrick: msg.current_trick || [],
          tricksWon: msg.tricks_won || [],
          scores: msg.scores || [],
          trumpSuit: msg.trump_suit,
          trumpLevel: msg.trump_level,
          trumpLocked: msg.trump_locked || false,
          currentTrumpBid: msg.current_trump_bid || null,
          dealerId: msg.dealer_id,
          cardsDealt: msg.cards_dealt || 0,
          playerLevels: msg.player_levels || [],
          calledRank: msg.called_rank ?? null,
          calledSuit: msg.called_suit ?? null,
          helperPlayers: msg.helper_players || [],
          kitty: msg.kitty || null,
          buriedCards: msg.buried_cards || null,
          selectedCards: [],
        })
        break

      case 'player_connected':
      case 'player_disconnected':
        set((state) => ({
          connectedPlayers: msg.connected_players || state.connectedPlayers,
        }))
        break

      case 'error':
        set({ lastError: msg.message })
        console.error('Server error:', msg.message)
        break

      case 'game_over':
        console.log('Game over - farmer_score:', msg.farmer_score, 'next_dealer:', msg.next_dealer)
        set({
          phase: 'SCORING',
        })
        break

      default:
        // Unknown message type, ignore silently
        console.debug('Unknown message type:', msg.type)
        break
    }
  },

  selectCard: (card) => {
    set((state) => {
      const isSelected = state.selectedCards.some(
        (c) => c.suit === card.suit && c.rank === card.rank && c.deck_id === card.deck_id
      )
      if (isSelected) {
        return {
          selectedCards: state.selectedCards.filter(
            (c) => !(c.suit === card.suit && c.rank === card.rank && c.deck_id === card.deck_id)
          ),
        }
      } else {
        return {
          selectedCards: [...state.selectedCards, card],
        }
      }
    })
  },

  submitAction: () => {
    const { ws, selectedCards, legalActions } = get()
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected')
      return
    }
    if (selectedCards.length === 0) return

    // Find the matching pre-computed legal action by its cards.
    const matchingAction = legalActions.find((action) =>
      selectedCards.length === action.cards?.length &&
      selectedCards.every((sc) =>
        action.cards?.some(
          (ac) => ac.suit === sc.suit && ac.rank === sc.rank
        )
      )
    )

    if (!matchingAction) {
      console.error('No matching action for selected cards')
      return
    }

    // The server's "action" path selects state.legal_actions[index]; each
    // serialized action carries its own index. Echo that index back.
    try {
      ws.send(JSON.stringify({ type: 'action', index: matchingAction.index }))
      set({ selectedCards: [] })
    } catch (error) {
      console.error('Failed to send action:', error)
    }
  },

  // Send a raw semantic message (bid_trump, pass_trump, take_kitty, call_helper,
  // play_cards, next_game). Used by special-action UIs in Phase 6.
  sendMessage: (message) => {
    const { ws } = get()
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected')
      return false
    }
    try {
      ws.send(JSON.stringify(message))
      return true
    } catch (error) {
      console.error('Failed to send message:', error)
      return false
    }
  },

  clearSelection: () => {
    set({ selectedCards: [] })
  },
}))

export default useGameStore
