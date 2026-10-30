# O jogo de Penney: escolher depois é melhor

Dois jogadores escolhem uma sequência de cara e coroa — digamos `CCC` e `KCC`. A
moeda é jogada até que uma das duas apareça, e quem escolheu ela ganha. Parece
justo, e o primeiro a escolher parece ter vantagem.

Não tem. **`KCC` ganha de `CCC` em sete de cada oito partidas.** E não há escapatória:
para qualquer sequência que o primeiro jogador escolha, o segundo tem uma resposta
que ganha mais da metade das vezes.

Este repositório calcula a probabilidade exata de cada confronto por dois caminhos
que não se falam — a **cadeia de Markov**, resolvida como sistema linear em fração
exata, e a **fórmula de Conway**, que só compara pedaços das duas sequências. Node
puro, sem dependência nenhuma.

## Os quatro achados

1. **Os dois caminhos concordam nos 1.300 pares varridos**, de 2 a 5 lançamentos,
   sem uma divergência. Um resolve um sistema linear de até 9 incógnitas; o outro
   faz quatro comparações de prefixo com sufixo.
2. **De três lançamentos em diante, nenhuma sequência é segura.** Em `k=3`, `k=4`
   e `k=5`, toda escolha do primeiro jogador tem uma resposta que ganha. Só com
   dois lançamentos existem duas sequências que ninguém bate — e nelas o melhor
   que o adversário consegue é empatar.
3. **A receita de Conway sempre ganha, mas nem sempre é a melhor.** Ela acerta a
   resposta ótima nas 8 sequências de 3 lançamentos, mas só em **10 das 16** de
   quatro, e em **14 das 32** de cinco. Ganhar e ganhar o máximo são coisas
   diferentes.
4. **O menor ciclo de "bate" tem quatro elos em três lançamentos, e três elos em
   quatro.** Com `k=3` não existe pedra-papel-tesoura: o ciclo mais curto é
   `KCC → CCK → CKK → KKC → KCC`. O trio aparece só a partir de `k=4`.

## As tabelas

Tudo abaixo sai de `node ferramentas/medidor.js`, e está preso em
`testes/medidas.test.js`.

### A cadeia de Markov contra a fórmula de Conway

| k | sequências | pares | divergências | estados da maior cadeia |
|---|---|---|---|---|
| 2 | 4 | 12 | 0 | 3 |
| 3 | 8 | 56 | 0 | 5 |
| 4 | 16 | 240 | 0 | 7 |
| 5 | 32 | 992 | 0 | 9 |

### O jogo é justo?

| k | pares | empates | maior vantagem | em que par |
|---|---|---|---|---|
| 2 | 12 | 8 | 3/4 | KC ganha de CC |
| 3 | 56 | 20 | **7/8** | KCC ganha de CCC |
| 4 | 240 | 64 | 15/16 | KCCC ganha de CCCC |
| 5 | 992 | 240 | 31/32 | KCCCC ganha de CCCCC |

A maior vantagem é sempre `1 − 1/2^k`, e sempre no mesmo formato: uma coroa na
frente de todas as caras, contra todas as caras.

### Toda sequência tem quem a bata?

| k | sequências | sem resposta vencedora |
|---|---|---|
| 2 | 4 | 2 |
| 3 | 8 | **0** |
| 4 | 16 | **0** |
| 5 | 32 | **0** |

### A receita de Conway acerta a melhor resposta?

A receita: inverta o segundo símbolo do adversário e ponha na frente dos dois
primeiros dele. Contra `CCK`, responda `KCC`.

| k | sequências | a receita ganha | a receita é a **melhor** |
|---|---|---|---|
| 3 | 8 | 8 | 8 |
| 4 | 16 | 16 | **10** |
| 5 | 32 | 32 | **14** |

### A melhor resposta a cada sequência de três

| escolha do 1º | melhor resposta | chance |
|---|---|---|
| CCC | KCC | 7/8 |
| CCK | KCC | 3/4 |
| CKC | CCK | 2/3 |
| CKK | CCK | 2/3 |
| KCC | KKC | 2/3 |
| KCK | KKC | 2/3 |
| KKC | CKK | 3/4 |
| KKK | CKK | 7/8 |

A pior situação para o segundo jogador ainda é ganhar **2 de cada 3**.

### O menor ciclo

```
k=3, quatro elos:          k=4, três elos:
  KCC ganha de CCK  3/4      KCCC ganha de CCKC  7/12
  CCK ganha de CKK  2/3      CCKC ganha de CKCC   3/5
  CKK ganha de KKC  3/4      CKCC ganha de KCCC  7/12
  KKC ganha de KCC  2/3
```

### Por que 7/8: as correlações de Conway

| | |
|---|---|
| L(CCC, CCC) | 7 |
| L(CCC, KCC) | 0 |
| L(KCC, KCC) | 4 |
| L(KCC, CCC) | 3 |

As chances de `KCC` são `(7 − 0) : (4 − 3)`, ou seja **7 para 1**.

## O que as medidas me corrigiram

- **Escrevi um teste dizendo que somar 1/3 três vezes em `double` não dá 1. Dá.**
  Os dois arredondamentos se cancelam. O denominador que aparece de verdade neste
  jogo é o 7, e aí sim: somar 1/7 sete vezes dá `0.9999999999999998`. Trocado pelo
  número medido — e o teste agora guarda os **dois** casos, para lembrar que não dá
  para escolher o exemplo no olho.
- **Errei os valores do maior sufixo que é prefixo, no teste que deveria
  protegê-los.** Escrevi que o maior sufixo de `CCK` que é prefixo de `CKC` tem
  tamanho 1; tem 2, porque `CK` serve. Essa função é a que monta os estados da
  cadeia inteira: se ela estivesse errada, todas as probabilidades sairiam erradas
  juntas, e a conferência contra Conway é que teria pegado.
- **Procurei um ciclo de três e concluí cedo demais que não havia ciclo em `k=3`.**
  Havia, com quatro elos. Troquei a busca por uma que procura o **menor** ciclo em
  tamanho crescente, e aí o resultado ficou mais interessante do que o que eu
  procurava: o trio só existe a partir de quatro lançamentos.

## Como está organizado

```
src/fracao.js   frações exatas em BigInt e eliminação de Gauss sem tolerância
src/markov.js   os estados do jogo e o sistema linear que dá a probabilidade
src/conway.js   a correlação, a fórmula fechada e a receita de resposta
ferramentas/medidor.js  roda as varreduras e imprime as tabelas acima
testes/         71 testes
```

As probabilidades aqui são `7/12`, `3/5`, `63/128` — racionais de denominador feio.
Resolver o sistema em ponto flutuante daria números quase certos, e "quase" não
serve para decidir se um par empata ou não.

## Rodar

```bash
node --test testes/*.test.js   # a bateria inteira
node ferramentas/medidor.js    # recalcula todas as tabelas deste README
```

Sem `npm install`: não há dependência. Precisa de Node 18 ou mais novo.

## Licença

MIT.
