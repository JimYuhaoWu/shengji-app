# shengji-app

Visualized web app for playing six-player 拖拉机 against human players and AI agents. Connects to `shengji-server` via WebSocket. Built with React.

## What This Is

A browser UI that:
- Renders your hand, played cards, current trick, scores, and player levels
- Lets you click cards to play them
- Shows AI "thinking" indicators when it's an AI's turn
- Works on desktop and mobile (Safari on iPhone)

## What This Is Not

- Not the game rules (see `shengji-engine`)
- Not the server (see `shengji-server`)
- Not the AI (see `shengji-ai`)
- Not the scorer app (`jimyuhaowu/shengji` — separate project for recording real-life games)

## Prerequisites

- Node.js 20+
- `shengji-server` running locally on port 8000

## Installation

```bash
git clone https://github.com/jimyuhaowu/shengji-app
cd shengji-app
npm install
```

## Running

```bash
# Start dev server (requires shengji-server running on port 8000)
npm run dev
# Open http://localhost:5173
```

## Tech Stack

- **React 18** with hooks
- **Vite** for bundling
- **Tailwind CSS** for styling
- **Native WebSocket API** (no library needed)
- **Zustand** for game state management

## Project Structure

```
shengji-app/
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── store/
│   │   └── gameStore.js      # Zustand store, WebSocket connection
│   ├── components/
│   │   ├── GameTable.jsx     # Main table view
│   │   ├── Hand.jsx          # Your hand (clickable cards)
│   │   ├── CardComponent.jsx # Single card rendering
│   │   ├── TrickArea.jsx     # Current trick in center
│   │   ├── PlayerSlot.jsx    # Other players (face-down cards, level badge)
│   │   ├── ScoreBar.jsx      # Current score, trump info
│   │   ├── LevelBadge.jsx    # Player level display
│   │   └── ActionLog.jsx     # Recent moves feed
│   ├── hooks/
│   │   └── useWebSocket.js   # WebSocket connection management
│   └── utils/
│       ├── cardUtils.js      # Card sorting, rendering helpers
│       └── protocol.js       # Message construction for server
├── public/
│   └── cards/               # Card image assets (SVG)
├── index.html
├── vite.config.js
├── tailwind.config.js
├── package.json
├── README.md
└── CLAUDE.md
```

## Connecting to a Game

```
http://localhost:5173?room=abc123&player=0
```

Parameters:
- `room` — room ID (must match what other players use)
- `player` — your player ID (0–5)

The app connects to `ws://localhost:8000/ws/{room}/{player}` automatically.

## Visual Layout

```
┌─────────────────────────────────────────┐
│  Player 5 (top-left)  Player 0 (top)  Player 1 (top-right) │
│                                         │
│          [ Current Trick Area ]         │
│                                         │
│  Player 4 (left)              Player 2 (right) │
│                                         │
│         [ Your Hand — Player 3 ]        │
│                                         │
│  Score: 85  Trump: ♥  Level: 7  Round: R1 │
└─────────────────────────────────────────┘
```

## Card Assets

Use a standard SVG card deck. Cards are named `{rank}-{suit}.svg` e.g. `7-hearts.svg`, `J-spades.svg`, `joker-small.svg`.

Place in `public/cards/`. A free SVG deck is available at: https://github.com/hayeah/playing-cards-assets

## Running Tests

```bash
npm test
```
