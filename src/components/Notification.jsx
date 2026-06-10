import useNotificationStore from '../store/notificationStore'

export default function Notification() {
  const { notifications, removeNotification } = useNotificationStore()

  return (
    <div className="notification-container">
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className={`notification notification-${notif.type}`}
          onClick={() => removeNotification(notif.id)}
        >
          <span className="notification-message">{notif.message}</span>
          <button
            className="notification-close"
            onClick={(e) => {
              e.stopPropagation()
              removeNotification(notif.id)
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
