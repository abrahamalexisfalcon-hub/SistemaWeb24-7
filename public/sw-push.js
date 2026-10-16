// ============================================================================
// 24/7 Asistencias - Web Push Service Worker
// Manejo de eventos push en segundo plano y clic en notificaciones del SO
// ============================================================================

// Evento que despierta el SO cuando llega un push con pantalla apagada o app cerrada
self.addEventListener('push', function (event) {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: '24/7 Asistencias', body: event.data.text() };
    }
  } else {
    data = {
      title: '¡Nueva Orden Asignada!',
      body: 'Tienes una nueva orden de servicio lista para atender.'
    };
  }

  const title = data.title || 'Nueva Orden Asignada';
  const options = {
    body: data.body || 'Tienes un nuevo servicio pendiente de atención.',
    icon: '/logo-192.png',
    badge: '/logo-192.png',
    vibrate: [200, 100, 200, 100, 400], // Patrón de vibración táctil
    tag: data.tag || 'orden-servicio',
    renotify: true,
    requireInteraction: true, // Se mantiene visible hasta que el usuario interactúe
    data: {
      url: data.url || '/tecnico/ordenes'
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Evento al pulsar la notificación en la barra de estado del teléfono
self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/tecnico/ordenes';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (windowClients) {
      // Si la app ya está abierta, enfocarla y navegar
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if ('focus' in client) {
          if ('navigate' in client) {
            client.navigate(urlToOpen);
          }
          return client.focus();
        }
      }
      // Si estaba cerrada, abrirla en la URL correspondiente
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
