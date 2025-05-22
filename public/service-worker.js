// Service Worker para manejar notificaciones push

self.addEventListener('install', (event) => {
  console.log('Service Worker instalado');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activado');
  return self.clients.claim();
});

// Manejar notificaciones push
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    
    const options = {
      body: data.message,
      icon: '/notification-icon.png',
      badge: '/notification-badge.png',
      data: {
        notificationId: data.id,
        url: data.url || '/',
      },
      actions: data.actions || [],
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  } catch (error) {
    console.error('Error al procesar notificación push:', error);
  }
});

// Manejar clics en notificaciones
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const notificationData = event.notification.data;
  const url = notificationData.url || '/';
  const notificationId = notificationData.notificationId;

  // Enviar mensaje a la aplicación sobre el clic en la notificación
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      // Si ya hay una ventana abierta, enfócala y envía un mensaje
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            notification: {
              id: notificationId,
              url: url
            }
          });
          return;
        }
      }
      
      // Si no hay ventanas abiertas, abre una nueva
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});

// Manejar cierre de notificaciones
self.addEventListener('notificationclose', (event) => {
  const notificationId = event.notification.data.notificationId;
  console.log('Notificación cerrada:', notificationId);
});

