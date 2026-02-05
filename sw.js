self.addEventListener('install', event => {
    console.log('Service worker installing...');
});

self.addEventListener('activate', event => {
    console.log('Service worker activating...');
});

self.addEventListener('fetch', event => {
    // For now, just fetch from network
    event.respondWith(fetch(event.request));
});