import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// NOTE: StrictMode intentionally omitted. In dev it double-invokes effects,
// which made useWebSocket open two sockets to the same seat — the second was
// rejected (403 "Player already connected") and its onclose tore down the live
// one, leaving the client unable to hold a connection. A single mount is correct
// for a stateful WebSocket session.
createRoot(document.getElementById('root')).render(<App />)
