// Service worker: guarda os arquivos do app em cache pra funcionar offline.
//
// Sem isso, a PWA abre só quando tem internet. Com isso, o celular abre o app
// no vestiário sem sinal e tudo funciona, porque nada aqui depende de rede.

const CACHE = 'sortear-times-v2'

// arquivos que fazem o app funcionar. se um deles mudar, troque a versao acima
const ARQUIVOS = [
  './',
  './index.html',
  './manifest.json',
  './icone-192.png',
  './icone-512.png',
  './background.jpg',
]

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(CACHE).then((cache) => {
      // addAll falha inteiro se um arquivo faltar. background.jpg e opcional,
      // entao cada um e adicionado sozinho, sem derrubar os outros
      return Promise.all(
        ARQUIVOS.map((arquivo) =>
          cache.add(arquivo).catch(() => {
            // arquivo opcional que nao existe: segue o jogo
          })
        )
      )
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (evento) => {
  // apaga cache de versoes antigas quando subir uma versao nova
  evento.waitUntil(
    caches.keys().then((nomes) =>
      Promise.all(
        nomes.filter((n) => n !== CACHE).map((n) => caches.delete(n))
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (evento) => {
  const req = evento.request

  // so mexe em GET do proprio site. ignorar o resto evita problema com CORS
  if (req.method !== 'GET') return
  if (!req.url.startsWith(self.location.origin)) return

  evento.respondWith(
    caches.match(req).then((emCache) => {
      if (emCache) return emCache

      return fetch(req)
        .then((resposta) => {
          // guarda uma copia do que baixou pra proxima vez
          if (resposta && resposta.status === 200 && resposta.type === 'basic') {
            const copia = resposta.clone()
            caches.open(CACHE).then((cache) => cache.put(req, copia))
          }
          return resposta
        })
        .catch(() => {
          // offline e sem cache: se pediram a pagina, entrega o index
          if (req.mode === 'navigate') return caches.match('./index.html')
        })
    })
  )
})