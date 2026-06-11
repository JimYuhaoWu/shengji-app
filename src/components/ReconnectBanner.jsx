import useGameStore from '../store/gameStore'

export default function ReconnectBanner() {
  const { connected, lastError, reconnectAttempts, maxReconnectAttempts } = useGameStore()

  if (connected) return null

  const isMaxed = reconnectAttempts >= maxReconnectAttempts

  // Recovery is a full page reload, which re-runs the single useWebSocket owner.
  // We deliberately do NOT call the store's reconnect(), which opened a second,
  // parallel socket on a self-perpetuating timer and fought useWebSocket for the
  // seat (causing 403 "already connected" storms).
  const retry = () => window.location.reload()

  return (
    <div className="reconnect-banner">
      <div className="reconnect-content">
        <div className="reconnect-icon">⚠️</div>
        <div className="reconnect-text">
          {isMaxed ? (
            <>
              <div className="reconnect-title">Connection failed</div>
              <div className="reconnect-message">
                Unable to reconnect after {maxReconnectAttempts} attempts. Please refresh the page.
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
        <button className="reconnect-button" onClick={retry}>
          {isMaxed ? 'Refresh page' : 'Retry now'}
        </button>
      </div>
    </div>
  )
}
