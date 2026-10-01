// Testa a logica do sorteio isolada do navegador.
// Roda com: node sortear.test.mjs

const POR_TIME = 6

function embaralhar(lista) {
  const copia = [...lista]
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
  }
  return copia
}

function sortear(nomes) {
  const sorteados = embaralhar(nomes)
  const goleiros = sorteados.slice(0, 2)
  const deLinha = sorteados.slice(2)

  const porTime = Math.ceil(nomes.length / 2)
  const time1 = [goleiros[0]]
  const time2 = [goleiros[1]]

  for (let i = 0; i < porTime - 1; i++) {
    time1.push(deLinha[i * 2])
    if (deLinha[i * 2 + 1]) time2.push(deLinha[i * 2 + 1])
  }

  const resto = deLinha.slice((porTime - 1) * 2)
  for (const nome of resto) {
    if (time1.length <= time2.length) time1.push(nome)
    else time2.push(nome)
  }

  return { time1, time2 }
}

function limparNomes(texto) {
  return texto
    .split('\n')
    .map((linha) => linha.replace(/^\s*\d+[.)-]\s*/, '').replace(/[*_~`]/g, '').trim())
    .filter((nome) => nome.length > 0)
}

let passou = 0
let falhou = 0

function teste(nome, condicao) {
  if (condicao) {
    passou++
    console.log('  ok  ' + nome)
  } else {
    falhou++
    console.log('  FALHOU  ' + nome)
  }
}

console.log('\nlimparNomes')
teste('tira numero de lista', limparNomes('1. Joao\n2. Maria')[0] === 'Joao')
teste('tira asterisco', limparNomes('*Ana*')[0] === 'Ana')
teste('tira linha vazia', limparNomes('Joao\n\n\nMaria').length === 2)
teste('tira espaco sobrando', limparNomes('  Carlos  ')[0] === 'Carlos')

console.log('\nsortear')
const nomes12 = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']
const r = sortear(nomes12)
teste('time 1 tem 6', r.time1.length === 6)
teste('time 2 tem 6', r.time2.length === 6)

const todos = [...r.time1, ...r.time2]
teste('nenhum jogador repetido', new Set(todos).size === todos.length)
teste('ninguem fica de fora', todos.length === 12)

teste('goleiro 1 e o primeiro do time', r.time1[0] === r.time1[0])
teste('goleiro do time 1 difere do time 2', r.time1[0] !== r.time2[0])

console.log('\nsortear 200 vezes (garante que nunca quebra)')
let comProblema = 0
for (let i = 0; i < 200; i++) {
  const s = sortear(embaralhar(nomes12))
  const juntos = [...s.time1, ...s.time2]
  if (s.time1.length !== 6 || s.time2.length !== 6 || new Set(juntos).size !== 12) {
    comProblema++
  }
}
teste('200 sorteios com 12 sempre dao 6x6 sem repetir', comProblema === 0)

console.log('\nsortear 14 pessoas (sobra gente)')
const r14 = sortear([...nomes12, 'M', 'N'])
teste('14 gente -> times de 7', r14.time1.length === 7 && r14.time2.length === 7)
teste(
  '14 gente: ninguem repetido nem esquecido',
  new Set([...r14.time1, ...r14.time2]).size === 14,
)

console.log('\nsortear 13 pessoas (sobra 1)')
const r13 = sortear([...nomes12, 'M'])
teste('13 gente -> 7 e 6', (r13.time1.length === 7 && r13.time2.length === 6) || (r13.time1.length === 6 && r13.time2.length === 7))
teste(
  '13 gente: ninguem repetido nem esquecido',
  new Set([...r13.time1, ...r13.time2]).size === 13,
)

console.log('\n200 sorteios com numeros variados')
let problemas2 = 0
for (let i = 0; i < 200; i++) {
  const quantos = 12 + (i % 5)
  const lista = Array.from({ length: quantos }, (_, k) => 'J' + k)
  const s = sortear(embaralhar(lista))
  const juntos = [...s.time1, ...s.time2]
  const diff = Math.abs(s.time1.length - s.time2.length)
  if (new Set(juntos).size !== quantos || diff > 1) problemas2++
}
teste('200 sorteios: sizes equilibrados e ninguem perdido', problemas2 === 0)

console.log('\nresultado: ' + passou + ' passaram, ' + falhou + ' falharam\n')
process.exit(falhou > 0 ? 1 : 0)