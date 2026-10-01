// Gera os icones PNG do app sem nenhuma biblioteca externa.
// Node tem zlib embutido, entao da pra montar um PNG na mao.
//
// Roda com: node gerar-icones.mjs
// Cria icone-192.png e icone-512.png na pasta.

import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'

// ---- monta o arquivo PNG a partir de pixels RGBA ----

const TABELA_CRC = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = TABELA_CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function bloco(tipo, dados) {
  const tam = Buffer.alloc(4)
  tam.writeUInt32BE(dados.length, 0)
  const corpo = Buffer.concat([Buffer.from(tipo, 'ascii'), dados])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(corpo), 0)
  return Buffer.concat([tam, corpo, crc])
}

function png(largura, altura, rgba) {
  const assinatura = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(largura, 0)
  ihdr.writeUInt32BE(altura, 4)
  ihdr[8] = 8 // 8 bits por canal
  ihdr[9] = 6 // RGBA
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  // cada linha comeca com um byte de filtro (0 = nenhum)
  const linhas = []
  for (let y = 0; y < altura; y++) {
    linhas.push(Buffer.from([0]))
    linhas.push(rgba.subarray(y * largura * 4, (y + 1) * largura * 4))
  }
  const idat = deflateSync(Buffer.concat(linhas), { level: 9 })

  return Buffer.concat([
    assinatura,
    bloco('IHDR', ihdr),
    bloco('IDAT', idat),
    bloco('IEND', Buffer.alloc(0)),
  ])
}

// ---- desenha o icone ----

function desenharIc(fundo, tinta) {
  const N = 512
  const px = new Uint8Array(N * N * 4)

  const pintar = (x, y, r, g, b, a = 255) => {
    if (x < 0 || y < 0 || x >= N || y >= N) return
    const i = (y * N + x) * 4
    // mistura simples para borda suave
    const alfa = a / 255
    px[i] = Math.round(px[i] * (1 - alfa) + r * alfa)
    px[i + 1] = Math.round(px[i + 1] * (1 - alfa) + g * alfa)
    px[i + 2] = Math.round(px[i + 2] * (1 - alfa) + b * alfa)
    px[i + 3] = 255
  }

  // fundo verde
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) pintar(x, y, fundo[0], fundo[1], fundo[2])

  // linhas de campo esportivo (branco translucido)
  const cx = N / 2
  const cy = N / 2
  for (let i = 0; i < N; i++) {
    for (let e = 0; e < 4; e++) {
      pintar(i, cy - 2 + e, 255, 255, 255, 40)
      pintar(cx - 2 + e, i, 255, 255, 255, 40)
    }
  }

  // circulo central do campo
  for (let a = 0; a < 360; a += 0.5) {
    const rad = (a * Math.PI) / 180
    for (let e = 0; e < 4; e++) {
      const r = N * 0.3 - 2 + e
      pintar(Math.round(cx + r * Math.cos(rad)), Math.round(cy + r * Math.sin(rad)), 255, 255, 255, 45)
    }
  }

  // bola: circulo branco com contorno escuro
  const rBola = N * 0.24
  for (let y = -rBola; y <= rBola; y++) {
    for (let x = -rBola; x <= rBola; x++) {
      const d = Math.sqrt(x * x + y * y)
      if (d <= rBola) pintar(Math.round(cx + x), Math.round(cy + y), 255, 255, 255)
    }
  }

  // pentagono escuro no meio da bola (a assinatura da bola de futebol)
  const rPenta = N * 0.075
  for (let y = -rPenta; y <= rPenta; y++) {
    for (let x = -rPenta; x <= rPenta; x++) {
      const d = Math.sqrt(x * x + y * y)
      if (d <= rPenta) pintar(Math.round(cx + x), Math.round(cy + y), tinta[0], tinta[1], tinta[2])
    }
  }

  // 5 marcas em volta, pra lembrar gomos da bola
  for (let i = 0; i < 5; i++) {
    const ang = (i * 2 * Math.PI) / 5 - Math.PI / 2
    const mx = cx + Math.cos(ang) * (rBola * 0.82)
    const my = cy + Math.sin(ang) * (rBola * 0.82)
    const r = N * 0.035
    for (let y = -r; y <= r; y++) {
      for (let x = -r; x <= r; x++) {
        if (Math.sqrt(x * x + y * y) <= r) {
          pintar(Math.round(mx + x), Math.round(my + y), tinta[0], tinta[1], tinta[2])
        }
      }
    }
  }

  return { N, px }
}

function redimensionar(px, deN, paraN) {
  const saida = new Uint8Array(paraN * paraN * 4)
  const escala = deN / paraN
  for (let y = 0; y < paraN; y++) {
    for (let x = 0; x < paraN; x++) {
      const ox = Math.floor(x * escala)
      const oy = Math.floor(y * escala)
      const io = (oy * deN + ox) * 4
      const isaida = (y * paraN + x) * 4
      saida[isaida] = px[io]
      saida[isaida + 1] = px[io + 1]
      saida[isaida + 2] = px[io + 2]
      saida[isaida + 3] = 255
    }
  }
  return saida
}

const VERDE = [15, 124, 50]
const TINTA = [15, 23, 42]

const base = desenharIc(VERDE, TINTA)

writeFileSync('icone-512.png', png(512, 512, base.px))
writeFileSync('icone-192.png', png(192, 192, redimensionar(base.px, 512, 192)))

console.log('icone-512.png e icone-192.png gerados.')
