# Phase 8: Edge Cases & Polish — Implementation Plan

## Goal
Handle spectator mode, graceful reconnection, game-over flows, and edge cases to create a polished, production-ready experience.

## 1. Spectator Mode

### Concept
A user can join a room without a `player` parameter: `http://localhost:5173/?room=abc123`
- No player ID assigned
- View all face-up cards in the current trick
- View all players, their levels, connected status
- Cannot play cards, bid, or interact
- See game state updates in real-time
- Can rejoin as a player if desired

### Implementation

#### Store Changes (`src/store/gameStore.js`)

Add fields:
```js
isSpectator: false,  // true if no myPlayerId
canInteract: false,  // false if spectator
```

Update `connect()`:
```js
connect: (roomId, playerId, ws) => {
  set({
    roomId,
    myPlayerId: playerId,  // null if spectator
    ws,
    connected: true,
    isSpectator: playerId === null,
    canInteract: playerId !== null,
  })
}
```

#### Hook Changes (`src/hooks/useWebSocket.js`)

Handle null playerId:
```js
export function useWebSocket(roomId, playerId) {
  useEffect(() => {
    // If playerId is null, still connect as spectator
    const url = playerId !== null
      ? `/ws/${roomId}/${playerId}`
      : `/ws/${roomId}/spectator`  // or similar; verify server API
    
    const ws = new WebSocket(url)
    // ... rest unchanged
  }, [roomId, playerId])
}
```

**Decision Point**: Check if server supports `spectator` URL or requires a player ID. If server requires player ID:
- Use playerId = -1 or null (server decides)
- Server sends `your_player_id: null` or similar in response

#### Component Changes

**GameTable.jsx**
- Disable "Waiting for your turn..." message if spectator
- Show "Spectating as observer" in status bar

**Hand.jsx**
```js
if (!isSpectator) {
  // Show hand, allow selection
} else {
  // Show "You are spectating" message
  return null
}
```

**SpecialActions.jsx**
```js
export default function SpecialActions() {
  const { isSpectator } = useGameStore()
  if (isSpectator) return null  // Spectators can't take actions
  // ... rest unchanged
}
```

**PlayerSlot.jsx**
- Always render all player slots (even if spectator)
- Connection indicators work for all players
- No special "your turn" styling for spectator

#### URL Handling (`GameTable.jsx`)

```js
const roomParam = new URLSearchParams(window.location.search).get('room') || 'default'
const playerParam = new URLSearchParams(window.location.search).get('player')
const playerId = playerParam ? parseInt(playerParam) : null

useWebSocket(roomParam, playerId)
```

---

## 2. Reconnect Banner

### Concept
When WebSocket disconnects unexpectedly, show a banner prompting reconnection.

**States:**
- `connected: true` — normal, hide banner
- `connected: false, lastError: null` — attempting to reconnect (show "Reconnecting...")
- `connected: false, lastError: "..."` — connection failed (show "Connection lost. Retry?" button)

### Implementation

#### Store Changes (`src/store/gameStore.js`)

Add:
```js
reconnectAttempts: 0,
maxReconnectAttempts: 5,
reconnectDelay: 2000,  // ms
```

Update `disconnect()`:
```js
disconnect: () => {
  const { ws } = get()
  if (ws) ws.close()
  set({
    ws: null,
    connected: false,
    // Keep roomId, myPlayerId for reconnect
  })
}
```

Add action:
```js
reconnect: async () => {
  const { roomId, myPlayerId, reconnectAttempts, maxReconnectAttempts } = get()
  if (reconnectAttempts >= maxReconnectAttempts) {
    set({ lastError: 'Max reconnection attempts reached' })
    return false
  }
  
  set({ reconnectAttempts: reconnectAttempts + 1 })
  
  try {
    const ws = new WebSocket(`/ws/${roomId}/${myPlayerId}`)
    
    ws.onopen = () => {
      set({
        ws,
        connected: true,
        reconnectAttempts: 0,
        lastError: null,
      })
      addNotification('Reconnected!', 'success', 2000)
    }
    
    ws.onerror = () => {
      set({ lastError: 'Connection failed. Retrying...' })
    }
    
    // ... rest of handlers
  } catch (err) {
    set({ lastError: err.message })
  }
}
```

#### Hook Changes (`src/hooks/useWebSocket.js`)

