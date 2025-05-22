// Service Worker para el sistema de notificaciones
const CACHE_NAME = 'lacuenteria-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/static/js/main.chunk.js',
  '/static/js/0.chunk.js',
  '/static/js/bundle.js',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png',
  '/notification-icon.png'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache abierto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Interceptar solicitudes de red
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

// Gestión de notificaciones push
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = {
        title: 'Nueva notificación',
        message: event.data.text(),
      };
    }
  }

  const options = {
    body: data.message || 'Tienes una nueva notificación',
    icon: '/notification-icon.png',
    badge: '/notification-badge.png',
    data: data.data || {},
    vibrate: [100, 50, 100],
    actions: data.actions || []
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Lacuentería', options)
  );
});

// Gestión de clics en notificaciones
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Gestionar acciones de notificación
  if (event.action) {
    // Procesar acción específica
    console.log('Acción de notificación:', event.action);
  } else {
    // Comportamiento predeterminado al hacer clic en la notificación
    const urlToOpen = new URL(
      event.notification.data.url || '/',
      self.location.origin
    ).href;

    const promiseChain = clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    })
    .then((windowClients) => {
      // Verificar si ya hay una ventana abierta con la URL
      let matchingClient = null;
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen) {
          matchingClient = client;
          break;
        }
      }

      // Si hay una ventana abierta, enfocarla
      if (matchingClient) {
        return matchingClient.focus();
      }
      
      // Si no hay una ventana abierta, abrir una nueva
      return clients.openWindow(urlToOpen);
    });

    event.waitUntil(promiseChain);

    // Enviar mensaje a la aplicación sobre el clic en la notificación
    const messageClients = clients.matchAll({
      includeUncontrolled: true,
      type: 'window',
    }).then((clientList) => {
      clientList.forEach((client) => {
        client.postMessage({
          type: 'NOTIFICATION_CLICKED',
          notification: event.notification.data
        });
      });
    });

    event.waitUntil(messageClients);
  }
});

// Gestión de cierre de notificaciones
self.addEventListener('notificationclose', (event) => {
  console.log('Notificación cerrada', event.notification);
});

// Sincronización en segundo plano
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-notifications') {
    event.waitUntil(syncNotifications());
  }
});

// Función para sincronizar notificaciones en segundo plano
async function syncNotifications() {
  // Implementar lógica para sincronizar notificaciones cuando el usuario vuelve a estar en línea
  console.log('Sincronizando notificaciones...');
  
  // Aquí iría la lógica para obtener notificaciones pendientes del IndexedDB
  // y enviarlas al servidor cuando el usuario vuelve a estar en línea
}

// Gestión de mensajes desde la aplicación
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

