// Caminho 1: montar a cadeia de Markov do jogo e resolver o sistema linear.
//
// O jogo: joga-se uma moeda honesta repetidamente; ganha quem viu a sua sequencia
// aparecer primeiro. O estado e "o maior sufixo do que ja saiu que ainda pode
// virar uma das duas sequencias". Cada estado leva a dois outros, com peso 1/2.
//
// Nada aqui conhece formula nenhuma: e so montar as equacoes e resolver.

import { fr, MEIO, ZERO, UM, soma, mult, resolver } from './fracao.js';

/** O maior sufixo de `s` que e prefixo de `alvo`. */
export function maiorSufixoQueEhPrefixo(s, alvo) {
  const teto = Math.min(s.length, alvo.length);
  for (let k = teto; k > 0; k--) {
    if (s.slice(s.length - k) === alvo.slice(0, k)) return k;
  }
  return 0;
}

/**
 * Os estados da cadeia: todos os prefixos proprios de A e de B, representados
 * pela string em si. O estado inicial e a string vazia.
 */
export function estados(a, b) {
  const conjunto = new Set(['']);
  for (let k = 1; k < a.length; k++) conjunto.add(a.slice(0, k));
  for (let k = 1; k < b.length; k++) conjunto.add(b.slice(0, k));
  // tambem entram os prefixos de um que aparecem como sufixo do outro
  for (const s of [...conjunto]) {
    for (const c of ['C', 'K']) {
      const seguinte = s + c;
      if (seguinte === a || seguinte === b) continue;
      const ka = maiorSufixoQueEhPrefixo(seguinte, a);
      const kb = maiorSufixoQueEhPrefixo(seguinte, b);
      conjunto.add(a.slice(0, ka));
      conjunto.add(b.slice(0, kb));
    }
  }
  return [...conjunto].sort((x, y) => x.length - y.length || x.localeCompare(y));
}

/** Para onde o estado vai ao sair a face `c`. Devolve 'A', 'B' ou outro estado. */
export function transicao(estado, c, a, b) {
  const seguinte = estado + c;
  if (seguinte.endsWith(a)) return 'A';
  if (seguinte.endsWith(b)) return 'B';
  const ka = maiorSufixoQueEhPrefixo(seguinte, a);
  const kb = maiorSufixoQueEhPrefixo(seguinte, b);
  // o estado e o maior sufixo util, olhando as duas sequencias
  return ka >= kb ? a.slice(0, ka) : b.slice(0, kb);
}

/**
 * A probabilidade de A aparecer antes de B, exata.
 * Monta p(e) = 1/2 p(e+C) + 1/2 p(e+K) para cada estado e resolve.
 */
export function probabilidadeDeA(a, b) {
  if (a === b) throw new Error('as duas sequencias sao iguais');
  const es = estados(a, b);
  const indice = new Map(es.map((e, i) => [e, i]));
  const n = es.length;

  const M = Array.from({ length: n }, () => new Array(n).fill(ZERO).map(() => fr(0n)));
  const v = new Array(n).fill(ZERO).map(() => fr(0n));

  for (let i = 0; i < n; i++) {
    M[i][i] = UM;
    for (const c of ['C', 'K']) {
      const destino = transicao(es[i], c, a, b);
      if (destino === 'A') {
        v[i] = soma(v[i], MEIO);
      } else if (destino === 'B') {
        // nao soma nada: B ganhar vale zero para A
      } else {
        const j = indice.get(destino);
        if (j === undefined) throw new Error(`estado nao mapeado: ${destino}`);
        M[i][j] = soma(M[i][j], mult(fr(-1n), MEIO));
      }
    }
  }

  const solucao = resolver(M, v);
  return solucao[indice.get('')];
}

/** Quantos estados a cadeia precisou. Medida do tamanho do problema. */
export function tamanhoDaCadeia(a, b) {
  return estados(a, b).length;
}
