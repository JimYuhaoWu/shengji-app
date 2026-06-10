# Phase 7: Mobile & Styling — Implementation Plan

## Goal
Transform the desktop hexagon layout into a mobile-first responsive interface with touch-friendly targets, felt texture, and optimal UX across all screen sizes.

## Responsive Strategy

### Breakpoints
- **Mobile** (< 640px) — primary target: iPhone SE to 14 Pro
- **Tablet** (640px–1024px) — iPad, landscape phones
- **Desktop** (> 1024px) — current hexagon layout

### Key Changes by Breakpoint

#### Mobile (< 640px)

**Layout transformation:**
- Hexagon table → compact vertical list
- Player slots: 3 on left (0, 5, 4), 3 on right (1, 2, 3), centered
- TrickArea: stays centered, compact
- Hand: full-width horizontal scrolling, larger cards for touch
- Status bar: condensed, single line or wrapped
- SpecialActions: full-width modal overlay

**Component-level changes:**

1. **GameTable.jsx**
   - Media query switches from `hexagon-table` layout to `mobile-player-grid`
   - Status bar: stack flex items vertically on small screens
   - Remove hexagon positioning; use CSS grid or flexbox
   - Hand at bottom uses 100% width, no fixed height

2. **PlayerSlot.jsx**
   - Card size: 40px (was 70px)
   - Font: smaller (10px instead of 13px)
   - Badges: 16px (was 24px)
   - Card fan: compact 25px height (was 40px)
   - Text positioning: vertical stack
   - Touch target: ensure 44px minimum hit area

3. **Hand.jsx**
   - Card size: 90px × 135px (was 70px × 105px) — larger for touch
   - Gap between cards: 12px (was 8px)
   - Hand container: 200px height (was 150px)
   - Scrollbar: hide on mobile (less relevant)
   - Button sizing: 16px font, 12px padding (larger touch targets)
   - Text: "Play (N)" button → full width on mobile

4. **TrickArea.jsx**
   - Max-width: 280px (was 300px)
   - Cards smaller: 60px × 90px
   - Gap: 16px (was 20px)
   - Padding: 12px (was 16px)

5. **SpecialActions.jsx**
   - Full-width overlay on mobile
   - Modal backdrop: fade effect
   - Controls: stack vertically
   - Input fields: full width
   - Buttons: 48px minimum height for touch

6. **CardComponent.jsx**
   - SVG upscaling: smooth on mobile
   - Hover effects: disabled on touch (use `:active` instead)
   - Selection animation: translateY(-20px) on mobile (more visible)

**Typography:**
- Status bar: 11px (was 13px)
- Phase: 12px (was 13px)
- Card count: 10px (was 11px)
- Player name: 12px (was 13px)

#### Tablet (640px–1024px)

- Hexagon layout: scale down 20%
- Player slots: 100px (was 120px)
- Cards: 65px × 97px
- Hand height: 140px
- SpecialActions: sidebar or modal (context-dependent)

#### Desktop (> 1024px)

- Hexagon layout: unchanged
- Current sizing applies

---

## Styling Enhancements

### 1. Felt Texture (Playing Area)

Add subtle fabric texture to `.table-layout` background:

```css
.table-layout {
  background: 
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent 2px,
      rgba(0, 0, 0, 0.02) 2px,
      rgba(0, 0, 0, 0.02) 4px
    ),
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(0, 0, 0, 0.02) 2px,
      rgba(0, 0, 0, 0.02) 4px
    ),
    linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
}
```

This creates a subtle crosshatch pattern. Pair with:
```css
.trick-area {
  background: rgba(0, 0, 0, 0.5);  /* deeper shadow on felt */
  border: 2px solid rgba(200, 149, 74, 0.4);
}
```

### 2. Touch-Friendly Hit Areas

Ensure all interactive elements are ≥ 44px × 44px on mobile:

```css
@media (max-width: 640px) {
  .card {
    min-width: 90px;
    min-height: 135px;
  }
  
  .submit-btn, .clear-btn {
    padding: 12px 20px;
    min-height: 48px;
    font-size: 14px;
  }
  
  select, input {
    padding: 10px 12px;
    min-height: 44px;
    font-size: 16px;  /* prevents iOS zoom on input focus */
  }
}
```

### 3. Prevent Zoom on iOS Input Focus

```css
@media (max-width: 640px) {
  input, select, textarea {
    font-size: 16px;  /* iOS zooms if < 16px */
  }
}
```

### 4. Smooth Scrolling & Momentum Scrolling

```css
.hand {
  -webkit-overflow-scrolling: touch;  /* iOS momentum scrolling */
  scroll-behavior: smooth;
}
```

### 5. Card Selection Animation (Mobile-Optimized)

```css
@media (max-width: 640px) {
  .card.selected {
    transform: translateY(-20px) scale(1.05);
    box-shadow: 0 0 20px rgba(200, 149, 74, 0.8), 0 12px 20px rgba(0, 0, 0, 0.5);
  }
}
```

---

## Layout Changes in Detail

### Mobile Player Grid (< 640px)

Instead of hexagon positioning, use a 2-column grid:

