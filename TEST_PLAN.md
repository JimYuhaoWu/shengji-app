# Shengji-App Integration Test Plan

## Test Environment

- **Server**: http://localhost:8000 (running on port 8000)
- **App**: http://localhost:5173 (Vite dev server on port 5173)
- **Test Room ID**: `438db7f5`

## Quick Start URLs

Open these in separate tabs/windows to test with 6 players:

- **Player 0 (Dealer)**: http://localhost:5173/?room=438db7f5&player=0
- **Player 1**: http://localhost:5173/?room=438db7f5&player=1
- **Player 2**: http://localhost:5173/?room=438db7f5&player=2
- **Player 3**: http://localhost:5173/?room=438db7f5&player=3
- **Player 4**: http://localhost:5173/?room=438db7f5&player=4
- **Player 5**: http://localhost:5173/?room=438db7f5&player=5
- **Spectator**: http://localhost:5173/?room=438db7f5 (no player parameter)

---

## Test Scenarios

### Scenario 1: Complete Game Flow (Main Path)

**Goal**: Play complete game from connection through SCORING phase

**Steps**:

1. **Connection Phase (30 seconds)**
   - [ ] Open all 6 player URLs simultaneously
   - [ ] Verify each shows "✓ Connected" status (green)
   - [ ] Verify status bar shows correct Room ID
   - [ ] Verify each shows "Player: N" (0-5)
   - [ ] Verify connection counter shows "6/6 connected"
   - [ ] Verify all 6 player slots visible with connection indicators (green dots)
   - [ ] Dealer badge visible on Player 0

2. **DEALING Phase (Automatic)**
   - [ ] Game auto-starts when all 6 connected
   - [ ] Status shows "Phase: DEALING"
   - [ ] Trump display shows "No trump yet"
   - [ ] Cards dealt to all players (verify card counts in player slots)

3. **TRUMP_DECLARATION Phase**
   - [ ] Status changes to "Phase: TRUMP_DECLARATION"
   - [ ] One player (player 0) sees "Declare Trump" panel
   - [ ] Panel shows count dropdown (1-2) and suit selector (H/D/C/S)
   - [ ] Panel shows current bid (if bid exists)
   - [ ] "Bid" and "Pass" buttons visible
   - [ ] Player 0 clicks "Bid" with count=1, suit=Hearts
   - [ ] Verify: Trump display updates to show "♥ 1"
   - [ ] Turn passes to next player (all pass)
   - [ ] When all pass: Panel disappears, moves to KITTY phase

4. **KITTY Phase**
   - [ ] Status changes to "Phase: KITTY"
   - [ ] Player 0 (dealer) sees "Bury the Kitty" panel
   - [ ] Player 0's hand shows 32 cards (20 dealt + 8 kitty + 4 buried from previous games, minus 8 kitty = 32)
   - [ ] Panel shows "Select exactly 6 cards from your hand (0/6)"
   - [ ] Player 0 clicks 6 cards in their hand
   - [ ] Selected cards animate upward with gold glow
   - [ ] Counter updates "Bury (0/6)" → "(6/6)" as cards selected
   - [ ] "Bury" button becomes enabled (gold)
   - [ ] Player 0 clicks "Bury" button
   - [ ] Panel disappears, moves to CALL_HELPER phase

5. **CALL_HELPER Phase**
   - [ ] Status changes to "Phase: CALL_HELPER"
   - [ ] Player 0 sees "Call a Helper" panel
   - [ ] Panel shows rank selector (A, K, Q, J, 2-10) and suit selector (H/D/C/S)
   - [ ] Player 0 selects rank "A", suit "Spades"
   - [ ] Player 0 clicks "Call" button
   - [ ] Panel disappears, moves to TRICK_PLAYING phase

