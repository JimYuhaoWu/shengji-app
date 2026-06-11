# CLAUDE.md — shengji-app

## What You Are Building

A React web app for playing 拖拉机 (Shengji/升级). It is a pure UI — no game logic, no rules. It connects to `shengji-server` via WebSocket, renders whatever the server sends, and forwards human clicks back as action messages.

## Cardinal Rules

1. **Zero game logic in the UI.** Do not implement card comparison, trump checking, or legality validation. The server sends `legal_actions` — only those are clickable.
2. **Never construct game state locally.** All state comes from WebSocket messages. The Zustand store is a mirror of the last server message, nothing more.
3. **Highlight legal actions, grey out everything else.** Cards not in `legal_actions` are rendered but not clickable.
4. **Match actual server protocol exactly.** Validate against real source code, not documentation.
5. **Mobile first** — the primary target is Safari on iPhone. Test layout at 390px width.

## Coding Standards

### 1. Simplicity First
- **Minimum code that solves the problem.** No speculative abstractions or features beyond what's asked.
- **No error handling for impossible scenarios.** Trust internal code and framework guarantees; validate only at system boundaries (user input, external APIs).
- **Three similar lines = time to extract.** One-off code stays inline.
- **Ask: "Is this overcomplicated?"** If yes, rewrite it.

### 2. Surgical Changes
- **Touch only what you must.** Don't improve adjacent code unless requested.
- **Match existing style.** Even if you'd do it differently.
- **Remove only YOUR orphans.** If your changes make an import/variable/function unused, delete it. Don't clean up pre-existing dead code.
- **Every changed line traces to the user's request.** No drive-by refactoring.

### 3. Think Before Coding
- **State assumptions explicitly.** Uncertain about interpretation? Ask before implementing.
- **Surface tradeoffs.** Don't pick silently between equally valid approaches.
- **Don't hide confusion.** If something is unclear, stop and name what's confusing.
- **Simplify when possible.** If 50 lines can do what 200 does, rewrite it.

### 4. Goal-Driven Execution
- **Define success criteria first.** Transform tasks into verifiable checks:
  - "Add WebSocket endpoint" → test connection, message receipt, broadcast
  - "Fix disconnect bug" → write test for reconnect, make it pass
  - "Implement room expiry" → test stale room cleanup, pass it
- **State brief plans for multi-step work.** Format: `1. [Step] → verify: [check]`
- **Loop until verified.** Success = tests pass + behavior matches spec.

## State Management (Zustand)

Complete schema in `src/store/gameStore.js`:

```js
const useGameStore = create((set, get) => ({
  // Connection state
  ws: null,
  connected: false,
  roomId: null,
  myPlayerId: null,

  // Game state (mirrors last server message)
  phase: 'DEALING' | 'TRUMP_DECLARATION' | 'KITTY' | 'CALL_HELPER' | 'TRICK_PLAYING' | 'SCORING',
  currentPlayer: 0-5,                    // whose turn
  myHand: [{suit, rank, deck_id}, ...],  // your cards only
  handsSize: [n, n, n, n, n, n],         // card count per player
  legalActions: [{cards, index}, ...],   // action list for current player
  legalActionsTruncated: bool,           // KITTY phase: too many actions to send
  currentTrick: [{cards, player_id}, ...], // cards played this trick
  tricksWon: [[0, ...], [1, ...], ...],  // cards won per player
  scores: [s0, s1, s2, s3, s4, s5],      // array of 6 scores
  trumpSuit: 'H' | 'D' | 'C' | 'S' | null,
  trumpLevel: '2'-'10' | 'J' | 'Q' | 'K' | 'A' | null,
  trumpLocked: bool,                     // trump declared & locked
  currentTrumpBid: {count, suit, bidder_id} | null,  // current bid
  dealerId: 0-5,
  cardsDealt: 0 or 20,                   // 20 if all dealt, 0 if dealing
  playerLevels: ['R1:7', 'B1:2', ...],   // rank:level per player
  calledRank: 'J' | 'Q' | 'K' | 'A' | null,  // helper's rank
  calledSuit: 'H' | 'D' | 'C' | 'S' | null,
  helperPlayers: [0, 1, ...],            // revealed helper IDs
  kitty: [{suit, rank, deck_id}, ...] | null,  // dealer only, KITTY phase
  buriedCards: [{suit, rank, deck_id}, ...] | null,  // revealed at SCORING

  // Connection tracking
  connectedCount: 0-6,                   // authoritative count from server
  connectedPlayers: [0, 1, ...],         // best-effort set of seats seen connect

  // Local UI state
  selectedCards: [{suit, rank, deck_id}, ...],
  lastError: string | null,

  // Actions
  connect: (roomId, playerId, ws) => { ... },
  disconnect: () => { ... },
  handleMessage: (msg) => { ... },
  selectCard: (card) => { ... },
  submitAction: () => { ... },
  sendMessage: (message) => { ... },
  clearSelection: () => { ... },
}))
```