```css
@media (max-width: 640px) {
  .hexagon-table {
    width: 100%;
    height: auto;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    padding: 20px;
    max-width: 100%;
  }
  
  /* Position all players in grid; hexagon positioning overridden */
  .player-0 { position: relative; top: auto; left: auto; right: auto; bottom: auto; transform: none; grid-column: 1 / -1; justify-self: center; }
  .player-1 { position: relative; top: auto; left: auto; right: auto; bottom: auto; transform: none; }
  .player-2 { position: relative; top: auto; left: auto; right: auto; bottom: auto; transform: none; }
  .player-3 { position: relative; top: auto; left: auto; right: auto; bottom: auto; transform: none; grid-column: 1 / -1; justify-self: center; }
  .player-4 { position: relative; top: auto; left: auto; right: auto; bottom: auto; transform: none; }
  .player-5 { position: relative; top: auto; left: auto; right: auto; bottom: auto; transform: none; }
}
```

Arrangement on screen:
```
     [0 — Dealer]
[5] [1]     [1] [2]
[4] [3]     [4] [3]
   [3 — You]
```

### Status Bar (Mobile)

```css
@media (max-width: 640px) {
  .status-bar {
    flex-wrap: wrap;
    gap: 12px;
    padding: 12px 16px;
    font-size: 11px;
  }
  
  .connection-status {
    flex: 1 1 100%;  /* full width */
    justify-content: center;
  }
  
  .room-info,
  .player-info,
  .phase {
    font-size: 10px;
    flex: 0 1 auto;
  }
  
  .trump-container {
    margin-left: 0;
    flex: 1 1 100%;
  }
}
```

### Hand (Mobile)

```css
@media (max-width: 640px) {
  .hand-container {
    max-height: 200px;
    padding: 12px 16px;
  }
  
  .hand {
    gap: 12px;
    overflow-x: auto;
    overflow-y: hidden;
  }
  
  .hand-actions {
    gap: 8px;
    flex-direction: column;
  }
  
  .submit-btn, .clear-btn {
    flex: 1;
    width: 100%;
  }
}
```

---

## Implementation Steps

1. **Add felt texture** to `.table-layout`
   - Verify: subtle crosshatch visible on dark background

2. **Mobile breakpoint media queries** (< 640px)
   - Add to `App.css` after all existing styles
   - Override hexagon positioning with grid layout
   - Adjust player slot sizing: 100px → 80px
   - Adjust card sizes: 70×105 → 90×135 in hand

3. **Status bar responsiveness**
   - Wrap on small screens
   - Center connection status
   - Move trump to full width

4. **Hand container mobile optimization**
   - Larger cards (90×135)
   - Full-width buttons
   - Vertical button stack

5. **Touch-friendly improvements**
   - Ensure ≥44px hit areas for all buttons/cards
   - Add `-webkit-overflow-scrolling: touch`
   - Use `:active` states in addition to `:hover`

6. **SpecialActions modal on mobile**
   - Add semi-transparent backdrop
   - Center modal on screen
   - Full-width form controls
   - Large buttons (48px height min)

7. **Tablet breakpoint** (640px–1024px)
   - Scale hexagon down 20%
   - Adjust gaps and sizing proportionally

8. **Test across devices**
   - iPhone 12 (390px)
   - iPhone SE (375px)
   - iPad (1024px)
   - Desktop (1920px)

---

## Success Criteria

✓ Mobile layout loads without horizontal scroll at 390px
✓ All interactive elements ≥ 44px on mobile
✓ Hand scrolls smoothly with momentum on iOS
✓ Cards scale cleanly from 70px (desktop) to 90px (mobile)
✓ Player slots readable at 80px on mobile
✓ Felt texture subtle but visible
✓ No layout shift when scrollbars appear/disappear
✓ Status bar wraps gracefully on small screens
✓ SpecialActions modal is usable on all screen sizes
✓ Selection animations smooth at 60fps

---

## Files to Modify

1. `src/App.css` — main styling
   - Add felt texture
   - Add mobile breakpoints (< 640px, 640–1024px)
   - Override hexagon positioning
   - Scale components

2. `src/components/GameTable.jsx` — status bar wrapping
   - Responsive flex layout already in place

3. `src/components/SpecialActions.jsx` (Phase 6)
   - Add modal backdrop on mobile
   - Full-width controls

4. `src/components/Hand.jsx` (Phase 4)
   - Already responsive; verify button sizing

5. `src/components/PlayerSlot.jsx` (Phase 3)
   - Scale badges and text

6. `src/components/CardComponent.jsx` (Phase 4)
   - Smooth SVG scaling, `:active` states

---

## Notes

- **Mobile-first principle**: Start with mobile styles, progressively enhance for larger screens
- **Tablet as bridge**: 640px breakpoint covers iPad Portrait; 1024px for iPad Landscape
- **Touch vs. hover**: CSS media query `(hover: none)` to detect touch devices
- **Safari on iOS**: Test `-webkit-overflow-scrolling: touch`, font-size for inputs, safe area insets
- **Performance**: Felt texture uses two small repeating gradients (minimal overhead)