6. **TRICK_PLAYING Phase**
   - [ ] Status changes to "Phase: TRICK_PLAYING"
   - [ ] Player 0 shows as current player (pulsing gold border on slot)
   - [ ] Player 0's hand shows remaining cards (26 after burying 6)
   - [ ] Player 0 can click cards: legal ones glow, illegal ones grayed out
   - [ ] Player 0 selects a valid play (first legal action from legalActions)
   - [ ] Selected cards animate upward with gold glow
   - [ ] "Play" button becomes enabled
   - [ ] Player 0 clicks "Play"
   - [ ] Cards appear in center TrickArea
   - [ ] Turn passes to next player
   - [ ] Each player takes turns playing cards
   - [ ] Verify: Cards in TrickArea accumulate (piles per player)
   - [ ] Continue until all hands empty (5 rounds of 6 cards each)

7. **SCORING Phase**
   - [ ] Status changes to "Phase: SCORING"
   - [ ] Game-over modal appears with:
     - [ ] Header shows "🎉 Rebellion Wins!" or "👑 Farmer Wins!"
     - [ ] All 6 scores displayed in 3×2 grid (desktop) or 2×3 (mobile)
     - [ ] Current player's score highlighted with gold background
     - [ ] Buried cards section showing the 6 buried cards
     - [ ] "Next Hand" button (gold)
   - [ ] Click "Next Hand" button
   - [ ] Modal closes, game ends

**Expected Result**: ✅ Complete game flows through all 6 phases correctly

---

### Scenario 2: Spectator Mode

**Goal**: Verify spectators can observe without playing

**Steps**:

1. **Join as Spectator**
   - [ ] Open spectator URL (no `?player` parameter)
   - [ ] Status bar shows "👁️ Spectating" (blue badge)
   - [ ] No "Player: N" shown
   - [ ] All 6 player slots visible
   - [ ] Connection indicator works

2. **During Game**
   - [ ] Can see all players and their card counts
   - [ ] Can see TrickArea with played cards
   - [ ] No hand visible at bottom
   - [ ] No "Play" button or card interaction
   - [ ] Message shows "You are spectating"
   - [ ] Game state updates in real-time

3. **No Interaction**
   - [ ] Attempt to click cards: Nothing happens
   - [ ] No SpecialActions panel visible
   - [ ] Cannot bid, bury, call helper, or play

**Expected Result**: ✅ Spectator sees game but cannot interact

---

### Scenario 3: Reconnection (Auto-Reconnect)

**Goal**: Verify automatic reconnection on server restart

**Steps**:

1. **Establish Connection**
   - [ ] Open Player 0 URL
   - [ ] Verify "✓ Connected" status

2. **Trigger Disconnect**
   - [ ] Stop the server (Ctrl+C on server terminal)
   - [ ] Wait 1 second

3. **Observe Reconnect Banner**
   - [ ] Red banner appears at top: "⚠️ Connection lost"
   - [ ] Shows "Reconnecting... Attempt 1/5"
   - [ ] "Retry now" button visible
   - [ ] Status bar shows "◯ Disconnected"

4. **Monitor Auto-Reconnect**
   - [ ] Wait 2 seconds, attempt counter increments: "Attempt 2/5"
   - [ ] Repeat waiting: "Attempt 3/5", "Attempt 4/5"
   - [ ] Before "Attempt 5/5" is shown...

5. **Server Recovery**
   - [ ] Restart server (run `python -m uvicorn main:app --port 8000` again)
   - [ ] Wait for "Application startup complete" message
   - [ ] Observe: Banner disappears, "✓ Connected" returns
   - [ ] Game state restored correctly

**Expected Result**: ✅ Auto-reconnect succeeds, game continues

---

### Scenario 4: Manual Reconnection (Retry Button)

**Goal**: Verify manual retry button works

**Steps**:

1. **Establish Connection**
   - [ ] Open Player 1 URL
   - [ ] Verify "✓ Connected"

2. **Disconnect Server**
   - [ ] Stop server again
   - [ ] Banner appears: "Connection lost"

