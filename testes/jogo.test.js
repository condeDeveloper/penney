import test from 'node:test';
import assert from 'node:assert/strict';
import { probabilidadeDeA, maiorSufixoQueEhPrefixo, estados, transicao, tamanhoDaCadeia } from '../src/markov.js';
import { probabilidadeDeAPorConway, correlacao, respostaDeConway, sequencias } from '../src/conway.js';
import { texto, igual, compara, soma, UM, MEIO, fr } from '../src/fracao.js';

test('o maior sufixo que e prefixo', () => {
  // o sufixo 'CK' de CCK e prefixo de CKC, entao sao dois e nao um
  assert.equal(maiorSufixoQueEhPrefixo('CCK', 'CKC'), 2);
  assert.equal(maiorSufixoQueEhPrefixo('CCC', 'CCK'), 2);
  assert.equal(maiorSufixoQueEhPrefixo('KKK', 'CCC'), 0);
  assert.equal(maiorSufixoQueEhPrefixo('CCK', 'KCC'), 1);
  assert.equal(maiorSufixoQueEhPrefixo('CKC', 'CCK'), 1);
});

test('a correlacao de uma sequencia consigo mesma conta o prefixo inteiro', () => {
  assert.equal(correlacao('CCC', 'CCC'), 7n);
  assert.equal(correlacao('KCC', 'KCC'), 4n);
  assert.equal(correlacao('CKC', 'CKC'), 5n);
});

test('a correlacao de CCC com KCC e zero', () => {
  assert.equal(correlacao('CCC', 'KCC'), 0n);
  assert.equal(correlacao('KCC', 'CCC'), 3n);
});

test('a autocorrelacao e sempre pelo menos 2^(k-1)', () => {
  for (const k of [1, 2, 3, 4, 5]) {
    for (const s of sequencias(k)) {
      assert.ok(correlacao(s, s) >= 2n ** BigInt(k - 1), `${s}`);
    }
  }
});

test('a sequencia de simbolos todos iguais tem autocorrelacao maxima', () => {
  for (const k of [2, 3, 4, 5]) {
    const todos = 'C'.repeat(k);
    assert.equal(correlacao(todos, todos), 2n ** BigInt(k) - 1n);
    for (const s of sequencias(k)) {
      assert.ok(correlacao(s, s) <= correlacao(todos, todos), `${s}`);
    }
  }
});

test('as probabilidades dos dois lados somam 1', () => {
  for (const k of [2, 3, 4]) {
    const seqs = [...sequencias(k)];
    for (const a of seqs) {
      for (const b of seqs) {
        if (a === b) continue;
        assert.ok(igual(soma(probabilidadeDeA(a, b), probabilidadeDeA(b, a)), UM), `${a} x ${b}`);
      }
    }
  }
});

test('Markov e Conway concordam em todo par de 2, 3 e 4 simbolos', () => {
  for (const k of [2, 3, 4]) {
    const seqs = [...sequencias(k)];
    for (const a of seqs) {
      for (const b of seqs) {
        if (a === b) continue;
        assert.ok(
          igual(probabilidadeDeA(a, b), probabilidadeDeAPorConway(a, b)),
          `${a} x ${b}: Markov ${texto(probabilidadeDeA(a, b))}, Conway ${texto(probabilidadeDeAPorConway(a, b))}`
        );
      }
    }
  }
});

test('KCC ganha de CCC com 7/8, o caso classico', () => {
  assert.equal(texto(probabilidadeDeA('KCC', 'CCC')), '7/8');
  assert.equal(texto(probabilidadeDeA('CCC', 'KCC')), '1/8');
});

test('os outros casos classicos de tres simbolos', () => {
  assert.equal(texto(probabilidadeDeA('KCC', 'CCK')), '3/4');
  assert.equal(texto(probabilidadeDeA('CCK', 'CKK')), '2/3');
  assert.equal(texto(probabilidadeDeA('CKK', 'KKC')), '3/4');
  assert.equal(texto(probabilidadeDeA('KKC', 'KCC')), '2/3');
});

test('a sequencia espelhada tem a probabilidade espelhada', () => {
  // trocar C por K nas duas nao muda nada: a moeda e honesta
  const trocar = (s) => [...s].map((c) => (c === 'C' ? 'K' : 'C')).join('');
  for (const k of [2, 3, 4]) {
    const seqs = [...sequencias(k)];
    for (const a of seqs) {
      for (const b of seqs) {
        if (a === b) continue;
        assert.ok(
          igual(probabilidadeDeA(a, b), probabilidadeDeA(trocar(a), trocar(b))),
          `${a} x ${b}`
        );
      }
    }
  }
});

test('contra si mesma e erro, nao empate', () => {
  assert.throws(() => probabilidadeDeA('CCC', 'CCC'));
  assert.throws(() => probabilidadeDeAPorConway('CCC', 'CCC'));
});

test('os estados da cadeia incluem a string vazia', () => {
  for (const k of [2, 3, 4]) {
    assert.ok(estados('C'.repeat(k), 'K'.repeat(k)).includes(''));
  }
});

test('a cadeia cresce com o comprimento das sequencias', () => {
  const tamanhos = [2, 3, 4, 5].map((k) => tamanhoDaCadeia('C'.repeat(k), 'K' + 'C'.repeat(k - 1)));
  for (let i = 1; i < tamanhos.length; i++) {
    assert.ok(tamanhos[i] > tamanhos[i - 1], `${tamanhos}`);
  }
});

test('a transicao reconhece a vitoria', () => {
  assert.equal(transicao('CC', 'C', 'CCC', 'KCC'), 'A');
  assert.equal(transicao('KC', 'C', 'CCC', 'KCC'), 'B');
});

test('a receita de Conway sempre ganha, de 3 a 5 simbolos', () => {
  for (const k of [3, 4, 5]) {
    for (const alvo of sequencias(k)) {
      const r = respostaDeConway(alvo);
      assert.ok(compara(probabilidadeDeA(r, alvo), MEIO) > 0, `${r} nao ganhou de ${alvo}`);
    }
  }
});

test('em duas jogadas a receita de Conway nem sempre ganha', () => {
  // com k=2 ha empates, e a receita nao tem como fugir deles
  let empatou = 0;
  for (const alvo of sequencias(2)) {
    const r = respostaDeConway(alvo);
    if (igual(probabilidadeDeA(r, alvo), MEIO)) empatou++;
  }
  assert.equal(empatou, 2);
});

test('nenhuma probabilidade fica fora do intervalo de 0 a 1', () => {
  for (const k of [2, 3, 4]) {
    const seqs = [...sequencias(k)];
    for (const a of seqs) {
      for (const b of seqs) {
        if (a === b) continue;
        const p = probabilidadeDeA(a, b);
        assert.ok(compara(p, fr(0n)) >= 0 && compara(p, UM) <= 0, `${a} x ${b}: ${texto(p)}`);
      }
    }
  }
});
