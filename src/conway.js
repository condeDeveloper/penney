// Caminho 2: a formula de Conway. Nao monta cadeia nenhuma, nao resolve sistema
// nenhum: so compara pedacos das duas sequencias.
//
// O "leading number" L(A, B) soma 2^(k-1) para cada k em que os ULTIMOS k
// simbolos de A sao iguais aos PRIMEIROS k de B. Com isso,
//
//   odds de B ganhar de A = (L(A,A) - L(A,B)) / (L(B,B) - L(B,A))
//
// E uma conta de alguns milissegundos para um problema que, pela cadeia, exige
// resolver um sistema linear.

import { fr } from './fracao.js';

/** O leading number de Conway. */
export function correlacao(a, b) {
  let total = 0n;
  const teto = Math.min(a.length, b.length);
  for (let k = 1; k <= teto; k++) {
    if (a.slice(a.length - k) === b.slice(0, k)) total += 2n ** BigInt(k - 1);
  }
  return total;
}

/** A probabilidade de A aparecer antes de B, pela formula. */
export function probabilidadeDeAPorConway(a, b) {
  if (a === b) throw new Error('as duas sequencias sao iguais');
  const aa = correlacao(a, a);
  const ab = correlacao(a, b);
  const bb = correlacao(b, b);
  const ba = correlacao(b, a);

  // odds de A ganhar = (L(B,B) - L(B,A)) : (L(A,A) - L(A,B))
  const favorA = bb - ba;
  const favorB = aa - ab;
  return fr(favorA, favorA + favorB);
}

/**
 * A receita de Conway para responder a uma sequencia do adversario: pegue o
 * SEGUNDO simbolo dele, inverta, e ponha na frente dos dois primeiros dele.
 * Para 'CCK' a resposta e 'KCC'. Aqui ela nao e assumida: a varredura mede se a
 * resposta construida assim e mesmo a melhor.
 */
export function respostaDeConway(seq) {
  if (seq.length < 2) throw new Error('a receita precisa de pelo menos 2 simbolos');
  const inverso = seq[1] === 'C' ? 'K' : 'C';
  return inverso + seq.slice(0, seq.length - 1);
}

/** Todas as sequencias de comprimento k sobre C (cara) e K (coroa). */
export function* sequencias(k) {
  for (let m = 0; m < 1 << k; m++) {
    let s = '';
    for (let i = 0; i < k; i++) s += (m >> i) & 1 ? 'K' : 'C';
    yield s;
  }
}
