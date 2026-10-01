// Testa o sorteio com a lista REAL que chega do WhatsApp.
// Roda com: node lista-real.test.mjs

const DE_LINHA = 5

const LISTA_REAL = `Lista Aerobaba 30/09/2026
Local: Costa Verde
Bola rolando: 19h

1️⃣- Vieira
2️⃣- RIBA
3️⃣- Matheus M
4️⃣- Matheus T
5️⃣- Joca
6️⃣- Daniel
7️⃣- PH
8️⃣-  Debson
9️⃣ -  Lucas
🔟  -Tiago (O retorno)
1️⃣1️⃣ - Bruno
1️⃣2️⃣ - Márcio
1️⃣3️⃣ -
1️⃣4️⃣-
1️⃣5️⃣-
1️⃣6️⃣ -
1️⃣7️⃣ -
1️⃣8️⃣-
1️⃣9️⃣-
2️⃣0️⃣-
2️⃣1️⃣-
2️⃣2️⃣-
🥅 - Galinho
🥅 - Jorginho

Convidado (R$ 20,00):
1️⃣- Icaro
2️⃣- R. Ferreira
3️⃣- Fábio
4️⃣- Elias
5️⃣- `

function extraiNumero(l) {
  if (/^[\u0030-\u0039](?:\uFE0F\u20E3)+/.test(l)) return true
  if (/^[\u2460-\u2473\u3251-\u325F]/.test(l)) return true
  if (/^\u{1F51F}/u.test(l)) return true
  if (/^\d{1,2}/.test(l)) return true
  return null
}