Auto-reconnect on close:
```js
ws.onclose = () => {
  set({ connected: false })
  // Attempt automatic reconnect after delay
  setTimeout(() => {
    const { connected, disconnect } = useGameStore.getState()
    if (!connected) {
      get().reconnect()
    }
  }, 2000)
}
```

#### Component: `ReconnectBanner.jsx` (NEW)

```jsx
import useGameStore from '../store/gameStore'

export default function ReconnectBanner() {
  const { connected, lastError, reconnect, reconnectAttempts, maxReconnectAttempts } = useGameStore()
  
  if (connected) return null
  
  const isMaxed = reconnectAttempts >= maxReconnectAttempts
  
  return (
    <div className="reconnect-banner">
      <div className="reconnect-content">
        <div className="reconnect-icon">⚠️</div>
        <div className="reconnect-text">
          {isMaxed ? (
            <>
              <div className="reconnect-title">Connection failed</div>
              <div className="reconnect-message">
                Unable to reconnect. Please refresh the page.
              </div>
            </>
          ) : (
            <>
              <div className="reconnect-title">
                {lastError ? 'Connection lost' : 'Reconnecting...'}
              </div>
              <div className="reconnect-message">
                {lastError || `Attempt ${reconnectAttempts}/${maxReconnectAttempts}`}
              </div>
            </>
          )}
        </div>
        {!isMaxed && (
          <button className="reconnect-button" onClick={reconnect}>
            Retry now
          </button>
        )}
        {isMaxed && (
          <button className="reconnect-button" onClick={() => window.location.reload()}>
            Refresh page
          </button>
        )}
      </div>
    </div>
  )
}
```

#### CSS (`src/App.css`)

```css
.reconnect-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: rgba(200, 80, 80, 0.95);
  padding: 12px 16px;
  z-index: 999;
  border-bottom: 2px solid #f44336;
}

.reconnect-content {
  display: flex;
  align-items: center;
  gap: 16px;
  max-width: 1200px;
  margin: 0 auto;
}

.reconnect-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.reconnect-text {
  flex: 1;
}

.reconnect-title {
  font-weight: 600;
  color: #fff;
  font-size: 14px;
}

.reconnect-message {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 2px;
}

.reconnect-button {
  padding: 8px 16px;
  background: #fff;
  color: #c83232;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.reconnect-button:hover {
  background: #f0f0f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

@media (max-width: 640px) {
  .reconnect-banner {
    padding: 10px 12px;
  }
  
  .reconnect-content {
    flex-wrap: wrap;
    gap: 10px;
  }
  
  .reconnect-text {
    flex: 1 1 100%;
  }
  
  .reconnect-button {
    flex: 0 1 auto;
  }
}
```

#### GameTable.jsx Integration

```jsx
import ReconnectBanner from './ReconnectBanner'

export default function GameTable() {
  // ... existing code
  
  return (
    <div className="game-table">
      <ReconnectBanner />  {/* Add at top */}
      <div className="status-bar">
        {/* ... */}
      </div>
      {/* ... rest of layout ... */}
    </div>
  )
}
```

---

## 3. Game-Over Screen

### Concept
When game ends (`phase === 'SCORING'` after `game_over` message), show results instead of normal UI.

**Display:**
- Winning team and score
- Player rankings
- Cards buried/won
- "Next Hand" button (or wait for others)

### Implementation

#### Component: `GameOverScreen.jsx` (NEW)

```jsx
import useGameStore from '../store/gameStore'
import useNotificationStore from '../store/notificationStore'

export default function GameOverScreen() {
  const { phase, scores, buriedCards, tricksWon, helperPlayers, myPlayerId, sendMessage } = useGameStore()
  const { addNotification } = useNotificationStore()
  
  if (phase !== 'SCORING') return null
  
  // Calculate winners
  // (This is display-only; server sends results)
  const farmerScore = scores[0]  // or check from game_over message
  const isRebellion = farmerScore > 0  // farmers won
  
  const handleNextGame = () => {
    if (sendMessage({ type: 'next_game' })) {
      addNotification('Ready for next hand', 'success', 2000)
    }
  }
  
  return (
    <div className="game-over-overlay">
      <div className="game-over-modal">
        <div className={`game-over-header ${isRebellion ? 'rebellion' : 'farmer'}`}>
          {isRebellion ? '🎉 Rebellion Wins!' : '👑 Farmer Wins!'}
        </div>
        
        <div className="game-over-scores">
          <div className="score-grid">
            {scores.map((score, idx) => (
              <div key={idx} className="score-item">
                <div className="score-player">Player {idx}</div>
                <div className="score-value">{score}</div>
              </div>
            ))}
          </div>
        </div>
        
        {buriedCards && (
          <div className="buried-cards-section">
            <div className="section-title">Buried Cards</div>
            <div className="buried-cards">
              {buriedCards.map((card, idx) => (
                <div key={idx} className="buried-card">
                  {card.rank}{card.suit}
                </div>
              ))}
            </div>
          </div>
        )}
        
        <button className="next-game-btn" onClick={handleNextGame}>
          Next Hand
        </button>
      </div>
    </div>
  )
}
```