## WebSocket Connection

**URL**: `ws://<host>/ws/{roomId}/{playerId}` (relative, proxied by Vite in dev)

```js
// hooks/useWebSocket.js
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

## Message Types

### `joined` (on connection)
```json
{
  "type": "joined",
  "room_id": "abc123",
  "player_id": 0,
  "connected_players": 3
}
```
- `connected_players` is a **count**, not a list
- Your seat is immediately connected; others join via `player_connected`

### `state_update` (broadcast to all)
```json
{
  "type": "state_update",
  "phase": "TRICK_PLAYING",
  "current_player": 2,
  "your_player_id": 1,
  "your_hand": [{suit, rank, deck_id}, ...],
  "hands_size": [12, 10, 11, 13, 12, 10],
  "legal_actions": [{cards: [...], index: 0}, {...}, ...],
  "legal_actions_truncated": false,
  "current_trick": [{cards: [...], player_id: 2}],
  "tricks_won": [[...], [...], ...],
  "scores": [100, 200, 150, 0, 50, 75],
  "trump_suit": "H",
  "trump_level": "5",
  "trump_locked": true,
  "current_trump_bid": {count: 35, suit: "H", bidder_id: 0},
  "dealer_id": 0,
  "cards_dealt": 20,
  "player_levels": ["R1:7", "B1:5", ...],
  "called_rank": "A",
  "called_suit": "S",
  "helper_players": [1, 3],
  "kitty": [...],
  "buried_cards": [...]
}
```
- Sent after every game action
- Your hand is in `your_hand` (others' hands hidden)
- `legal_actions_truncated` = true only during KITTY (too many combos to send)
- Always clear `selectedCards` on receiving this

### `player_connected`
```json
{
  "type": "player_connected",
  "player_id": 2,
  "connected_count": 4
}
```
- A seat's WebSocket just connected
- Add to `connectedPlayers` set

### `player_disconnected`
```json
{
  "type": "player_disconnected",
  "player_id": 2,
  "connected_count": 3
}
```
- A seat's WebSocket disconnected
- Remove from `connectedPlayers` set

### `error`
```json
{
  "type": "error",
  "message": "Card not in hand"
}
```
- Action was invalid
- Show in toast notification

### `game_over`
```json
{
  "type": "game_over",
  "farmer_score": 150,
  "next_dealer": 1
}
```
- Game ended; scores are final
- Show results screen

## Sending Actions

### Index-Based Action (Card Play)
The server pre-computes all legal actions for the current player. Each action in the list has an `index` property.

**To play cards:**
1. User clicks cards to select
2. Find the matching action in `legal_actions` by comparing card sets
3. Send: `{type: 'action', index: N}`

```js
// store/gameStore.js
submitAction: () => {
  const { ws, selectedCards, legalActions } = get()
  
  // Find matching action
  const matchingAction = legalActions.find((action) =>
    selectedCards.length === action.cards?.length &&
    selectedCards.every((sc) =>
      action.cards?.some(
        (ac) => ac.suit === sc.suit && ac.rank === sc.rank
      )
    )
  )
  
  if (!matchingAction) return
  
  ws.send(JSON.stringify({ type: 'action', index: matchingAction.index }))
  set({ selectedCards: [] })
}
```

### Semantic Messages (Trump, Kitty, Helper, Next Game)

#### Trump Declaration
```json
{
  "type": "bid_trump",
  "count": 35,
  "suit": "H"
}
```
- Or pass with `{type: 'pass_trump'}`

#### Kitty (KITTY Phase)
```json
{
  "type": "take_kitty",
  "bury_cards": [{suit, rank, deck_id}, ...]
}
```
- Must be exactly 6 cards
- `legal_actions_truncated = true` means any 6 are valid

#### Helper (CALL_HELPER Phase)
```json
{
  "type": "call_helper",
  "rank": "A",
  "suit": "S"
}
```
- Designate which card summons the helper
- Typically trumps' complement or non-trump ace

#### Next Game (SCORING Phase)
```json
{
  "type": "next_game"
}
```
- All players must send this to proceed
- Usually auto-sent by UI after show results

```js
// store/gameStore.js
sendMessage: (message) => {
  const { ws } = get()
  if (!ws || ws.readyState !== WebSocket.OPEN) return false
  try {
    ws.send(JSON.stringify(message))
    return true
  } catch (error) {
    console.error('Failed to send message:', error)
    return false
  }
}
```

## Component Responsibilities

### GameTable.jsx
- Top-level layout
- Renders 6 PlayerSlots in hexagonal arrangement around TrickArea
- Renders YOUR Hand at the bottom
- Status bar (connection, phase, trump, scores)
- Overlay message when disconnected
- Does not contain any state — reads from Zustand

### Hand.jsx
- Renders your cards sorted by trump, suit, rank
- Card clicking toggles selection
- Cards not in `legal_actions` (or not selectable given current selection) are greyed out
- Selected cards animate upward
- "Play" button only appears for card-play actions (not trump/kitty phases)
- KITTY phase: user freely picks exactly 6 cards to bury

### CardComponent.jsx
- Renders SVG card image from `/public/cards/`
- Props: `card`, `isSelected`, `isLegal`, `onClick`
- Face-down cards: shows card back (players' hidden hands)
- `isLegal=false` → opacity 40%, cursor not-allowed
- `isSelected=true` → translateY(-14px), gold border, glow

### PlayerSlot.jsx
- Shows: player name, level badge, hand size (as card count)
- Connection indicator (green = connected, red = disconnected)
- Dealer badge (D) at top-right
- Helper badge (H) at top-left (revealed after CALL_HELPER)
- Gold pulsing border when it's this player's turn

### TrickArea.jsx
- Shows cards played in current trick
- One pile per player
- Centered on table
- Empty state when no cards played

### SpecialActions.jsx
- **TRUMP_DECLARATION**: count dropdown, suit selector, bid/pass buttons
- **KITTY**: (rendered in Hand.jsx as free selection, sent via `take_kitty`)
- **CALL_HELPER**: rank + suit picker, `call_helper` button
- **SCORING**: `next_game` button (greyed out until all confirm)

### TrumpDisplay.jsx
- Shows current trump suit emoji and level
- Empty state before trump declared

### Notification.jsx
- Toast system in top-right corner
- Types: `info`, `success`, `error`, `warning`
- Auto-dismiss after duration (default 3000ms)

## Card Rendering

Cards are identified by `{suit, rank, deck_id}`. For rendering, `deck_id` is irrelevant — show the same image.

**Internal format**: T=10, J=Jack, Q=Queen, K=King, A=Ace, Js=Small Joker, Jl=Large Joker  
**Suit codes**: H=Hearts, D=Diamonds, C=Clubs, S=Spades

```js
// utils/cardUtils.js
export function cardImagePath(card) {
  const rankMap = {
    'T': '10', 'J': 'jack', 'Q': 'queen', 'K': 'king', 'A': 'ace',
    '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9',
    'Js': 'black_joker', 'Jl': 'red_joker',
  }
  const suitMap = { 'H': 'hearts', 'D': 'diamonds', 'C': 'clubs', 'S': 'spades' }
  
  if (rankMap[card.rank] === 'black_joker') return '/cards/black_joker.svg'
  if (rankMap[card.rank] === 'red_joker') return '/cards/red_joker.svg'
  return `/cards/${rankMap[card.rank]}_of_${suitMap[card.suit]}.svg`
}

