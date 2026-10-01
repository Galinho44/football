// Testa o parser e o sorteio com a lista REAL do WhatsApp.
// Regra: todo mundo que nao e convidado joga. Ninguem fica de fora.
//
// Roda com: node lista-real.test.mjs

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

// igual ao index.html: distribui TODO mundo, alternando
function sortear(linha, golsFixos) {
  const embaralhados = embaralhar(linha)

  const gols = golsFixos.slice(0, 2)
  for (const extra of golsFixos.slice(2)) embaralhados.push(extra)

  while (gols.length < 2) gols.push(embaralhados.shift())

  const t1 = [gols[0]]
  const t2 = [gols[1]]

  for (let i = 0; i < embaralhados.length; i++) {
    if (i % 2 === 0) t1.push(embaralhados[i])
    else t2.push(embaralhados[i])
  }

  return { t1, t2 }
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
for (const nome of ESPERADOS) teste('entrou: ' + nome, r.linha.includes(nome))

console.log('\n--- CABECALHO NAO VIROU NOME ---')
teste('Lista Aerobaba fora', !r.linha.some((n) => n.includes('Aerobaba')))
teste('Local: Costa Verde fora', !r.linha.some((n) => n.includes('Costa Verde')))
teste('Bola rolando fora', !r.linha.some((n) => n.includes('Bola')))

const EXTRA = `Lista Aerobaba 30/09/2026
Rolou na Quadra 2
Chuva prevista as 19h
Chave do grupo: CrediGest
1️⃣- Vieira
2️⃣- RIBA
🥅 - Galinho`
const e = lerLista(EXTRA)
teste('"Chave/CrediGest" fora', !e.linha.some((n) => n.includes('CrediGest')))
teste('"Quadra 2" fora', !e.linha.some((n) => n.includes('Quadra')))
teste('"Chuva prevista" fora', !e.linha.some((n) => n.includes('Chuva')))
teste('mas os 2 nomes entraram', e.linha.length === 2, JSON.stringify(e.linha))

console.log('\n--- CONVIDADO E NUMEROS VAZIOS ---')
teste('convidado Icaro fora', !r.linha.includes('Icaro'))
teste('convidado R. Ferreira fora', !r.linha.includes('R. Ferreira'))
teste('convidado Fabio fora', !r.linha.includes('Fábio'))
teste('convidado Elias fora', !r.linha.includes('Elias'))
teste('nenhum hifen no comeco', !r.linha.some((n) => n.startsWith('-')))

console.log('\n--- TODO MUNDO JOGA (300 rodadas) ---')

let timesIguais = 0
let semRepetir = 0
let golsCertos = 0
let ninguemFora = 0
let golsSeparados = 0
let diferencaMax = 0
const TOTAL = r.linha.length + r.gols.length

for (let n = 0; n < 300; n++) {
  const { t1, t2 } = sortear(r.linha, r.gols)

  // todo mundo entra: a soma dos times e o total da lista
  if (t1.length + t2.length === TOTAL) ninguemFora++

  // ninguem repetido
  const todos = [...t1, ...t2]
  if (new Set(todos).size === todos.length) semRepetir++

  // os 2 goleiros entram
  const g1 = t1.includes('Galinho') || t2.includes('Galinho')
  const g2 = t1.includes('Jorginho') || t2.includes('Jorginho')
  if (g1 && g2) golsCertos++

  // um goleiro em cada time
  if (t1.includes('Galinho') !== t2.includes('Galinho')) {
    if (t1.includes('Jorginho') !== t2.includes('Jorginho')) golsSeparados++
  }

  // times equilibrados: diferenca de no maximo 1
  const dif = Math.abs(t1.length - t2.length)
  if (dif <= 1) timesIguais++
  diferencaMax = Math.max(diferencaMax, dif)
}
console.log('  exemplo: ' + JSON.stringify(sortear(r.linha, r.gols).t1))

teste('todo mundo entra nos times', ninguemFora === 300, ninguemFora + '/300')
teste('ninguem repetido', semRepetir === 300, semRepetir + '/300')
teste('os 2 goleiros entram', golsCertos === 300, golsCertos + '/300')
teste('1 goleiro em cada time', golsSeparados === 300, golsSeparados + '/300')
teste('times equilibrados (dif <= 1)', timesIguais === 300, timesIguais + '/300, diferenca max ' + diferencaMax)

// 14 jogadores (12 + 2 gols) divididos em 2 => 7 e 7
const ex = sortear(r.linha, r.gols)
teste('14 jogadores = 7 e 7', ex.t1.length === 7 && ex.t2.length === 7, ex.t1.length + ' e ' + ex.t2.length)

console.log('\n--- TAMANHO DO TIME (formato) ---')

// o sorteio nao muda com o formato: quem manda e a quantidade de gente.
// o formato serve pra exigir um minimo. testamos essa regra
function minimoDoFormato(porTime) {
  return porTime * 2
}

teste('6x6 pede 12', minimoDoFormato(6) === 12)
teste('7x7 pede 14', minimoDoFormato(7) === 14)
teste('5x5 pede 10', minimoDoFormato(5) === 10)
teste('8x8 pede 16', minimoDoFormato(8) === 16)

// contagens que dao times equilibrados com todo mundo jogando
function timesPara(total) {
  const t1 = Math.ceil(total / 2)
  const t2 = total - t1
  return [t1, t2]
}

teste('12 jogadores -> 6 e 6', JSON.stringify(timesPara(12)) === '[6,6]', JSON.stringify(timesPara(12)))
teste('14 jogadores -> 7 e 7', JSON.stringify(timesPara(14)) === '[7,7]', JSON.stringify(timesPara(14)))
teste('13 jogadores -> 7 e 6', JSON.stringify(timesPara(13)) === '[7,6]', JSON.stringify(timesPara(13)))
teste('11 jogadores -> 6 e 5', JSON.stringify(timesPara(11)) === '[6,5]', JSON.stringify(timesPara(11)))
teste('20 jogadores -> 10 e 10', JSON.stringify(timesPara(20)) === '[10,10]', JSON.stringify(timesPara(20)))

console.log('\n--- GOLEIRO PODE SER QUALQUER NOME ---')
const trocou = lerLista(`1️⃣- Vieira
2️⃣- RIBA
🥅 - Zeca
🥅 - Tadeu`)
teste('goleiro novo: Zeca', trocou.gols.includes('Zeca'))
teste('goleiro novo: Tadeu', trocou.gols.includes('Tadeu'))
teste('sem Galinho no codigo', !trocou.gols.includes('Galinho'))

console.log('\n--- CASOS DE BORDA ---')
const umGol = sortear(r.linha, ['Galinho'])
// 12 de linha + 1 goleiro fixo = 13 pessoas
teste('1 goleiro: completa com sorteado', umGol.t1.length + umGol.t2.length === 13, umGol.t1.length + '+' + umGol.t2.length)
teste('1 goleiro: Galinho em campo', umGol.t1.includes('Galinho') || umGol.t2.includes('Galinho'))

const zeroGol = sortear(r.linha, [])
// sem goleiro marcado, os 2 saem dos proprios 12 de linha: continua 12 no total
teste('0 goleiro: sorteia 2', zeroGol.t1.length + zeroGol.t2.length === 12, zeroGol.t1.length + '+' + zeroGol.t2.length)

const tresGol = sortear(r.linha, ['Galinho', 'Jorginho', 'Zeca'])
teste('3 goleiros: todos entram', tresGol.t1.length + tresGol.t2.length === TOTAL + 1)
teste(
  '3 goleiros: Zeca nao some',
  tresGol.t1.includes('Zeca') || tresGol.t2.includes('Zeca')
)

const grande = { linha: [], gols: ['Galinho', 'Jorginho'] }
for (let i = 0; i < 20; i++) grande.linha.push('Jogador' + i)
const cheio = sortear(grande.linha, grande.gols)
teste('20 de linha: todos jogam', cheio.t1.length + cheio.t2.length === 22, cheio.t1.length + '+' + cheio.t2.length)
teste('20 de linha: equilibrado', Math.abs(cheio.t1.length - cheio.t2.length) <= 1)

const soUm = lerLista(`1️⃣- Vieira`)
teste('so um jogador: 1 no total', soUm.linha.length + soUm.gols.length === 1)

const nada = lerLista(`Lista Aerobaba 30/09/2026
Local: Costa Verde
Bola rolando: 19h`)
teste('so cabecalho: nenhum jogador', nada.linha.length === 0 && nada.gols.length === 0)

console.log('\nresultado: ' + passou + ' passaram, ' + falhou + ' falharam\n')
process.exit(falhou > 0 ? 1 : 0)