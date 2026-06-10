# Shengji Web App

A React + Vite web application for playing 拖拉机 (Shengji/升级), a Chinese card game. The app is a pure UI client that connects to [`shengji-server`](https://github.com/JimYuhaoWu/shengji-server) via WebSocket.

## Status: Phases 1–6 Complete

✅ **Phase 1: Foundation** — Vite + React + Zustand, folder structure  
✅ **Phase 2: WebSocket** — Connection, message parsing, store dispatch  
✅ **Phase 3: Game State Display** — Trump display, player slots, trick area  
✅ **Phase 4: Hand & Card Selection** — Card rendering, legal/illegal styling, selection logic  
✅ **Phase 5: Action Dispatch** — Card play protocol, index-based action submission  
✅ **Phase 6: Special Actions** — Trump declaration, kitty burying, helper calling, next-game progression  

🔄 **Phase 7: Mobile & Styling** (not started) — Responsive layout, touch targets, felt texture  
🔄 **Phase 8: Edge Cases & Polish** (not started) — Spectator mode, reconnect UI, game-over screen  

## Getting Started

### Prerequisites
- Node.js 18+ ([install from nodejs.org](https://nodejs.org/))
- `shengji-server` running on `localhost:8000`

### Setup

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Build for production
npm run build
```

### Running a Game

1. Start the server:
```bash
cd ../shengji-server
python -m uvicorn main:app --port 8000
```

2. Start the app (opens http://localhost:5173 automatically)

3. Create a room via `/rooms` POST endpoint, e.g.:
```bash
curl -X POST http://localhost:8000/rooms -H "Content-Type: application/json" -d '{"num_players": 6}'
```

4. Open the client in multiple tabs/windows:
```
http://localhost:5173/?room=<room_id>&player=0
http://localhost:5173/?room=<room_id>&player=1
...
```

## Architecture

### State Management (Zustand)
The app mirrors the server's game state exactly. All state flows through the store:
- Connection status (`connected`, `roomId`, `myPlayerId`)
- Game state (`phase`, `currentPlayer`, `myHand`, `legalActions`, etc.)
- Trump info (`trumpSuit`, `trumpLevel`, `trumpLocked`)
- Player tracking (`connectedCount`, `connectedPlayers`)
- Local UI state (`selectedCards`)

See [`src/store/gameStore.js`](src/store/gameStore.js) for full schema.

### Components
- **GameTable** — Top-level layout, hexagon player positioning
- **PlayerSlot** — Individual player (name, level, card count, connection indicator)
- **TrickArea** — Cards played in current trick
- **Hand** — Your cards at the bottom (clickable, sortable)
- **SpecialActions** — Phase-driven modals (trump bid, kitty bury, etc.)
- **CardComponent** — Individual card rendering (SVG + selection state)
- **Notification** — Toast system for errors/confirmations

### WebSocket Protocol
- **Connection**: `ws://<host>/ws/{roomId}/{playerId}`
- **Message types**: `joined`, `state_update`, `player_connected`, `player_disconnected`, `error`, `game_over`
- **Actions**: `{type: 'action', index: N}` to select a legal action
- **Semantic messages**: `{type: 'bid_trump', ...}`, `{type: 'take_kitty', ...}`, etc.

See [`CLAUDE.md`](CLAUDE.md) for protocol details.

## Card Assets

54 card SVG images from [hayeah/playing-cards-assets](https://github.com/hayeah/playing-cards-assets):
```
public/cards/
├── ace_of_hearts.svg
├── 2_of_hearts.svg
├── ...
├── black_joker.svg
└── red_joker.svg
```

Mapping handled by [`src/utils/cardUtils.js`](src/utils/cardUtils.js).

## Development Notes

### Vite Dev Proxy
The dev server proxies `/ws`, `/rooms`, and `/health` to `http://localhost:8000` so you can use relative URLs (matching a reverse-proxied production setup). See [`vite.config.js`](vite.config.js).

### Protocol Validation
The implementation was tested against the actual server source code:
- `protocol.py` — message type definitions
- `serializer.py` — message serialization  
- `game_loop.py` — action validation and state updates
- `main.py` — WebSocket server

All 67 server tests pass; game flow verified end-to-end through all phases.

### Key Implementation Details
- **Card selection**: Constrained by `legal_actions` except during KITTY (when `legal_actions_truncated=true`)
- **Action submission**: Find matching legal action in the pre-computed list, send its `index`
- **Connection tracking**: Server sends count + per-player connect/disconnect events; UI tracks both
- **Hand sorting**: Trump cards first (by trump rank), then by suit/rank
- **Face-down hands**: Only `your_hand` is sent; other players' hands shown as card counts

## Styling

Dark theme with gold accents:
- Background: `#1a1a1a` to `#2a2a2a` gradient
- Accent: `#c8954a` (gold)
- Text: `#e0e0e0` (light gray)
- Success: `#4caf50` (green)
- Error: `#f44336` (red)

Mobile-first responsive layout; primary target is iPhone (390px width).

## License

Same as [`shengji-server`](https://github.com/JimYuhaoWu/shengji-server).
