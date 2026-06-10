import { useEffect } from 'react'
import GameTable from './components/GameTable'
import { useWebSocket } from './hooks/useWebSocket'
import useGameStore from './store/gameStore'
import './App.css'

function App() {
  const roomId = new URLSearchParams(window.location.search).get('room') || 'default'
  const playerId = parseInt(new URLSearchParams(window.location.search).get('player') ?? '-1')

  useWebSocket(roomId, playerId !== -1 ? playerId : null)

  return (
    <div className="app">
      <GameTable />
    </div>
  )
}

export default App
