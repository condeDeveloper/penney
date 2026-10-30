import test from 'node:test';
import assert from 'node:assert/strict';
import {
  fr, mdc, soma, sub, mult, div, neg, compara, igual, ehZero, texto, paraNumero,
  resolver, ZERO, UM, MEIO,
} from '../src/fracao.js';

test('mdc basico', () => {
  assert.equal(mdc(12n, 18n), 6n);
  assert.equal(mdc(-12n, 18n), 6n);
  assert.equal(mdc(0n, 7n), 7n);
});

test('a fracao e reduzida na criacao', () => {
  assert.deepEqual(fr(2n, 4n), { n: 1n, d: 2n });
  assert.deepEqual(fr(6n, 3n), { n: 2n, d: 1n });
});

test('o sinal fica sempre no numerador', () => {
  assert.deepEqual(fr(1n, -2n), { n: -1n, d: 2n });
  assert.deepEqual(fr(-1n, -2n), { n: 1n, d: 2n });
});

test('denominador zero e erro', () => {
  assert.throws(() => fr(1n, 0n));
});

test('as quatro operacoes', () => {
  assert.equal(texto(soma(fr(1n, 2n), fr(1n, 3n))), '5/6');
  assert.equal(texto(sub(fr(1n, 2n), fr(1n, 3n))), '1/6');
  assert.equal(texto(mult(fr(2n, 3n), fr(3n, 4n))), '1/2');
  assert.equal(texto(div(fr(1n, 2n), fr(1n, 4n))), '2');
});

test('somar um setimo sete vezes da exatamente um', () => {
  // 7 e o denominador que aparece no jogo (7/8, 7/12). Em double, somar 1/7
  // sete vezes da 0.9999999999999998. Com 1/3 tres vezes o double ACERTA,
  // porque os dois arredondamentos se cancelam: nao da para escolher o exemplo
  // no olho, tem de medir.
  let x = ZERO;
  for (let i = 0; i < 7; i++) x = soma(x, fr(1n, 7n));
  assert.ok(igual(x, UM));

  let d = 0;
  for (let i = 0; i < 7; i++) d += 1 / 7;
  assert.equal(d, 0.9999999999999998);
  assert.notEqual(d, 1);

  let tercos = 0;
  for (let i = 0; i < 3; i++) tercos += 1 / 3;
  assert.equal(tercos, 1);
});

test('o negativo e a soma dao zero', () => {
  const a = fr(7n, 12n);
  assert.ok(ehZero(soma(a, neg(a))));
});

test('comparar fracoes de denominadores diferentes', () => {
  assert.equal(compara(fr(2n, 3n), fr(7n, 10n)), -1);
  assert.equal(compara(fr(7n, 12n), MEIO), 1);
  assert.equal(compara(fr(1n, 2n), fr(2n, 4n)), 0);
});

test('texto e paraNumero', () => {
  assert.equal(texto(fr(3n, 1n)), '3');
  assert.equal(texto(fr(7n, 8n)), '7/8');
  assert.equal(paraNumero(fr(7n, 8n)), 0.875);
});

test('resolve um sistema 2x2', () => {
  // x + y = 3 ; x - y = 1  =>  x=2, y=1
  const A = [[UM, UM], [UM, neg(UM)]];
  const b = [fr(3n), fr(1n)];
  const x = resolver(A, b);
  assert.ok(igual(x[0], fr(2n)));
  assert.ok(igual(x[1], fr(1n)));
});

test('resolve um sistema 3x3 com solucao fracionaria', () => {
  // 2x = 1 ; 3y = 1 ; 6z = 1
  const A = [
    [fr(2n), ZERO, ZERO],
    [ZERO, fr(3n), ZERO],
    [ZERO, ZERO, fr(6n)],
  ];
  const b = [UM, UM, UM];
  const x = resolver(A, b);
  assert.equal(texto(x[0]), '1/2');
  assert.equal(texto(x[1]), '1/3');
  assert.equal(texto(x[2]), '1/6');
});

test('resolver troca linha quando o pivo e zero', () => {
  const A = [[ZERO, UM], [UM, ZERO]];
  const b = [fr(5n), fr(7n)];
  const x = resolver(A, b);
  assert.ok(igual(x[0], fr(7n)));
  assert.ok(igual(x[1], fr(5n)));
});

test('sistema sem solucao unica e erro', () => {
  const A = [[UM, UM], [fr(2n), fr(2n)]];
  assert.throws(() => resolver(A, [UM, fr(2n)]));
});

test('a solucao do sistema e exata, nao aproximada', () => {
  // um sistema cuja solucao e 1/7, que em double nunca fecha
  const A = [[fr(7n)]];
  const x = resolver(A, [UM]);
  assert.equal(texto(x[0]), '1/7');
  assert.equal(x[0].n, 1n);
  assert.equal(x[0].d, 7n);
});