export function sortHand(cards, trumpSuit, trumpLevel) {
  // Trump cards first (by trump rank), then by suit, then by rank
}

export function getSelectableCards(hand, legalActions, selectedCards) {
  // Return cards that can still be selected given current selection
  return hand.filter(card =>
    legalActions.some(action =>
      action.cards?.some(ac => sameCard(ac, card)) &&
      selectedCards.every(sc => action.cards?.some(ac => sameCard(ac, sc)))
    )
  )
}

export function sameCard(card1, card2) {
  return card1.suit === card2.suit && card1.rank === card2.rank
}
```

## Connection Tracking

The server sends:
- `joined` message with `connected_players` **count** (not list)
- `player_connected` events with `player_id` when a seat joins
- `player_disconnected` events with `player_id` when a seat leaves

The UI tracks:
- `connectedCount` — authoritative count from server
- `connectedPlayers` — best-effort set of seat IDs that have connected
  - **Limitation**: A late joiner only learns of seats that connect *after* it joins, because `joined` doesn't list existing players. This is a protocol limitation.

```js
// store/gameStore.js
handleMessage: (msg) => {
  switch (msg.type) {
    case 'joined':
      set((state) => ({
        connectedCount: msg.connected_players ?? state.connectedCount,
        connectedPlayers: state.connectedPlayers.includes(msg.player_id)
          ? state.connectedPlayers
          : [...state.connectedPlayers, msg.player_id],
      }))
      break
    case 'player_connected':
      set((state) => ({
        connectedCount: msg.connected_count ?? state.connectedCount,
        connectedPlayers: state.connectedPlayers.includes(msg.player_id)
          ? state.connectedPlayers
          : [...state.connectedPlayers, msg.player_id],
      }))
      break
    case 'player_disconnected':
      set((state) => ({
        connectedCount: msg.connected_count ?? state.connectedCount,
        connectedPlayers: state.connectedPlayers.filter((id) => id !== msg.player_id),
      }))
      break
  }
}
```

## Styling Notes

- Dark theme: background `#1a1a1a` to `#2a2a2a`, text `#e0e0e0`
- Accent gold: `#c8954a`
- Success: `#4caf50`, Error: `#f44336`, Warning: `#ff9800`
- Card sizing: 70px × 105px
- Hexagon table layout for 6 players (desktop)
- Mobile: compact player list at top, hand scrolls horizontally
- Face-down card: green felt gradient with pattern