#### CSS (`src/App.css`)

```css
.game-over-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 500;
}

.game-over-modal {
  background: rgba(30, 30, 30, 0.98);
  border: 2px solid #c8954a;
  border-radius: 12px;
  padding: 32px 24px;
  max-width: 500px;
  width: 90%;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.game-over-header {
  font-size: 28px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 24px;
  padding: 16px;
  border-radius: 8px;
}

.game-over-header.rebellion {
  background: rgba(76, 175, 80, 0.1);
  color: #4caf50;
  border: 1px solid rgba(76, 175, 80, 0.3);
}

.game-over-header.farmer {
  background: rgba(200, 149, 74, 0.1);
  color: #c8954a;
  border: 1px solid rgba(200, 149, 74, 0.3);
}

.game-over-scores {
  margin-bottom: 24px;
}

.score-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.score-item {
  background: rgba(50, 50, 50, 0.8);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px;
  text-align: center;
}

.score-player {
  font-size: 12px;
  color: var(--text-dim);
  margin-bottom: 6px;
}

.score-value {
  font-size: 24px;
  font-weight: 700;
  color: #c8954a;
}

.buried-cards-section {
  margin-bottom: 24px;
  background: rgba(0, 0, 0, 0.3);
  padding: 12px;
  border-radius: 8px;
}

.section-title {
  font-size: 13px;
  color: var(--text-dim);
  margin-bottom: 8px;
  font-weight: 600;
}

.buried-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.buried-card {
  background: rgba(200, 149, 74, 0.1);
  border: 1px solid rgba(200, 149, 74, 0.3);
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 12px;
  color: #c8954a;
}

.next-game-btn {
  width: 100%;
  padding: 14px;
  background: #c8954a;
  color: #000;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.next-game-btn:hover {
  background: #d8a55a;
  box-shadow: 0 4px 12px rgba(200, 149, 74, 0.3);
}

.next-game-btn:active {
  transform: scale(0.98);
}

@media (max-width: 640px) {
  .game-over-modal {
    padding: 24px 16px;
  }
  
  .game-over-header {
    font-size: 24px;
    margin-bottom: 20px;
  }
  
  .score-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .next-game-btn {
    padding: 12px;
    font-size: 14px;
  }
}
```

#### GameTable.jsx Integration

```jsx
import GameOverScreen from './GameOverScreen'

export default function GameTable() {
  return (
    <div className="game-table">
      <ReconnectBanner />
      {/* ... status bar, table layout, etc ... */}
      <GameOverScreen />  {/* Add before Hand */}
      <Hand />
      <SpecialActions />
      <Notification />
    </div>
  )
}
```

---

## 4. Edge Case Handling

### A. AI Turn Indicator

When `currentPlayer !== myPlayerId` and player is connected, show subtle "thinking..." spinner.

#### Component: `AITurnSpinner.jsx` (optional, add to PlayerSlot)

```jsx
export default function AITurnSpinner({ isAI, isConnected }) {
  if (!isAI || !isConnected) return null
  
  return (
    <div className="ai-spinner">
      <div className="spinner-dot"></div>
    </div>
  )
}
```

#### CSS

```css
.ai-spinner {
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: rgba(100, 181, 246, 0.2);
  border: 2px solid #64b5f6;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner-dot {
  width: 6px;
  height: 6px;
  background: #64b5f6;
  border-radius: 50%;
  animation: pulse-dot 1.5s infinite;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
```

### B. Late-Joiner UI

When a player first loads and doesn't yet see connected players, show placeholder state.

**Current state in Phase 6**: Already handled via `connectedCount` and `player_connected` events. Connection indicator shows red until player connects.

**Enhancement**: Add a helpful note in GameTable when game is in progress but player just joined.

