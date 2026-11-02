// Service Worker - Odivelas Barbearia PWA
const CACHE_NAME = 'odivelas-barbearia-v1';

const STATIC_ASSETS = [
  './',
  './index.html',
  './agendamento.html',
  './meus-agendamentos.html',
  './cadastroLogin.html',
  './admin.html',
  './agendamento.js',
  './meus-agendamento.js',
  './cadastroLogin.js',
  './admin.js',
  './supabase-client.js',
  './style.css',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './barbearia (1).png'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Alguns assets não puderam ser armazenados em cache inicial:', err);
      });
    })
  );
  self.skipWaiting();
});

// Ativação e limpeza de caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Interceptação de requisições:
// Requisições para Supabase ou APIs externas sempre vão direto para a rede
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Deixa requisições do Supabase, WhatsApp e CDNs passarem direto
  if (
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('wa.me') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('gstatic.com') ||
    event.request.method !== 'GET'
  ) {
    return;
  }

  // Estratégia Network First com fallback para Cache
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

