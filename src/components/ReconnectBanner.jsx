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
