// Check if notifications are supported
const areNotificationsSupported = () => {
  return 'Notification' in window;
};

// Request notification permission
const requestPermission = async () => {
  if (!areNotificationsSupported()) {
    throw new Error('Notifications not supported in this browser');
  }

  const permission = await Notification.requestPermission();
  return permission;
};

// Check if we have permission
const checkPermission = () => {
  if (!areNotificationsSupported()) {
    return 'denied';
  }
  return Notification.permission;
};

// Send a notification
const sendNotification = async (title, options = {}) => {
  if (!areNotificationsSupported()) {
    console.warn('Notifications not supported');
    return false;
  }

  if (Notification.permission !== 'granted') {
    console.warn('Notification permission not granted');
    return false;
  }

  try {
    const notification = new Notification(title, {
      body: options.body || '',
      icon: options.icon || '/pwa-192x192.png',
      badge: options.badge || '/pwa-192x192.png',
      tag: options.tag || 'shoppy-notification',
      ...options
    });

    if (options.onClick) {
      notification.onclick = options.onClick;
    }

    return true;
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
};

// Schedule a notification for a specific time
const scheduleNotification = (title, options = {}, timeInMs) => {
  const delay = timeInMs - Date.now();
  
  if (delay <= 0) {
    return sendNotification(title, options);
  }
  
  const timerId = setTimeout(() => {
    sendNotification(title, options);
  }, delay);
  
  return timerId;
};

// Cancel a scheduled notification
const cancelScheduledNotification = (timerId) => {
  clearTimeout(timerId);
};

export default {
  areNotificationsSupported,
  requestPermission,
  checkPermission,
  sendNotification,
  scheduleNotification,
  cancelScheduledNotification
};
