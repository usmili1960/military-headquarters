/**
 * Service Worker for Military Headquarters PWA
 * Handles offline functionality and caching
 * Enhanced version with background sync and push notifications
 */

const CACHE_NAME = 'military-hq-v2.0.0';
const DATA_CACHE_NAME = 'military-hq-data-v2.0.0';
const OFFLINE_URL = '/src/pages/offline.html';

// Assets to cache immediately
const CACHE_URLS = [
  '/',
  '/src/pages/index.html',
  '/src/pages/user-dashboard.html',
  '/src/pages/admin-dashboard.html',
  '/src/pages/admin-login.html',
  '/src/pages/signup.html',
  '/src/pages/pending-approval.html',
  '/src/css/style.css',
  '/src/css/homepage.css',
  '/src/css/user-dashboard.css',
  '/src/css/admin-dashboard.css',
  '/src/css/analytics.css',
  '/src/css/loading.css',
  '/src/css/protection.css',
  '/src/css/pwa-mobile.css',
  '/src/js/homepage.js',
  '/src/js/user-dashboard.js',
  '/src/js/admin-dashboard.js',
  '/src/js/analytics-dashboard.js',
  '/src/js/notifications.js',
  '/src/js/bulk-operations.js',
  '/src/js/export-import.js',
  '/src/js/translations.js',
  '/src/js/loading-utils.js',
  '/src/js/session-timeout.js',
  '/src/js/pwa-installer.js',
  '/src/js/content-protection.js',
  '/src/js/notification-system.js',
  '/manifest.json',
  OFFLINE_URL,
];

// API endpoints to cache with network-first strategy
const API_CACHE_URLS = [
  '/api/health',
  '/api/user/profile',
  '/api/admin/users',
  '/api/admin/stats',
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installing v2.0.0...');
  
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => {
        console.log('📦 Service Worker: Caching app shell');
        return cache.addAll(CACHE_URLS).catch((error) => {
          console.error('❌ Service Worker: Failed to cache some resources', error);
          // Try to cache individually
          return Promise.allSettled(
            CACHE_URLS.map(url => cache.add(url).catch(err => 
              console.log(`Failed to cache ${url}:`, err.message)
            ))
          );
        });
      }),
      caches.open(DATA_CACHE_NAME).then((cache) => {
        console.log('📊 Service Worker: Caching API endpoints');
        return Promise.allSettled(
          API_CACHE_URLS.map(url => 
            fetch(url)
              .then(response => response.ok ? cache.put(url, response.clone()) : Promise.resolve())
              .catch(() => console.log(`Failed to cache API ${url}`))
          )
        );
      })
    ]).then(() => {
      console.log('✅ Service Worker: Installed successfully');
      return self.skipWaiting(); // Activate immediately
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker: Activated');
      return self.clients.claim(); // Take control of all pages immediately
    })
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip POST/PUT/DELETE requests (only cache GET)
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached response if found
      if (cachedResponse) {
        // Update cache in background (stale-while-revalidate strategy)
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse.clone());
            });
          }
        }).catch(() => {
          // Network failed, but we have cache
        });
        
        return cachedResponse;
      }

      // Not in cache, fetch from network
      return fetch(event.request).then((networkResponse) => {
        // Cache successful responses
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        
        return networkResponse;
      }).catch((error) => {
        console.error('❌ Fetch failed:', error);
        
        // Return offline page for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match(OFFLINE_URL);
        }
        
        // Return a generic offline response
        return new Response('Offline - content not available', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({
            'Content-Type': 'text/plain',
          }),
        });
      });
    })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('🔄 Background Sync:', event.tag);
  
  if (event.tag === 'sync-notifications') {
    event.waitUntil(syncNotifications());
  }
  
  if (event.tag === 'sync-user-data') {
    event.waitUntil(syncUserData());
  }
});

