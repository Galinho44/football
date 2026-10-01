// Testa a PWA ja publicada no ar.
// Roda com: node testar-pwa-online.mjs https://seu-endereco/

const base = (process.argv[2] || 'https://galinho44.github.io/football/').replace(/\/?$/, '/')

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

console.log('\n--- HTTPS E SEGURANCA ---')
teste('endereco e https', base.startsWith('https://'), base)

console.log('\n--- ARQUIVOS NO AR ---')
const rotas = ['index.html', 'manifest.json', 'sw.js', 'icone-192.png', 'icone-512.png', 'background.jpg']

for (const rota of rotas) {
  try {
    const r = await fetch(base + rota, { redirect: 'follow' })
    const tipo = r.headers.get('content-type') || ''
    teste('serve ' + rota, r.status === 200, 'status ' + r.status + ' tipo ' + tipo)
  } catch (e) {
    teste('serve ' + rota, false, String(e.message))
  }
}

console.log('\n--- MANIFEST NO AR ---')
const manifest = await fetch(base + 'manifest.json').then((r) => r.json())
teste('name', !!manifest.name, manifest.name)
teste('short_name', !!manifest.short_name, manifest.short_name)
teste('display standalone', manifest.display === 'standalone', manifest.display)
teste('start_url', !!manifest.start_url, manifest.start_url)

for (const icone of manifest.icons || []) {
  const r = await fetch(base + icone.src.replace(/^\.\//, ''))
  teste('icone ' + icone.sizes + ' (' + icone.purpose + ')', r.status === 200, 'status ' + r.status)
}

// o service worker nao pode vir de outro dominio nem com no-cache errado
console.log('\n--- SERVICE WORKER NO AR ---')
const sw = await fetch(base + 'sw.js')
const swTipo = sw.headers.get('content-type') || ''
teste('sw.js responde 200', sw.status === 200, 'status ' + sw.status)
teste('sw.js com tipo de script', swTipo.includes('javascript'), 'tipo: ' + swTipo)

console.log('\n--- HTML NO AR ---')
const html = await (await fetch(base + 'index.html')).text()
teste('linka manifest relativo', html.includes('href="manifest.json"'))
teste('registra sw.js', html.includes("register('sw.js')"))
teste('aponta background.jpg', html.includes("url('background.jpg')"))
teste('nao depende de CDN', !/https?:\/\/(?!github\.io)/i.test(html.replace(/<!--[\s\S]*?-->/g, '')))

console.log('\nresultado: ' + passou + ' passaram, ' + falhou + ' falharam\n')
console.log('app: ' + base)
process.exit(falhou > 0 ? 1 : 0)