## Common Mistakes to Avoid

- **Do not sort or filter `legal_actions` client-side** — render exactly what the server sends
- **Do not store card objects with reference equality** — use `sameCard(a, b)` comparison by value
- **Do not show other players' hands** — `your_hand` is the only hand data
- **Always clear `selectedCards` on incoming `state_update`** — new game state resets selection
- **`legal_actions_truncated` only appears during KITTY** — during other phases, the list is complete
- **`connectedPlayers` is a set to track, not the source of truth** — use `connectedCount` for display
- **Do not construct game state locally** — all trump/trick/score data comes from server

## Vite Dev Proxy

In `vite.config.js`, the dev server proxies WebSocket and REST endpoints:

```js
server: {
  proxy: {
    '/ws': { target: 'http://localhost:8000', ws: true, changeOrigin: true },
    '/rooms': { target: 'http://localhost:8000', changeOrigin: true },
    '/health': { target: 'http://localhost:8000', changeOrigin: true },
  },
}
```

This allows the client to use relative URLs (e.g., `ws://localhost:5173/ws/...`) which get forwarded to the backend. In production, a reverse proxy does the same.

## Session Log — 2026-06-11 (live-playtest bug fixes)

Fixes from a human-vs-5-AI playtest. Two themes: a duplicate-WebSocket storm that
prevented the human from holding a seat, and several "data was there but never
rendered / not actionable" UI gaps.

**Connection stability (the "I cannot connect" storm):**
1. **`main.jsx` — removed `<StrictMode>`.** In dev it double-invoked the
   `useWebSocket` effect, opening two sockets to the same seat; the second was
   rejected and its `onclose` tore down the live one.
2. **`hooks/useWebSocket.js` — hardened teardown.** Added a `cancelled` guard so a
   closing socket's stale `onclose` can't call the store's `disconnect()` and kill
   a newer connection; cleanup nulls all handlers and always `close()`s.
3. **`components/ReconnectBanner.jsx` — reload instead of a parallel socket.** Both
   buttons now `window.location.reload()`. The old store `reconnect()` opened a
   second socket on a self-perpetuating 2s timer that fought `useWebSocket` for the
   seat. (The server-side seat-takeover fix is the real backstop — see
   shengji-server session log.)

**Rendering / actionability:**
4. **`components/SpecialActions.jsx` — show the trump bid panel during `DEALING`.**
   Trump bidding overlaps dealing in the engine; `DEALING` now falls through to the
   `TRUMP_DECLARATION` UI so the bid/pass buttons appear while cards are dealt.
5. **`components/TrickArea.jsx` — render played cards face-up** (was a card back).
6. **`components/GameTable.jsx` — show the called helper card** (`calledRank`/
   `calledSuit`) in the status bar; the data was in the store but never displayed.
7. **`components/Hand.jsx` — orange hint when the selection isn't a complete legal
   combo** (a combo must be a single, a full pair/trio of identical cards, or a full
   tractor). Clarifies why the Play button is disabled. Also note (engine semantics):
   a "trio" is **3 identical cards** (same rank+suit, different decks), not 3
   different cards.
8. **`App.css` — styles** for `.trick-card`, `.called-helper`/`.called-card`,
   `.play-hint`.

### Known issue (NOT yet handled)

- The note above — *"`legal_actions_truncated` only appears during KITTY"* — holds
  today only because KITTY is the sole phase above the server's 500-action cap. The
  UI relies on `legal_actions` being a complete list; if the server ever truncated a
  non-KITTY phase, free card selection would break. Tracked on the server/AI side
  (make the bury signal phase-explicit). See shengji-server / shengji-ai session logs.
