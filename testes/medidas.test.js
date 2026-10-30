// Os numeros que aparecem no README, presos aqui. Todos sairam de
// `node ferramentas/medidor.js`; nenhum foi digitado de cabeca.

import test from 'node:test';
import assert from 'node:assert/strict';
import { medir, acharMenorCiclo, COMPRIMENTOS } from '../ferramentas/medidor.js';
import { probabilidadeDeA } from '../src/markov.js';
import { correlacao } from '../src/conway.js';
import { texto, compara, MEIO } from '../src/fracao.js';

const tabela = {
  2: { seqs: 4, pares: 12, estados: 3, empates: 8, vantagem: '3/4', semResposta: 2, ganha: 2, melhor: 4 },
  3: { seqs: 8, pares: 56, estados: 5, empates: 20, vantagem: '7/8', semResposta: 0, ganha: 8, melhor: 8 },
  4: { seqs: 16, pares: 240, estados: 7, empates: 64, vantagem: '15/16', semResposta: 0, ganha: 16, melhor: 10 },
  5: { seqs: 32, pares: 992, estados: 9, empates: 240, vantagem: '31/32', semResposta: 0, ganha: 32, melhor: 14 },
};

test('a varredura cobre comprimentos de 2 a 5', () => {
  assert.deepEqual(COMPRIMENTOS, [2, 3, 4, 5]);
});

for (const k of [2, 3, 4, 5]) {
  const t = tabela[k];

  test(`tabela 1, k=${k}: ${t.pares} pares, zero divergencia`, () => {
    const r = medir(k);
    assert.equal(r.sequencias, t.seqs);
    assert.equal(r.pares, t.pares);
    assert.equal(r.divergem, 0);
  });

  test(`tabela 1, k=${k}: a maior cadeia tem ${t.estados} estados`, () => {
    assert.equal(medir(k).estadosMax, t.estados);
  });

  test(`tabela 2, k=${k}: ${t.empates} pares empatam e a maior vantagem e ${t.vantagem}`, () => {
    const r = medir(k);
    assert.equal(r.empates, t.empates);
    assert.equal(r.maiorVantagem, t.vantagem);
  });

  test(`tabela 3, k=${k}: ${t.semResposta} sequencias sem resposta vencedora`, () => {
    assert.equal(medir(k).semResposta, t.semResposta);
  });

  test(`tabela 4, k=${k}: a receita ganha em ${t.ganha} e e a melhor em ${t.melhor}`, () => {
    const r = medir(k);
    assert.equal(r.receitaGanha, t.ganha);
    assert.equal(r.receitaCerta, t.melhor);
  });
}

test('tabela 2: a maior vantagem e sempre 1 menos 1/2^k', () => {
  for (const k of [2, 3, 4, 5]) {
    assert.equal(medir(k).maiorVantagem, `${2 ** k - 1}/${2 ** k}`, `k=${k}`);
  }
});

test('tabela 2: o par mais desigual e sempre K seguido de caras contra todas caras', () => {
  for (const k of [2, 3, 4, 5]) {
    const p = medir(k).parMaisDesigual;
    assert.equal(p.a, 'K' + 'C'.repeat(k - 1), `k=${k}`);
    assert.equal(p.b, 'C'.repeat(k), `k=${k}`);
  }
});

test('tabela 3: de tres simbolos em diante, toda sequencia tem quem a bata', () => {
  for (const k of [3, 4, 5]) assert.equal(medir(k).semResposta, 0, `k=${k}`);
  assert.equal(medir(2).semResposta, 2);
});

test('tabela 4: a receita de Conway ganha sempre, mas nem sempre e a melhor', () => {
  for (const k of [3, 4, 5]) {
    const r = medir(k);
    assert.equal(r.receitaGanha, r.sequencias, `k=${k}: a receita deveria ganhar sempre`);
  }
  assert.ok(medir(4).receitaCerta < medir(4).sequencias);
  assert.ok(medir(5).receitaCerta < medir(5).sequencias);
  assert.equal(medir(3).receitaCerta, medir(3).sequencias);
});

const melhores3 = {
  CCC: ['KCC', '7/8'],
  KCC: ['KKC', '2/3'],
  CKC: ['CCK', '2/3'],
  KKC: ['CKK', '3/4'],
  CCK: ['KCC', '3/4'],
  KCK: ['KKC', '2/3'],
  CKK: ['CCK', '2/3'],
  KKK: ['CKK', '7/8'],
};

for (const alvo of Object.keys(melhores3)) {
  test(`tabela 5: a melhor resposta a ${alvo} e ${melhores3[alvo][0]}`, () => {
    const { resposta, p } = medir(3).melhorResposta.get(alvo);
    assert.equal(resposta, melhores3[alvo][0]);
    assert.equal(texto(p), melhores3[alvo][1]);
  });
}

test('tabela 5: a chance da melhor resposta nunca fica abaixo de 2/3', () => {
  for (const [, { p }] of medir(3).melhorResposta) {
    assert.ok(compara(p, { n: 2n, d: 3n }) >= 0, `${texto(p)}`);
  }
});

test('tabela 6: com dois simbolos nao ha ciclo nenhum', () => {
  assert.equal(acharMenorCiclo(2), null);
});

test('tabela 6: com tres simbolos o menor ciclo tem QUATRO elos', () => {
  const ciclo = acharMenorCiclo(3);
  assert.notEqual(ciclo, null);
  assert.equal(ciclo.length, 4);
  for (let i = 0; i < ciclo.length; i++) {
    const a = ciclo[i];
    const b = ciclo[(i + 1) % ciclo.length];
    assert.ok(compara(probabilidadeDeA(a, b), MEIO) > 0, `${a} nao ganha de ${b}`);
  }
});

test('tabela 6: com quatro simbolos o menor ciclo tem TRES elos', () => {
  const ciclo = acharMenorCiclo(4);
  assert.notEqual(ciclo, null);
  assert.equal(ciclo.length, 3);
  for (let i = 0; i < ciclo.length; i++) {
    const a = ciclo[i];
    const b = ciclo[(i + 1) % ciclo.length];
    assert.ok(compara(probabilidadeDeA(a, b), MEIO) > 0, `${a} nao ganha de ${b}`);
  }
});

test('tabela 7: as correlacoes de CCC e KCC', () => {
  assert.equal(correlacao('CCC', 'CCC'), 7n);
  assert.equal(correlacao('CCC', 'KCC'), 0n);
  assert.equal(correlacao('KCC', 'KCC'), 4n);
  assert.equal(correlacao('KCC', 'CCC'), 3n);
});

test('tabela 7: a formula fecha em 7/8 com essas quatro correlacoes', () => {
  // odds de KCC = (L(CCC,CCC) - L(CCC,KCC)) : (L(KCC,KCC) - L(KCC,CCC)) = 7 : 1
  const favorKCC = correlacao('CCC', 'CCC') - correlacao('CCC', 'KCC');
  const favorCCC = correlacao('KCC', 'KCC') - correlacao('KCC', 'CCC');
  assert.equal(favorKCC, 7n);
  assert.equal(favorCCC, 1n);
  assert.equal(texto(probabilidadeDeA('KCC', 'CCC')), '7/8');
});

test('fechamento: 1.300 pares varridos, zero divergencia', () => {
  const soma = COMPRIMENTOS.reduce((a, k) => a + medir(k).pares, 0);
  const div = COMPRIMENTOS.reduce((a, k) => a + medir(k).divergem, 0);
  assert.equal(soma, 1300);
  assert.equal(div, 0);
});