3. **Click Retry Button**
   - [ ] Click "Retry now" button
   - [ ] Immediate reconnection attempt (doesn't wait 2 seconds)
   - [ ] Attempt counter may show "Attempt 2/5" or similar
   - [ ] Attempt fails (server still down)

4. **Max Attempts**
   - [ ] Wait, don't click anything
   - [ ] After 5 failed attempts, banner changes:
     - [ ] "⚠️ Connection failed"
     - [ ] "Unable to reconnect after 5 attempts"
     - [ ] "Refresh page" button shown (instead of "Retry now")

5. **Refresh Recovery**
   - [ ] Restart server
   - [ ] Click "Refresh page"
   - [ ] Page reloads, reconnects successfully
   - [ ] Game continues

**Expected Result**: ✅ Manual retry works, refresh button recovers after max attempts

---

### Scenario 5: Late Joiner (Info Banner)

**Goal**: Verify helpful message for late joiners

**Steps**:

1. **Start Game with Fewer Players**
   - [ ] Open only Players 0, 1, 2 (3 players)
   - [ ] Game starts and reaches TRICK_PLAYING phase
   - [ ] Other 3 players are disconnected

2. **Late Joiner Scenario**
   - [ ] Open Player 3 URL (mid-game)
   - [ ] Status shows "Disconnected" (server doesn't auto-add mid-game)
   - OR (if server allows mid-game join)
   - [ ] Info banner appears: "⏳ Waiting for other players... (4/6)"
   - [ ] Banner is informational (light blue)
   - [ ] As others connect: Counter updates (5/6)
   - [ ] At 6/6: Banner disappears

**Expected Result**: ✅ Info banner guides late joiners

---

### Scenario 6: Mobile Responsiveness

**Goal**: Verify app works at mobile sizes (< 640px)

**Steps**:

1. **Open Chrome DevTools**
   - [ ] Press F12
   - [ ] Click Toggle Device Toolbar (Ctrl+Shift+M or mobile icon)

2. **iPhone 12 (390px)**
   - [ ] Select "iPhone 12" device preset
   - [ ] Verify no horizontal scroll
   - [ ] Player grid: 2-column layout (top/center/bottom arrangement)
   - [ ] Cards: Larger (90×135px vs desktop 70×105px)
   - [ ] Status bar: Wrapped vertically
   - [ ] Trump display: Full-width below status
   - [ ] Hand at bottom: Full-width, scrollable
   - [ ] All buttons: Full-width, ≥48px height
   - [ ] TrickArea: Centered, compact
   - [ ] SpecialActions: Full-width, buttons stacked

3. **iPhone SE (375px)**
   - [ ] Select "iPhone SE" device preset
   - [ ] Ultra-compact layout: Cards 80×120px
   - [ ] Player slots: 80px max-width
   - [ ] Still no horizontal scroll
   - [ ] All text readable
   - [ ] Touch targets still ≥44px

4. **iPad (1024px)**
   - [ ] Select "iPad" device preset
   - [ ] Hexagon layout preserved (scaled down 20%)
   - [ ] All proportional sizing
   - [ ] Readable at medium zoom

5. **Rotation Testing**
   - [ ] Rotate iPhone to landscape
   - [ ] Verify layout adjusts appropriately
   - [ ] No horizontal scroll, no overlapping elements

**Expected Result**: ✅ App fully responsive 375px–1920px

---

### Scenario 7: Game-Over Screen (Detailed)

**Goal**: Verify game-over modal displays correctly

**Steps**:

1. **Reach SCORING Phase** (from Scenario 1)
   - [ ] Game ends after all tricks played
   - [ ] Modal overlay appears with semi-transparent background

2. **Header**
   - [ ] If rebellion (farmers) won: Green header "🎉 Rebellion Wins!"
   - [ ] If farmers won (landlord): Gold header "👑 Farmer Wins!"
   - [ ] Header text is large (28px)

3. **Score Grid**
   - [ ] Desktop: 3 columns × 2 rows (6 scores)
   - [ ] Mobile: 2 columns × 3 rows
   - [ ] Each score shows "Player N" and numeric score
   - [ ] Current player's score highlighted with gold background
   - [ ] Scores match game state

4. **Buried Cards Section** (if cards buried)
   - [ ] Shows "Buried Cards" header
   - [ ] Lists all 6 buried cards (e.g., "A♠ K♥ ...")
   - [ ] Cards shown in small gold pills

5. **Next Hand Button**
   - [ ] Gold button spanning full width
   - [ ] Text: "Next Hand"
   - [ ] On click: Sends `{type: 'next_game'}` to server
   - [ ] Notification shows "Ready for next hand"
   - [ ] Modal closes

**Expected Result**: ✅ Game-over screen displays and functions correctly

---

### Scenario 8: Connection Indicators

**Goal**: Verify connection status dots work correctly

**Steps**:

1. **All Connected**
   - [ ] With all 6 players: All player slots show green dots
   - [ ] Status bar shows "6/6 connected"

2. **Some Disconnected**
   - [ ] Stop server
   - [ ] All players' dots turn red
   - [ ] Status bar shows "0/6 connected"

3. **Partial Reconnection**
   - [ ] Restart server
   - [ ] As each player reconnects, their dot turns green
   - [ ] Status bar counter increments

**Expected Result**: ✅ Connection indicators accurate

---

## Smoke Test Checklist

Quick validation before considering complete:

- [ ] **Basic Load**: App loads at localhost:5173 without console errors
- [ ] **Connection**: Status shows "Connected" when server running
- [ ] **Game Start**: 6 players connected, game auto-starts
- [ ] **Card Play**: Can select and play cards during TRICK_PLAYING
- [ ] **Game-Over**: Reaches SCORING, modal appears
- [ ] **Spectator**: Can load without player parameter, cannot interact
- [ ] **Reconnect**: Banner appears on disconnect, disappears on reconnect
- [ ] **Mobile**: App usable at 390px width without horizontal scroll
- [ ] **Felt Texture**: Subtle crosshatch visible on playing area (desktop)
- [ ] **Console**: No JavaScript errors in browser console

---

## Known Test Issues

1. **Room Persistence**: Rooms may expire after inactivity. If test times out, create a new room.
2. **Card Count**: First hand will have all players at card count; buried cards only shown at SCORING.
3. **Spectator URL**: Server must support `/ws/{roomId}/spectator` endpoint. If not, spectator mode will fail to connect.
4. **Timing**: Game flow depends on player actions being timely. If a player doesn't move in 30 seconds, game may stall (AI turn not shown).

---

## Test Results Template

Record results:

```
Test Date: [DATE]
Tester: [NAME]
Server Version: [GIT COMMIT]
App Version: [GIT COMMIT]

Scenario 1: ✅ PASS / ⚠️ PARTIAL / ❌ FAIL
Scenario 2: ✅ PASS / ⚠️ PARTIAL / ❌ FAIL
Scenario 3: ✅ PASS / ⚠️ PARTIAL / ❌ FAIL
Scenario 4: ✅ PASS / ⚠️ PARTIAL / ❌ FAIL
Scenario 5: ✅ PASS / ⚠️ PARTIAL / ❌ FAIL
Scenario 6: ✅ PASS / ⚠️ PARTIAL / ❌ FAIL
Scenario 7: ✅ PASS / ⚠️ PARTIAL / ❌ FAIL
Scenario 8: ✅ PASS / ⚠️ PARTIAL / ❌ FAIL

Issues Found:
- [Issue 1]
- [Issue 2]

Notes:
[Any observations or deviations from expected behavior]
```

---

## Next Steps

1. Run through all scenarios above
2. Document any failures or unexpected behavior
3. If minor UI tweaks needed, implement and re-test
4. If critical issues found, debug and fix
5. Once all scenarios pass: **Mark as production-ready**

---

## Support Files

- `PHASE_8_COMPLETE.md` — Detailed implementation notes
- `PHASE_7_COMPLETE.md` — Responsive design documentation
- `PHASE_7_PLAN.md` — Styling specifications
- `CLAUDE.md` — Protocol and architecture reference
- `README.md` — Setup and running instructions

Good luck! 🚀