function lerLista(texto) {
  const linha = []
  const gols = []

  const semConvidado = texto.split(/convidado/i)[0]

  for (const bruta of semConvidado.split('\n')) {
    const l = bruta.trim()
    if (!l) continue

    const numero = extraiNumero(l)
    const ehGol = l.includes('🥅')

    if (numero === null && !ehGol) continue

    let nome = l.replace(/^\s*\u{1F945}/u, '').trimStart()
    nome = nome
      .replace(
        /^(\s*(?:[\u0030-\u0039](?:\uFE0F\u20E3)+|[\u2460-\u2473\u3251-\u325F]|\u{1F51F}|\d{1,2})\s*[-–—.:)]?\s*)+/u,
        ''
      )
      .replace(/^[\s\-–—.:)]+/, '')
      .replace(/[*_~`]/g, '')
      .trim()

    if (nome.length < 2) continue

    if (ehGol) gols.push(nome)
    else linha.push(nome)
  }

  return { linha, gols }
}

function embaralhar(a) {
  const c = [...a]
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const t = c[i]
    c[i] = c[j]
    c[j] = t
  }
  return c
}

function sortear(linha, golsFixos) {
  const embaralhados = embaralhar(linha)

  const gols = golsFixos.slice(0, 2)
  for (const extra of golsFixos.slice(2)) embaralhados.push(extra)

  while (gols.length < 2) gols.push(embaralhados.shift())

  const t1 = [gols[0]]
  const t2 = [gols[1]]

  for (let i = 0; i < DE_LINHA; i++) {
    const a = embaralhados[i * 2]
    const b = embaralhados[i * 2 + 1]
    if (a !== undefined) t1.push(a)
    if (b !== undefined) t2.push(b)
  }

  const fora = embaralhados.slice(DE_LINHA * 2)

  return { t1, t2, fora }
}

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

const r = lerLista(LISTA_REAL)

console.log('\n--- O QUE ENTROU ---')
console.log('  gols:  ' + JSON.stringify(r.gols))
console.log('  linha: ' + JSON.stringify(r.linha))

const ESPERADOS = [
  'Vieira',
  'RIBA',
  'Matheus M',
  'Matheus T',
  'Joca',
  'Daniel',
  'PH',
  'Debson',
  'Lucas',
  'Tiago (O retorno)',
  'Bruno',
  'Márcio',
]

teste('12 de linha', r.linha.length === 12, r.linha.length + ' -> ' + JSON.stringify(r.linha))
teste('2 goleiros', r.gols.length === 2, JSON.stringify(r.gols))
teste('goleiro 1 Galinho', r.gols.includes('Galinho'), JSON.stringify(r.gols))
teste('goleiro 2 Jorginho', r.gols.includes('Jorginho'), JSON.stringify(r.gols))

for (const nome of ESPERADOS) {
  teste('entrou: ' + nome, r.linha.includes(nome))
}

console.log('\n--- CABECALHO NAO VIROU NOME ---')
// a regra e: so entra linha que comeca com numero. nao existe lista de
// palavras proibidas, entao qualquer cabecalho novo ja fica de fora sozinho
teste('Lista Aerobaba fora', !r.linha.some((n) => n.includes('Aerobaba')))
teste('Local: Costa Verde fora', !r.linha.some((n) => n.includes('Costa Verde')))
teste('Bola rolando fora', !r.linha.some((n) => n.includes('Bola')))

// estes nao estao no filtro por palavra: so funcionam porque nao comecam com numero
const EXTRA = `Lista Aerobaba 30/09/2026
Rolou na Quadra 2
Chuva prevista as 19h
Chave do grupo: CrediGest
1️⃣- Vieira
2️⃣- RIBA
🥅 - Galinho`
const e = lerLista(EXTRA)
console.log('\n  cabecalhos extras que nem estao no filtro:')
console.log('  -> ' + JSON.stringify(e.linha) + ' gols ' + JSON.stringify(e.gols))
teste('cabecalho com palavra "Chave" fora', !e.linha.some((n) => n.includes('CrediGest')))
teste('"Quadra 2" fora', !e.linha.some((n) => n.includes('Quadra')))
teste('"Chuva prevista" fora', !e.linha.some((n) => n.includes('Chuva')))
teste('mas os 2 nomes entraram', e.linha.length === 2, JSON.stringify(e.linha))

console.log('\n--- CONVIDADO E NUMEROS VAZIOS ---')
teste('convidado Icaro fora', !r.linha.includes('Icaro'))
teste('convidado R. Ferreira fora', !r.linha.includes('R. Ferreira'))
teste('convidado Fabio fora', !r.linha.includes('Fábio'))
teste('convidado Elias fora', !r.linha.includes('Elias'))
teste('nenhum numero sobrou no nome', !r.linha.some((n) => /[\u0030-\u0039️⃣]/.test(n)), JSON.stringify(r.linha))
teste('nenhum hifen no comeco', !r.linha.some((n) => n.startsWith('-')))

console.log('\n--- SORTEIO (300 rodadas) ---')

let times6 = 0
let semRepetir = 0
let golsCertos = 0
let totalCerto = 0
let separados = 0
let MIN_FORA = 999
let MAX_FORA = 0
const TOTAL_LISTA = r.linha.length + r.gols.length

for (let n = 0; n < 300; n++) {
  const { t1, t2, fora } = sortear(r.linha, r.gols)

  if (t1.length === 6 && t2.length === 6) times6++

  const todos = [...t1, ...t2, ...fora]
  if (new Set(todos).size === todos.length) semRepetir++

  const g1 = t1.includes('Galinho') || t2.includes('Galinho')
  const g2 = t1.includes('Jorginho') || t2.includes('Jorginho')
  if (g1 && g2) golsCertos++

  if (todos.length === TOTAL_LISTA) totalCerto++

  if (t1.includes('Galinho') !== t2.includes('Galinho')) {
    if (t1.includes('Jorginho') !== t2.includes('Jorginho')) separados++
  }

  MIN_FORA = Math.min(MIN_FORA, fora.length)
  MAX_FORA = Math.max(MAX_FORA, fora.length)
}

console.log('  exemplo: ' + JSON.stringify(sortear(r.linha, r.gols).t1))

teste('sempre 6 contra 6', times6 === 300, times6 + '/300')
teste('nunca repete ninguem', semRepetir === 300, semRepetir + '/300')
teste('os 2 goleiros entram sempre', golsCertos === 300, golsCertos + '/300')
teste('nada some da lista (' + TOTAL_LISTA + ' no total)', totalCerto === 300, totalCerto + '/300')
teste('goleiros em times diferentes', separados === 300, separados + '/300')
teste('14 nomes = 2 de reserva sempre', MIN_FORA === 2 && MAX_FORA === 2, 'entre ' + MIN_FORA + ' e ' + MAX_FORA)

console.log('\n--- GOLEIRO PODE SER QUALQUER NOME ---')
// o nome nao esta no codigo. so o emoji importa
const trocou = lerLista(`1️⃣- Vieira
2️⃣- RIBA
🥅 - Zeca
🥅 - Tadeu`)
teste('goleiro novo: Zeca', trocou.gols.includes('Zeca'))
teste('goleiro novo: Tadeu', trocou.gols.includes('Tadeu'))
teste('e nada de Galinho aparece', !trocou.gols.includes('Galinho') && !trocou.linha.includes('Galinho'))

console.log('\n--- CASOS DE BORDA ---')
const umGol = sortear(r.linha, ['Galinho'])
teste('1 goleiro: completa com sorteado', umGol.t1.length === 6 && umGol.t2.length === 6)
teste('1 goleiro: Galinho fica em campo', umGol.t1.includes('Galinho') || umGol.t2.includes('Galinho'))

const zeroGol = sortear(r.linha, [])
teste('0 goleiro: sorteia 2', zeroGol.t1.length === 6 && zeroGol.t2.length === 6)

const grande = { linha: [], gols: ['Galinho', 'Jorginho'] }
for (let i = 0; i < 20; i++) grande.linha.push('Jogador' + i)
const cheio = sortear(grande.linha, grande.gols)
teste('20 de linha: 6 contra 6', cheio.t1.length === 6 && cheio.t2.length === 6)
teste('20 de linha: 10 na reserva', cheio.fora.length === 10, cheio.fora.length + ' na reserva')
teste('20 de linha: nada some', new Set([...cheio.t1, ...cheio.t2, ...cheio.fora]).size === 22)

const tresGol = sortear(r.linha, ['Galinho', 'Jorginho', 'Zeca'])
teste('3 goleiros: 6 contra 6', tresGol.t1.length === 6 && tresGol.t2.length === 6)
teste(
  '3 goleiros: 3o nao some',
  tresGol.fora.includes('Zeca') || tresGol.t1.includes('Zeca') || tresGol.t2.includes('Zeca')
)

const minimo = sortear(['A', 'B', 'C'], ['G1', 'G2'])
teste(
  'lista curta: da o que da',
  minimo.t1.length + minimo.t2.length === 5,
  JSON.stringify(minimo.t1) + ' / ' + JSON.stringify(minimo.t2)
)
teste('lista curta: nada null', ![...minimo.t1, ...minimo.t2].includes(null))

const soUm = lerLista(`1️⃣- Vieira`)
teste('so um jogador: 1 em campo', soUm.linha.length + soUm.gols.length === 1)

const nada = lerLista(`Lista Aerobaba 30/09/2026
Local: Costa Verde
Bola rolando: 19h`)
teste('so cabecalho: nenhum jogador', nada.linha.length === 0 && nada.gols.length === 0)

console.log('\nresultado: ' + passou + ' passaram, ' + falhou + ' falharam\n')
process.exit(falhou > 0 ? 1 : 0)