// Fracoes exatas em BigInt. As probabilidades deste projeto sao racionais com
// denominadores feios (7/12, 5/8, 7/10, 63/128), e a diferenca entre 2/3 e
// 0,6666666666666666 apareceria logo na primeira comparacao de empate.

export function mdc(a, b) {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y) [x, y] = [y, x % y];
  return x;
}

export function fr(num, den = 1n) {
  let n = BigInt(num);
  let d = BigInt(den);
  if (d === 0n) throw new Error('denominador zero');
  if (d < 0n) {
    n = -n;
    d = -d;
  }
  const g = mdc(n, d);
  return g > 1n ? { n: n / g, d: d / g } : { n, d };
}

export const ZERO = fr(0n);
export const UM = fr(1n);
export const MEIO = fr(1n, 2n);

export const soma = (a, b) => fr(a.n * b.d + b.n * a.d, a.d * b.d);
export const sub = (a, b) => fr(a.n * b.d - b.n * a.d, a.d * b.d);
export const mult = (a, b) => fr(a.n * b.n, a.d * b.d);
export const div = (a, b) => fr(a.n * b.d, a.d * b.n);
export const neg = (a) => fr(-a.n, a.d);

export function compara(a, b) {
  const x = a.n * b.d;
  const y = b.n * a.d;
  return x < y ? -1 : x > y ? 1 : 0;
}

export const igual = (a, b) => compara(a, b) === 0;
export const ehZero = (a) => a.n === 0n;

export function texto(a) {
  return a.d === 1n ? a.n.toString() : `${a.n}/${a.d}`;
}

export function paraNumero(a) {
  return Number(a.n) / Number(a.d);
}

/**
 * Resolve um sistema linear com coeficientes fracionarios, por eliminacao de
 * Gauss. Tudo exato: nao ha pivo "quase zero" nem tolerancia.
 * @param {object[][]} A matriz n x n de fracoes
 * @param {object[]} b vetor de fracoes
 * @returns {object[]} a solucao
 */
export function resolver(A, b) {
  const n = A.length;
  const M = A.map((linha, i) => [...linha.map((x) => fr(x.n, x.d)), fr(b[i].n, b[i].d)]);

  for (let col = 0; col < n; col++) {
    let pivo = -1;
    for (let i = col; i < n; i++) {
      if (!ehZero(M[i][col])) { pivo = i; break; }
    }
    if (pivo === -1) throw new Error(`sistema sem solucao unica na coluna ${col}`);
    [M[col], M[pivo]] = [M[pivo], M[col]];

    const p = M[col][col];
    for (let j = col; j <= n; j++) M[col][j] = div(M[col][j], p);

    for (let i = 0; i < n; i++) {
      if (i === col || ehZero(M[i][col])) continue;
      const fator = M[i][col];
      for (let j = col; j <= n; j++) M[i][j] = sub(M[i][j], mult(fator, M[col][j]));
    }
  }
  return M.map((linha) => linha[n]);
}
