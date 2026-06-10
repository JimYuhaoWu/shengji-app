import { useState } from 'react'
import useGameStore from '../store/gameStore'
import useNotificationStore from '../store/notificationStore'

const SUITS = [
  { value: 'H', label: '♥ Hearts', color: '#e63946' },
  { value: 'D', label: '♦ Diamonds', color: '#e63946' },
  { value: 'C', label: '♣ Clubs', color: '#000' },
  { value: 'S', label: '♠ Spades', color: '#000' },
]

const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A']

// TRUMP_DECLARATION: bid a trump suit/count, or pass.
function TrumpDeclaration() {
  const { sendMessage, currentTrumpBid } = useGameStore()
  const { addNotification } = useNotificationStore()
  const [count, setCount] = useState(1)
  const [suit, setSuit] = useState('H')

  const bid = () => {
    if (sendMessage({ type: 'bid_trump', count, suit })) {
      addNotification(`Bid ${count}× ${suit}`, 'info', 2000)
    }
  }

  const pass = () => {
    if (sendMessage({ type: 'pass_trump' })) {
      addNotification('Passed', 'info', 2000)
    }
  }

  return (
    <div className="special-actions">
      <div className="special-title">Declare Trump</div>
      {currentTrumpBid && (
        <div className="current-bid">
          Current bid: {currentTrumpBid.count}× {currentTrumpBid.suit} (P{currentTrumpBid.bidder_id})
        </div>
      )}
      <div className="bid-controls">
        <label>
          Count:
          <select value={count} onChange={(e) => setCount(Number(e.target.value))}>
            <option value={1}>1</option>
            <option value={2}>2</option>
          </select>
        </label>
        <label>
          Suit:
          <select value={suit} onChange={(e) => setSuit(e.target.value)}>
            {SUITS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="action-buttons">
        <button className="submit-btn" onClick={bid}>
          Bid
        </button>
        <button className="clear-btn" onClick={pass}>
          Pass
        </button>
      </div>
    </div>
  )
}

// KITTY: dealer buries exactly 6 cards selected from their hand.
function KittyBury() {
  const { selectedCards, sendMessage, clearSelection } = useGameStore()
  const { addNotification } = useNotificationStore()

  const ready = selectedCards.length === 6

  const bury = () => {
    if (!ready) return
    const cards = selectedCards.map((c) => ({
      suit: c.suit,
      rank: c.rank,
      deck_id: c.deck_id ?? 0,
    }))
    if (sendMessage({ type: 'take_kitty', cards })) {
      addNotification('Buried 6 cards', 'success', 2000)
      clearSelection()
    }
  }

  return (
    <div className="special-actions">
      <div className="special-title">Bury the Kitty</div>
      <div className="special-hint">
        Select exactly 6 cards from your hand to bury ({selectedCards.length}/6)
      </div>
      <div className="action-buttons">
        <button
          className={`submit-btn ${ready ? '' : 'disabled'}`}
          onClick={bury}
          disabled={!ready}
        >
          Bury ({selectedCards.length}/6)
        </button>
        <button className="clear-btn" onClick={clearSelection}>
          Clear
        </button>
      </div>
    </div>
  )
}

// CALL_HELPER: dealer names a card (suit + rank) whose holder becomes a helper.
function CallHelper() {
  const { sendMessage } = useGameStore()
  const { addNotification } = useNotificationStore()
  const [suit, setSuit] = useState('H')
  const [rank, setRank] = useState('A')

  const call = () => {
    if (sendMessage({ type: 'call_helper', suit, rank })) {
      addNotification(`Called ${rank}${suit}`, 'info', 2000)
    }
  }

  return (
    <div className="special-actions">
      <div className="special-title">Call a Helper</div>
      <div className="special-hint">Name a card; whoever holds it is your partner.</div>
      <div className="bid-controls">
        <label>
          Rank:
          <select value={rank} onChange={(e) => setRank(e.target.value)}>
            {RANKS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <label>
          Suit:
          <select value={suit} onChange={(e) => setSuit(e.target.value)}>
            {SUITS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="action-buttons">
        <button className="submit-btn" onClick={call}>
          Call
        </button>
      </div>
    </div>
  )
}

// SCORING: anyone can advance to the next hand.
function NextGame() {
  const { sendMessage } = useGameStore()

  return (
    <div className="special-actions">
      <div className="special-title">Hand Over</div>
      <div className="action-buttons">
        <button className="submit-btn" onClick={() => sendMessage({ type: 'next_game' })}>
          Next Hand
        </button>
      </div>
    </div>
  )
}

export default function SpecialActions() {
  const { phase, currentPlayer, myPlayerId, isSpectator } = useGameStore()
  const isYourTurn = currentPlayer === myPlayerId

  // Spectators cannot take actions
  if (isSpectator) return null

  // SCORING is open to everyone; the rest require it to be your turn.
  if (phase === 'SCORING') return <NextGame />
  if (!isYourTurn) return null

  switch (phase) {
    case 'TRUMP_DECLARATION':
      return <TrumpDeclaration />
    case 'KITTY':
      return <KittyBury />
    case 'CALL_HELPER':
      return <CallHelper />
    default:
      return null
  }
}
