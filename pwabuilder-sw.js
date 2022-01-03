const CACHE='pwabuilder-offline-page';

importScripts('https://cdn.jsdelivr.net/npm/workbox-sw');

const offlineFallbackPage='/offline.html';

self.addEventListener('message', (event)=>{
	if((event.data)&&(event.data.type==='SKIP_WAITING')) {
		self.skipWaiting();
	}
});

self.addEventListener('install', async (event)=>{
	event.waitUntil(caches.open(CACHE).then((cache)=>{
		return cache.add(offlineFallbackPage);
	}));
});

if(workbox.navigationPreload.isSupported()) {
	workbox.navigationPreload.enable();
}

workbox.routing.registerRoute(/.*/, new workbox.strategies.StaleWhileRevalidate({
	cacheName: CACHE
}));

self.addEventListener('fetch', (event)=>{
	if(event.request.mode==='navigate') {
		event.respondWith((async ()=>{
			try {
				const preloadResp=await event.preloadResponse;
				if(preloadResp) {
					return preloadResp;
				}
				const networkResp=await fetch(event.request);
				return networkResp;
			} catch(error) {
				const cache=await caches.open(CACHE);
				const cachedResp=await cache.match(offlineFallbackPage);
				return cachedResp;
			}
		})());
	}
});