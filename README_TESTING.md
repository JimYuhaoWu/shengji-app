# Shengji Project — Integration Testing Guide

**Status**: 🟢 **PHASE 8 COMPLETE — READY FOR TESTING**

---

## 📋 Quick Navigation

All documentation is organized by component:

### 🎮 Testing & Verification
- **[TEST_SUMMARY.md](TEST_SUMMARY.md)** — Executive summary (this is the starting point)
- **[QUICK_TEST.md](QUICK_TEST.md)** — 5-minute quick start guide
- **[TEST_PLAN.md](TEST_PLAN.md)** — Comprehensive test scenarios (8 detailed scenarios)

### 📂 Project Structure
```
D:\shengji\
├── shengji-server/          # Game logic & WebSocket server (Python)
├── shengji-app/             # React web UI (JavaScript/Vite)
├── shengji-engine/          # Card game engine library
├── shengji-ai/              # AI player implementation
│
├── TEST_SUMMARY.md          ← START HERE for overview
├── QUICK_TEST.md            ← Start here for quick 5-min test
├── TEST_PLAN.md             ← Detailed test scenarios
└── README_TESTING.md        ← This file
```

### 📖 App Documentation
In `shengji-app/`:
- **README.md** — Setup instructions and project overview
- **CLAUDE.md** — Protocol specifications, architecture, coding standards
- **PHASE_7_COMPLETE.md** — Mobile responsive design documentation
- **PHASE_8_COMPLETE.md** — Edge cases, spectator mode, reconnection
- **PHASE_8_PLAN.md** — Implementation specifications
- **PHASE_7_PLAN.md** — Styling specifications

---

## 🚀 Start Testing Now

### 1. Read This First
**[TEST_SUMMARY.md](TEST_SUMMARY.md)** (2 minutes)
- Overview of what's been built
- Success criteria
- Files modified

### 2. Run the Quick Test
**[QUICK_TEST.md](QUICK_TEST.md)** (10 minutes)
- Setup: Start servers
- Open test URLs
- Watch game flow
- Verify all features work

### 3. Run Detailed Tests (if needed)
**[TEST_PLAN.md](TEST_PLAN.md)** (30-60 minutes)
- 8 comprehensive test scenarios
- Edge cases and troubleshooting
- Complete verification checklist

---

## 🎯 What's Been Built (Phase 8)

### Core Features ✅
- Complete game flow (6 phases)
- Real-time WebSocket sync across 6 players
- Hexagon table layout with live indicators
- Card play with animations
- Trophy display and scoring
- Game-over results modal

### Phase 7: Responsive Design ✅
- Desktop (1920px): Original layout
- Tablet (640–1024px): Scaled hexagon
- Mobile (< 640px): 2-column grid
- Ultra-small (< 380px): Compact layout
- Felt texture on playing area

### Phase 8: Edge Cases ✅
- Spectator mode (join without player ID)
- Auto-reconnection (2-sec retry, 5 attempts max)
- Manual retry button
- Game-over screen with results
- Late-joiner info banner
- Safe data access with null checks

---

## 📊 Test Room Info

**Room ID**: `438db7f5` (pre-created for testing)

**Quick URLs**:
```
Player 0: http://localhost:5173/?room=438db7f5&player=0
Player 1: http://localhost:5173/?room=438db7f5&player=1
Player 2: http://localhost:5173/?room=438db7f5&player=2
Player 3: http://localhost:5173/?room=438db7f5&player=3
Player 4: http://localhost:5173/?room=438db7f5&player=4
Player 5: http://localhost:5173/?room=438db7f5&player=5
Spectator: http://localhost:5173/?room=438db7f5
```

To create a new room:
```bash
curl -X POST http://localhost:8000/rooms \
  -H "Content-Type: application/json" \
  -d '{"num_players": 6}'
```

---

## ⚙️ Server Setup

**Terminal 1 - Game Server**:
```bash
cd D:\shengji\shengji-server
python -m uvicorn main:app --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
```

