# Futebol de Quarta — contexto do projeto

Sorteio de times para o futebol de quarta-feira, 19h.

## Regras do jogo

- Lista montada no grupo perto do horário, nomes em qualquer ordem
- **Sorteio é aleatório mesmo.** Ninguém sabe quem é forte, e ninguém se importa
- Formato: **sempre 6 contra 6** (12 em campo = 6 de linha + 1 goleiro cada)
- **Time 1 é verde, time 2 é amarelo**
- Convidados ficam numa lista separada: só entram no jogo seguinte, no lugar de
  quem saiu. O app ignora a seção de convidados
- Quem sobrar aparece como **Reserva**, para ser a troca da rodada
- Lista vazia de número (`1️⃣3️⃣ - `) é ignorada

## Goleiro é marcado com 🥅, não pelo nome

Quem tem 🥅 na lista entra como goleiro fixo. **O nome não importa** — numa
semana pode ser Galinho e Jorginho, na outra Zeca e Tadeu, porque alguém faltou.

Por isso o parser só olha o emoji. Nenhum nome está escrito no código.

- 2 marcados: ambos entram, um em cada time
- 1 marcado: ele fica e o segundo é sorteado entre os de linha
- 0 marcados: os 2 são sorteados
- mais de 2: o excedente volta pra lista de linha/reserva

## App

Arquivo único, sem build, sem npm: `index.html`

Abre direto no navegador. Pra mandar no grupo, é só copiar o arquivo ou
publicar no GitHub Pages.

## Como sorteia

1. `lerLista()` limpa o texto colado e separa quem tem 🥅 dos demais
2. Os marcados viram goleiros fixos; o que faltar é sorteado
3. Embaralha a lista de linha (Fisher-Yates)
4. Reparte 5 de linha pra cada time
5. Quem sobrar vira Reserva

Decisão: os nomes da lista **não** carregam nota nenhuma. É sorteio puro. Se um
dia alguém quiser ordem por mérito, a mudança fica isolada em `sortear()`.

## Lista vem suja do WhatsApp

A colada tem 3 blocos: cabeçalho, lista numerada e convidados.

```
Lista Aerobaba 30/09/2026      <- cabeçalho, ignorado
Local: Costa Verde             <- cabeçalho, ignorado
Bola rolando: 19h             <- cabeçalho, ignorado

1️⃣- Vieira                     <- nome
🔟  -Tiago (O retorno)         <- nome (o 10 é emoji diferente)
1️⃣1️⃣ - Bruno                  <- nome (2 dígitos em keycap)
🥅 - Galinho                   <- goleiro fixo

Convidado (R$ 20,00):          <- corta tudo daqui pra baixo
1️⃣- Icaro
```

### A regra: só entra linha que começa com número

Deliberadamente **não** existe lista de palavras proibidas (`local`, `bola`,
`lista`...). A versão anterior filtrava por palavra e quebrava na hora que o
grupo escrevia "Rolou na Quadra 2" — o "Quadra 2" entrava como nome.

Agora é o contrário: se a linha não começa com número, ela é cabeçalho por
definição. Qualquer texto novo que o grupoinventar fica de fora sozinho.

### Detalhes que já quebraram e têm teste

- `1️⃣` a `9️⃣` são keycap (dígito + VS16 + U+20E3). **`🔟` (10) é um emoji
  diferente (U+1F51F)** — código que só trata keycap deixa o número no nome
- `1️⃣1️⃣` são dois keycap: o prefixo numérico precisa ser comido inteiro
- depois de tirar o número sobra `" -Tiago"`, com espaço e hífen
- `🥅` vem **antes** do hífen: sem limpar depois, vira `"- Galinho"`
- `1️⃣3️⃣ - ` sem nome some depois da limpeza
- o prefixo é comido num `replace` só, com o grupo repetido `(...) +`. Fazer
  um `replace` por dígito deixa resíduo nos números de 2 dígitos

## Imagem de fundo

`index.html` aponta pra `background.jpg`. Se o arquivo existir na pasta, ele vira
o fundo. Se não existir, o navegador usa só a cor escura e nada quebra.

Pra trocar a foto: nomeie a imagem de **`background.jpg`** e jogue em
`C:\Users\gabri\Projetos\football\`.

Cuidado com a extensão: salvar como `background.jpg.jpg` faz o app não achar,
porque o CSS pede `background.jpg` exato.

## Estado

Funcionando. Testes: `node lista-real.test.mjs` (50) e `node sortear.test.mjs` (16).