```jsx
{connected && myPlayerId !== null && phase === 'TRICK_PLAYING' && connectedCount <= 2 && (
  <div className="info-banner">
    Waiting for other players to connect... ({connectedCount}/6)
  </div>
)}
```

### C. Empty Hand Graceful Degradation

If player has 0 cards (shouldn't happen, but handle it):
```jsx
if (sortedHand.length === 0) {
  return <div className="no-cards">Your hand is empty</div>
}
```

Already implemented in Phase 4.

### D. Missing Data Handling

If server sends incomplete state (e.g., `scores: []` instead of 6 values):
```js
// In PlayerSlot.jsx
const playerScore = scores[playerId] ?? 0
```

Use nullish coalescing to default to 0.

### E. Connection Without Game

If connected but no game state yet (waiting for `state_update`):
```jsx
if (!phase) {
  return <div className="waiting-for-game">Waiting for game to start...</div>
}
```

---

## 5. Implementation Steps

### Step 1: Spectator Mode
1. Update `gameStore.js`: Add `isSpectator`, `canInteract` fields
2. Update `useWebSocket.js`: Handle null `playerId`
3. Update `Hand.jsx`: Hide hand if spectator
4. Update `SpecialActions.jsx`: Hide if spectator
5. Verify: Load `?room=test` (no `?player=`), see game state but no interaction

### Step 2: Reconnect Banner
1. Update `gameStore.js`: Add reconnect fields and `reconnect()` action
2. Update `useWebSocket.js`: Auto-reconnect on close
3. Create `ReconnectBanner.jsx`
4. Add CSS for banner
5. Integrate into `GameTable.jsx`
6. Test: Stop server, verify banner shows → restart server, verify reconnect works

### Step 3: Game-Over Screen
1. Create `GameOverScreen.jsx`
2. Add CSS for modal
3. Integrate into `GameTable.jsx`
4. Play a complete game to SCORING phase
5. Verify: Results display, "Next Hand" button works

### Step 4: Edge Cases
1. Add AI spinner to `PlayerSlot.jsx` if needed
2. Add helpful messages for late-joiner scenario
3. Test with 6 clients across all edge cases

### Step 5: Polish & Testing
1. Test all UI states:
   - Normal play
   - Spectator view
   - Disconnect/reconnect
   - Game over
   - Multiple disconnects
2. Test mobile responsive layout with edge cases
3. Verify all notifications display correctly
4. Check for visual glitches or layout shifts

---

## Success Criteria

✓ Spectator can join with `?room=X` (no player ID) and observe
✓ Spectator sees game state but cannot interact
✓ Reconnect banner shows on disconnect
✓ Auto-reconnect succeeds within 3 attempts
✓ Manual "Retry now" button works
✓ Game-over screen displays results
✓ "Next Hand" button advances to next game
✓ AI turn indicator shows when appropriate
✓ Late-joiner UI clear and helpful
✓ All edge cases handled gracefully
✓ No console errors in any scenario
✓ Mobile responsive at 375px–1920px for all new UI

---

## Potential Challenges

1. **Spectator API**: Need to verify server supports spectator joins. If not, may need to use a dummy player ID or special flag.
2. **Reconnect Timing**: WebSocket close might fire after a delay; ensure `connected` state is accurate.
3. **Game-Over Message**: Verify server sends `game_over` with all needed fields (farmer_score, etc.)
4. **Late-Joiner**: May miss initial player connection events; handled via `player_connected` events going forward.

---

## Files to Create/Modify

### New Files
- `src/components/ReconnectBanner.jsx`
- `src/components/GameOverScreen.jsx`
- `src/components/AITurnSpinner.jsx` (optional)

### Modified Files
- `src/store/gameStore.js` — add reconnect/spectator fields and actions
- `src/hooks/useWebSocket.js` — auto-reconnect logic
- `src/components/GameTable.jsx` — integrate new components
- `src/components/Hand.jsx` — spectator check
- `src/components/SpecialActions.jsx` — spectator check
- `src/components/PlayerSlot.jsx` — AI spinner (optional)
- `src/App.css` — CSS for new components

---

## Next Steps After Phase 8

Once edge cases and polish are complete:
1. Run full integration test with 6 clients
2. Test all game phases end-to-end
3. Test all disconnection scenarios
4. Verify mobile layout at multiple screen sizes
5. Document any remaining known issues
6. Tag release version and mark "feature complete"