// Push notification handler
self.addEventListener('push', (event) => {
  console.log('🔔 Push notification received');
  
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Military Headquarters';
  const options = {
    body: data.message || 'You have a new notification',
    icon: '/assets/icon-192x192.png',
    badge: '/assets/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: data,
    actions: [
      { action: 'view', title: 'View', icon: '/assets/checkmark.png' },
      { action: 'close', title: 'Close', icon: '/assets/cross.png' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event.action);
  
  event.notification.close();

  if (event.action === 'view') {
    // Open the app or focus existing window
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    );
  } else if (event.action === 'dismiss') {
    // Handle dismiss action
    console.log('Notification dismissed');
  } else {
    // Default action - open app
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
        // Try to focus existing window
        for (const client of clientList) {
          if (client.url.includes(self.location.origin)) {
            return client.focus();
          }
        }
        // Open new window if none exists
        return clients.openWindow('/');
      })
    );
  }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-notifications') {
    event.waitUntil(syncNotifications());
  } else if (event.tag === 'sync-user-data') {
    event.waitUntil(syncUserData());
  } else if (event.tag === 'sync-form-data') {
    event.waitUntil(syncPendingForms());
  }
});

// Push notification handler
self.addEventListener('push', (event) => {
  console.log('📨 Push message received');
  
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (error) {
    console.log('Push data parse error:', error);
    data = { title: 'Military HQ', body: 'New notification' };
  }

  const title = data.title || 'Military HQ Notification';
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/src/assets/icon-192x192.png',
    badge: '/src/assets/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: data.url || '/',
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/src/assets/view-icon.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ],
    requireInteraction: true
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  console.log('⏰ Periodic sync triggered:', event.tag);
  
  if (event.tag === 'sync-data') {
    event.waitUntil(periodicDataSync());
  }
});

// Enhanced helper functions
async function syncNotifications() {
  try {
    console.log('🔔 Syncing notifications...');
    const cache = await caches.open(DATA_CACHE_NAME);
    const response = await fetch('/api/notifications');
    
    if (response.ok) {
      cache.put('/api/notifications', response.clone());
    }
    
    return response;
  } catch (error) {
    console.error('Failed to sync notifications:', error);
    throw error;
  }
}

async function syncUserData() {
  try {
    console.log('👤 Syncing user data...');
    const cache = await caches.open(DATA_CACHE_NAME);
    const response = await fetch('/api/user/profile');
    
    if (response.ok) {
      cache.put('/api/user/profile', response.clone());
    }
    
    return response;
  } catch (error) {
    console.error('Failed to sync user data:', error);
    throw error;
  }
}

async function syncPendingForms() {
  try {
    console.log('📝 Syncing pending forms...');
    
    // Get pending forms from IndexedDB or localStorage
    const pendingForms = JSON.parse(localStorage.getItem('pendingForms') || '[]');
    
    for (const form of pendingForms) {
      try {
        const response = await fetch(form.endpoint, {
          method: form.method || 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...form.headers
          },
          body: JSON.stringify(form.data)
        });
        
        if (response.ok) {
          // Remove successfully synced form
          const updatedForms = pendingForms.filter(f => f.id !== form.id);
          localStorage.setItem('pendingForms', JSON.stringify(updatedForms));
          
          // Show success notification
          self.registration.showNotification('Form Submitted', {
            body: `Your ${form.type} has been submitted successfully`,
            icon: '/src/assets/icon-192x192.png',
            tag: 'form-sync-success'
          });
        }
      } catch (error) {
        console.error(`Failed to sync form ${form.id}:`, error);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Failed to sync pending forms:', error);
    throw error;
  }
}

async function periodicDataSync() {
  try {
    console.log('⏰ Performing periodic data sync...');
    
    await Promise.all([
      syncNotifications(),
      syncUserData()
    ]);
    
    console.log('✅ Periodic sync completed');
    return true;
  } catch (error) {
    console.error('Periodic sync failed:', error);
    throw error;
  }
}

// Message handler for communication with main thread
self.addEventListener('message', (event) => {
  console.log('📨 Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  } else if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME).then(() => {
      event.ports[0].postMessage({ success: true });
    });
  }
});

console.log('✅ Service Worker v2.0.0 loaded with enhanced features');
