// File: lib/pwa-notification.ts
export async function sendPushNotification(
    userId: number,
    title: string,
    body: string,
    url: string
  ) {
    try {
      // This would typically send to a push notification service
      // For now, we'll just show browser notification if permission is granted
      if ("Notification" in window && Notification.permission === "granted") {
        const notification = new Notification(title, {
          body,
          data: { url },
        });
  
        notification.onclick = function() {
          window.focus();
          window.location.href = url;
          notification.close();
        };
  
        setTimeout(() => notification.close(), 10000); // Auto close after 10s
      }
    } catch (error) {
      console.error("Error sending push notification:", error);
    }
  }