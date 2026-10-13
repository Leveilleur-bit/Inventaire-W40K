import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // Grave l'heure exacte du build dans le bundle JS lui-même — remplace
  // document.lastModified (peu fiable) comme indicateur fiable de fraîcheur du déploiement.
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString())
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Fichiers de public/ à embarquer. Le manifest est GÉNÉRÉ à partir de ce fichier :
      // ne pas garder de manifest.json / manifest.webmanifest dans public/ (ils le remplaceraient).
      includeAssets: ['icon-192.png', 'icon-512.png', 'icon-maskable-192.png', 'icon-maskable-512.png', 'apple-touch-icon.png', 'favicon-48.png'],
      manifest: {
        name: 'Reliquaire — Codex Warhammer 40K',
        short_name: 'Reliquaire',
        description: 'Ton codex personnel Warhammer 40,000 : inventaire, peinture, armées.',
        lang: 'fr',
        theme_color: '#020202',       // barre d'état : noire, comme l'app
        background_color: '#020202',  // fond de l'écran de lancement Android, derrière l'icône
        display: 'standalone',
        start_url: './',
        scope: './',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          // Versions « adaptatives » : Android les découpe (cercle, goutte…) sans rogner l'emblème,
          // et c'est elles qu'il affiche sur l'écran de lancement.
          { src: 'icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ],
        shortcuts: [
          {
            name: 'Ajouter une figurine',
            short_name: 'Ajouter',
            description: 'Ouvrir le registre des reliques',
            url: './?view=inventory',
            icons: [{ src: 'icon-192.png', sizes: '192x192' }]
          },
          {
            name: 'Pile of Shame',
            short_name: 'Shame',
            description: 'Voir les figurines à peindre',
            url: './?view=shame',
            icons: [{ src: 'icon-192.png', sizes: '192x192' }]
          },
          {
            name: 'Croisade',
            short_name: 'Croisade',
            description: 'Mes armées peintes',
            url: './?view=lists',
            icons: [{ src: 'icon-192.png', sizes: '192x192' }]
          }
        ]
      },
      workbox: {
        // Code, styles et icônes : disponibles hors ligne dès l'installation
        // + l'image d'ouverture : affichée dès le démarrage, elle doit être disponible immédiatement (et hors ligne)
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}', 'fonds/ouverture.jpg'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            // Fonds d'écran et illustrations du Tarot : affichés tout de suite depuis le téléphone,
            // et remis à jour en arrière-plan. (Avant, « CacheFirst » gardait l'ancienne image
            // jusqu'à 90 jours quand on la remplaçait sous le même nom.)
            urlPattern: ({ url }) => url.pathname.includes('/fonds/') || url.pathname.includes('/tarot/'),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'fonds-cache-v2',   // nouveau nom : abandonne d'un coup les anciennes images en cache
              expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 90 }
            }
          },
          {
            // Musiques et sons : mis en cache à la première écoute (trop lourds pour tout précharger)
            urlPattern: ({ url }) => url.pathname.includes('/sons/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'sons-cache',
              rangeRequests: true,
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 90 },
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ]
      }
    })
  ],
  base: './',
  build: { outDir: 'dist' }
});
