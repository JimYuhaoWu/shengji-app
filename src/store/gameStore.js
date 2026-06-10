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
  legalActions: [],
  currentTrick: [],
  scores: 0,
  trumpSuit: null,
  trumpLevel: null,
  dealerId: null,
  playerLevels: [],
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
        set({
          phase: msg.phase,
          currentPlayer: msg.current_player,
          myHand: msg.your_hand || [],
          legalActions: msg.legal_actions || [],
          currentTrick: msg.current_trick || [],
          scores: msg.scores || 0,
          trumpSuit: msg.trump_suit,
          trumpLevel: msg.trump_level,
          dealerId: msg.dealer_id,
          playerLevels: msg.player_levels || [],
          connectedPlayers: msg.connected_players || [],
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
    const { ws, selectedCards, legalActions, myPlayerId } = get()
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected')
      return
    }
    if (selectedCards.length === 0) return

    // Find matching action by cards
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

    // Send action to server
    try {
      const message = {
        type: 'action',
        cards: selectedCards.map((c) => ({
          suit: c.suit,
          rank: c.rank,
          deck_id: c.deck_id || 0,
        })),
      }
      ws.send(JSON.stringify(message))
      set({ selectedCards: [] })
    } catch (error) {
      console.error('Failed to send action:', error)
    }
  },

  clearSelection: () => {
    set({ selectedCards: [] })
  },
}))

export default useGameStore
