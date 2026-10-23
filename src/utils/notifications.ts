// Web Notification and Haptic Vibration API helper

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return 'denied';
  }
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  return await Notification.requestPermission();
}

export function sendNagNotification(title: string, body: string, uncheckedItems: string[] = []): boolean {
  // Vibration for mobile devices
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate([250, 100, 250, 100, 400]);
    } catch {
      // Ignore vibration error
    }
  }

  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return false;
  }

  try {
    const listSnippet = uncheckedItems.slice(0, 3).join(', ') + (uncheckedItems.length > 3 ? ` +${uncheckedItems.length - 3} more` : '');
    const notification = new Notification(title, {
      body: uncheckedItems.length > 0 ? `${body}\nUnchecked: ${listSnippet}` : body,
      icon: '/favicon.ico',
      tag: 'did-i-lock-it-nag',
      requireInteraction: true,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return true;
  } catch (err) {
    console.warn('Could not fire native notification:', err);
    return false;
  }
}
