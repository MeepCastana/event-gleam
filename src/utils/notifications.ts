
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
}

export function sendNotification(title: string, options?: NotificationOptions) {
  if (Notification.permission === 'granted') {
    try {
      const notification = new Notification(title, options);
      return notification;
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }
}
