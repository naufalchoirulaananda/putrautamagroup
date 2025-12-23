// File: public/sw.js (Service Worker for PWA)
self.addEventListener('push', function(event) {
    const data = event.data ? event.data.json() : {};
    const options = {
      body: data.body || 'Anda memiliki notifikasi baru',
      data: {
        url: data.url || '/',
        notificationId: data.notificationId
      },
      actions: [
        {
          action: 'open',
          title: 'Lihat'
        },
        {
          action: 'close',
          title: 'Tutup'
        }
      ]
    };
  
    event.waitUntil(
      self.registration.showNotification(data.title || 'Notifikasi', options)
    );
  });
  
  self.addEventListener('notificationclick', function(event) {
    event.notification.close();
  
    if (event.action === 'open' || !event.action) {
      const urlToOpen = event.notification.data.url;
      
      event.waitUntil(
        clients.matchAll({ type: 'window' }).then(function(clientList) {
          for (let i = 0; i < clientList.length; i++) {
            const client = clientList[i];
            if (client.url === urlToOpen && 'focus' in client) {
              return client.focus();
            }
          }
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
      );
    }
  });
  