**Terminal 2 - Web App**:
```bash
cd D:\shengji\shengji-app
npm run dev
```

You should see:
```
VITE v8.0.16 ready in XXXms
Local: http://localhost:5173/
```

Both terminals must be running for testing. Keep them open.

---

## ✅ Success Criteria

The project is **successfully tested** when:

1. ✅ All 6 players can connect to same room
2. ✅ Game flows: DEALING → TRUMP → KITTY → CALL → TRICK → SCORING
3. ✅ Cards animate and play correctly
4. ✅ Game-over shows correct winner and scores
5. ✅ Spectator can observe (no interaction)
6. ✅ Reconnect works (auto and manual)
7. ✅ Mobile layout works at 375px–1920px
8. ✅ No console errors
9. ✅ Felt texture visible
10. ✅ All touch targets ≥44px on mobile

---

## 📚 Documentation Map

### For Developers
- **CLAUDE.md** — Protocol, coding standards, architecture
- **PHASE_8_COMPLETE.md** — Implementation details, decisions, known issues
- **PHASE_7_COMPLETE.md** — Responsive design specs, breakpoints
- **PHASE_8_PLAN.md** — Implementation plan for Phase 8 features

### For Testers
- **TEST_SUMMARY.md** — Executive overview
- **QUICK_TEST.md** — Quick 5-minute validation
- **TEST_PLAN.md** — 8 detailed scenarios with 100+ test cases
- **README_TESTING.md** — This file

### For Users
- **README.md** — Setup, running, usage instructions
- **QUICK_TEST.md** — How to join and play

---

## 🔧 Troubleshooting

### Server Not Responding
```bash
# Check if server is running:
ps aux | grep uvicorn

# Kill if stuck:
pkill -f uvicorn

# Restart:
cd D:\shengji\shengji-server && python -m uvicorn main:app --port 8000
```

### App Won't Connect
```bash
# Clear browser cache:
Ctrl+Shift+Delete → Clear all → Refresh (Ctrl+R)

# Check console errors:
F12 → Console tab → Look for red errors

# Create new room if needed:
curl -X POST http://localhost:8000/rooms \
  -H "Content-Type: application/json" \
  -d '{"num_players": 6}'
```

### WebSocket 403 Error
- Room doesn't exist
- Create a new room (see above)
- Use returned room_id in URL

### Mobile Layout Broken
- Clear cache (Ctrl+Shift+Delete)
- Close and reopen tab
- Check device width in DevTools (should be 390px or 375px exactly)

---

## 📈 Testing Progression

```
5 min:  Read TEST_SUMMARY.md
5 min:  Start servers
5 min:  Open test URLs, watch game flow
10 min: Verify all phases work
5 min:  Test mobile (F12 → Ctrl+Shift+M → iPhone 12)
5 min:  Test spectator mode
5 min:  Test reconnection (stop/restart server)
---
40 min: Total quick test

+ Optional:
60 min: Run detailed TEST_PLAN.md scenarios (if issues found)
```

---

## 🎉 Current Status

**Build**: 🟢 **COMPLETE**
- All 8 phases implemented
- 4 new components added (ReconnectBanner, GameOverScreen, etc.)
- 250+ lines CSS for responsive design
- Full protocol compatibility with server

**Documentation**: 🟢 **COMPLETE**
- 3 test documents (summary, quick, detailed)
- 4 phase completion reports
- Full architecture documentation

**Ready**: 🟢 **YES**
- Servers running
- Test room created
- All features implemented
- All documentation written

**Next Step**: Begin testing using [TEST_SUMMARY.md](TEST_SUMMARY.md)

---

## 🚀 Ready to Test!

Start with **[TEST_SUMMARY.md](TEST_SUMMARY.md)** for a 2-minute overview, then move to **[QUICK_TEST.md](QUICK_TEST.md)** to validate everything works in 10 minutes.

If you find any issues, **[TEST_PLAN.md](TEST_PLAN.md)** has detailed scenarios and troubleshooting steps.

**Let's play! 🎮**
