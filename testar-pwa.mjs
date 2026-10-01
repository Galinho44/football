// Testa se a PWA tem tudo no lugar.
// Sobe um servidor local e confere cada arquivo que o app pede.
//
// Roda com: node testar-pwa.mjs

import { createServer } from 'node:http'
import { readFileSync, existsSync } from 'node:fs'
import { extname, join } from 'node:path'

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
}

const servidor = createServer((req, res) => {
  const caminho = req.url === '/' ? '/index.html' : req.url.split('?')[0]
  const arquivo = join(process.cwd(), decodeURIComponent(caminho))

  if (!existsSync(arquivo)) {
    res.writeHead(404)
    res.end('nao achou')
    return
  }
  res.writeHead(200, { 'Content-Type': MIME[extname(arquivo)] || 'application/octet-stream' })
  res.end(readFileSync(arquivo))
})

let passou = 0
let falhou = 0

function teste(nome, condicao, extra) {
  if (condicao) {
    passou++
    console.log('  ok    ' + nome)
  } else {
    falhou++
    console.log('  FALHOU  ' + nome + (extra ? '  -> ' + extra : ''))
  }
}

servidor.listen(0, async () => {
  const base = 'http://localhost:' + servidor.address().port

  console.log('\n--- ARQUIVOS DA PWA ---')

  const precisa = [
    '/index.html',
    '/manifest.json',
    '/sw.js',
    '/icone-192.png',
    '/icone-512.png',
    '/background.jpg',
  ]

  for (const rota of precisa) {
    const r = await fetch(base + rota)
    teste('serve ' + rota, r.status === 200, 'status ' + r.status)
  }

  // arquivo que nao existe tem que dar 404 (garante que o servidor testa de verdade)
  const inexistente = await fetch(base + '/nao-existe.txt')
  teste('404 em arquivo inexistente', inexistente.status === 404, 'status ' + inexistente.status)

  console.log('\n--- MANIFEST ---')
  const manifest = await fetch(base + '/manifest.json').then((r) => r.json())

  teste('tem name', !!manifest.name, manifest.name)
  teste('tem short_name', !!manifest.short_name, manifest.short_name)
  teste('start_url definido', !!manifest.start_url, manifest.start_url)
  teste('display standalone', manifest.display === 'standalone', manifest.display)
  teste('theme_color definido', !!manifest.theme_color, manifest.theme_color)
  teste('background_color definido', !!manifest.background_color, manifest.background_color)
  teste('lang pt-BR', manifest.lang === 'pt-BR', manifest.lang)

  const ic192 = (manifest.icons || []).find((i) => i.sizes === '192x192')
  const ic512 = (manifest.icons || []).find((i) => i.sizes === '512x512')
  const maskable = (manifest.icons || []).find((i) => i.purpose === 'maskable')

  teste('icone 192 no manifest', !!ic192, JSON.stringify(manifest.icons))
  teste('icone 512 no manifest', !!ic512)
  teste('icone maskable', !!maskable)

  // cada icone do manifest tem que existir mesmo
  for (const icone of manifest.icons || []) {
    const r = await fetch(base + '/' + icone.src)
    teste('icone existe: ' + icone.src, r.status === 200, 'status ' + r.status)
  }

  console.log('\n--- HTML ---')
  const html = await fetch(base + '/index.html').then((r) => r.text())

  teste('linka o manifest', html.includes('rel="manifest"'))
  teste('registra o service worker', html.includes("register('sw.js')"))
  teste('tem viewport', html.includes('name="viewport"'))
  teste('tem theme-color', html.includes('name="theme-color"'))
  teste('apple-touch-icon', html.includes('apple-touch-icon'))
  teste('aponta background.jpg', html.includes("url('background.jpg')"))
  teste('nao tem script externo (funciona offline)', !/<script[^>]+src=/i.test(html))
  teste('nao tem css externo (funciona offline)', !/<link[^>]+rel="stylesheet"/i.test(html))

  console.log('\n--- SW.JS ---')
  const sw = await fetch(base + '/sw.js').then((r) => r.text())
  teste('tem evento install', sw.includes("addEventListener('install'"))
  teste('tem evento fetch', sw.includes("addEventListener('fetch'"))
  teste('tem versao de cache', /const CACHE = 'sortear-times-v\d+'/.test(sw))
  teste('cacheia o index', sw.includes('./index.html'))

  console.log('\nresultado: ' + passou + ' passaram, ' + falhou + ' falharam\n')
  servidor.close()
  process.exit(falhou > 0 ? 1 : 0)
})