# CLAUDE.md — shengji-app

## What You Are Building

A React web app for playing 拖拉机. It is a pure UI — no game logic, no rules. It connects to `shengji-server` via WebSocket, renders whatever the server sends, and forwards human clicks back as action messages.

## Cardinal Rules

1. **Zero game logic in the UI.** Do not implement card comparison, trump checking, or legality validation. The server sends `legal_actions` — only those are clickable.
2. **Never construct game state locally.** All state comes from WebSocket messages. The Zustand store is a mirror of the last server message, nothing more.
3. **Highlight legal actions, grey out everything else.** Cards not in `legal_actions` are rendered but not clickable.
4. **The UI must work for spectators** (no player ID) — they see all face-down hands except the current trick.
5. **Mobile first** — the primary target is Safari on iPhone. Test layout at 390px width.

## State Management (Zustand)

```js
// store/gameStore.js
const useGameStore = create((set, get) => ({
  // Connection
  ws: null,
  connected: false,
  roomId: null,
  myPlayerId: null,

  // Game state (mirrors last server message)
  phase: null,
  currentPlayer: null,
  myHand: [],           // array of Card objects
  legalActions: [],     // array of Action objects
  currentTrick: [],     // [[player_id, [cards]], ...]
  scores: 0,
  trumpSuit: null,
  trumpLevel: null,
  dealerId: null,
  playerLevels: [],     // ["R1:7", "B1:2", ...]

  // Local UI state
  selectedCards: [],    // cards the user has clicked to select

  // Actions
  connect: (roomId, playerId) => { ... },
  disconnect: () => { ... },
  handleMessage: (msg) => { ... },   // dispatch server messages to store
  selectCard: (card) => { ... },     // toggle card selection
  submitAction: () => { ... },       // send selected cards to server
}))
```

## WebSocket Connection (hooks/useWebSocket.js)

```js
export function useWebSocket(roomId, playerId) {
  const { connect, handleMessage } = useGameStore()

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8000/ws/${roomId}/${playerId}`)

    ws.onopen = () => connect(roomId, playerId, ws)
    ws.onmessage = (e) => handleMessage(JSON.parse(e.data))
    ws.onclose = () => { /* show reconnect UI */ }

    return () => ws.close()
  }, [roomId, playerId])
}
```

## Message Handling

```js
handleMessage: (msg) => {
  switch (msg.type) {
    case 'game_state':
    case 'your_turn':
      set({
        phase: msg.state.phase,
        currentPlayer: msg.state.current_player,
        myHand: msg.state.your_hand,
        legalActions: msg.state.legal_actions,
        currentTrick: msg.state.current_trick,
        scores: msg.state.scores,
        trumpSuit: msg.state.trump_suit,
        trumpLevel: msg.state.trump_level,
        dealerId: msg.state.dealer_id,
        playerLevels: msg.state.player_levels,
        selectedCards: [],   // clear selection on new state
      })
      break
    case 'error':
      // Show toast notification
      break
    case 'game_over':
      // Show result screen
      break
  }
}
```

## Sending Actions

```js
submitAction: () => {
  const { ws, selectedCards, legalActions } = get()

  // Find the matching legal action for the selected cards
  const action = legalActions.find(a =>
    sameCards(a.cards, selectedCards)
  )
  if (!action) return  // shouldn't happen if UI enforces legality

  ws.send(JSON.stringify({
    type: 'action',
    action_type: action.action_type,
    cards: selectedCards.map(cardToDict),
  }))

  set({ selectedCards: [] })
}
```

## Component Responsibilities

### GameTable.jsx
- Top-level layout
- Positions PlayerSlot components in a hexagonal arrangement around TrickArea
- Renders YOUR Hand at the bottom
- Does not contain any state — reads from Zustand

### Hand.jsx
```jsx
// Props: cards (array), legalActions (array), onSelect (fn)
// Renders each card; legal ones are clickable, others are greyed out
// Selected cards animate upward slightly
// "Play" button appears when ≥1 card selected and selection matches a legal action
```

### CardComponent.jsx
```jsx
// Props: card, isSelected, isLegal, isFaceDown, onClick
// Renders SVG card image from /cards/{rank}-{suit}.svg
// Face-down cards show card back image
// isLegal=false → opacity 40%, cursor not-allowed
// isSelected=true → translateY(-12px)
```

### PlayerSlot.jsx
```jsx
// Props: playerId, playerLevel, cardCount, isCurrentTurn, isDealer, isHelper
// Shows player name, level badge, face-down card fan
// Pulsing border when isCurrentTurn=true
// Crown icon when isDealer=true
// Special badge when isHelper=true (once revealed)
```

### TrickArea.jsx
```jsx
// Shows cards played in current trick, one pile per player
// Positioned in center of table
// Winning combination highlighted with glow
```

## Card Rendering

Cards are identified by `{suit, rank, deck_id}`. For rendering, `deck_id` is irrelevant — show the same image for all copies.

```js
// utils/cardUtils.js
export function cardImagePath(card) {
  if (card.rank === 'SMALL_JOKER') return '/cards/joker-small.svg'
  if (card.rank === 'LARGE_JOKER') return '/cards/joker-large.svg'
  return `/cards/${card.rank.toLowerCase()}-${card.suit.toLowerCase()}.svg`
}

export function sortHand(cards, trumpSuit, trumpLevel) {
  // Sort: trump cards first (by trump rank), then by suit, then by rank
  // This is display-only sorting — does not affect legality
}
```

## Determining Legal Card Selections

The server sends `legal_actions` as a list of complete actions (each action specifies all cards to play together). The UI must figure out which cards are "selectable" given the current selection:

```js
// A card is selectable if there exists at least one legal action that includes it
// given the currently selected cards as a prefix
export function getSelectableCards(hand, legalActions, selectedCards) {
  return hand.filter(card =>
    legalActions.some(action =>
      action.cards.some(ac => sameCard(ac, card)) &&
      selectedCards.every(sc => action.cards.some(ac => sameCard(ac, sc)))
    )
  )
}
```

## Styling Notes

- Dark theme matching the scorer app: background `#0d0d0f`, accent gold `#c8954a`
- Card table green felt texture for the playing area
- Mobile: hand scrolls horizontally; other players are shown as compact icons at top
- Desktop: hexagonal table layout with 6 player positions

## AI Turn Indicator

When `currentPlayer !== myPlayerId`, show a subtle "AI is thinking..." spinner on the active player slot. The actual AI decision happens server-side (the AI agent is a separate WebSocket client).

## URL Parameters

```js
// App.jsx
const params = new URLSearchParams(window.location.search)
const roomId = params.get('room') || 'default'
const playerId = parseInt(params.get('player') ?? '0')
```

## Common Mistakes to Avoid

- **Do not sort or filter legal_actions client-side** — render exactly what the server sends
- **Do not store card objects with reference equality** — use `sameCard(a, b)` comparison by value
- **Do not show other players' hands** — `your_hand` is the only hand data the server sends
- **Selected cards must be cleared** on every incoming `game_state` message
- **AI players may not have a browser tab open** — the slot must render gracefully with zero connection info
