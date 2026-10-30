#!/usr/bin/env node
// O medidor: roda as varreduras e imprime as tabelas que vao para o README.
// Nenhum numero do README e digitado a mao; todos saem daqui.

import { probabilidadeDeA, tamanhoDaCadeia } from '../src/markov.js';
import { probabilidadeDeAPorConway, respostaDeConway, sequencias, correlacao } from '../src/conway.js';
import { texto, igual, compara, fr, MEIO, paraNumero } from '../src/fracao.js';

const br = (x) => x.toLocaleString('pt-BR');

export const COMPRIMENTOS = [2, 3, 4, 5];

const guardado = new Map();

/** Varre todos os pares ordenados de sequencias de comprimento k. */
export function medir(k) {
  if (guardado.has(k)) return guardado.get(k);
  const seqs = [...sequencias(k)];
  let pares = 0;
  let divergem = 0;
  let empates = 0;
  let maiorVantagem = fr(0n);
  let parMaisDesigual = null;
  const vence = new Map(); // quem bate quem
  const exemplos = [];

  for (const a of seqs) {
    for (const b of seqs) {
      if (a === b) continue;
      pares++;
      const m = probabilidadeDeA(a, b);
      const c = probabilidadeDeAPorConway(a, b);
      if (!igual(m, c)) {
        divergem++;
        if (exemplos.length < 5) exemplos.push({ a, b, markov: texto(m), conway: texto(c) });
      }
      if (igual(m, MEIO)) empates++;
      if (compara(m, maiorVantagem) > 0) {
        maiorVantagem = m;
        parMaisDesigual = { a, b, p: texto(m) };
      }
      if (compara(m, MEIO) > 0) {
        if (!vence.has(a)) vence.set(a, []);
        vence.get(a).push(b);
      }
    }
  }

  // para cada sequencia, existe quem a bata?
  let semResposta = 0;
  const melhorResposta = new Map();
  for (const alvo of seqs) {
    let melhor = null;
    let melhorP = fr(0n);
    for (const outra of seqs) {
      if (outra === alvo) continue;
      const p = probabilidadeDeA(outra, alvo);
      if (compara(p, melhorP) > 0) {
        melhorP = p;
        melhor = outra;
      }
    }
    if (compara(melhorP, MEIO) <= 0) semResposta++;
    melhorResposta.set(alvo, { resposta: melhor, p: melhorP });
  }

  // a receita de Conway acerta a melhor resposta?
  let receitaCerta = 0;
  let receitaGanha = 0;
  for (const alvo of seqs) {
    const r = respostaDeConway(alvo);
    const p = probabilidadeDeA(r, alvo);
    if (compara(p, MEIO) > 0) receitaGanha++;
    if (igual(p, melhorResposta.get(alvo).p)) receitaCerta++;
  }

  const resultado = {
    k,
    sequencias: seqs.length,
    pares,
    divergem,
    empates,
    semResposta,
    receitaCerta,
    receitaGanha,
    maiorVantagem: texto(maiorVantagem),
    parMaisDesigual,
    melhorResposta,
    exemplos,
    estadosMax: Math.max(...seqs.map((a) => Math.max(...seqs.filter((b) => b !== a).map((b) => tamanhoDaCadeia(a, b))))),
  };
  guardado.set(k, resultado);
  return resultado;
}

/**
 * O MENOR ciclo de "bate": A bate B bate C ... bate A. Um ciclo e a prova de que
 * "ser melhor que" nao e uma ordem: nao da para enfileirar as sequencias da pior
 * para a melhor. Procura por tamanho crescente, entao o primeiro achado e minimo.
 */
export function acharMenorCiclo(k, teto = 6) {
  const seqs = [...sequencias(k)];
  const bate = (x, y) => compara(probabilidadeDeA(x, y), MEIO) > 0;

  for (let tamanho = 3; tamanho <= teto; tamanho++) {
    const caminho = [];
    const anda = () => {
      if (caminho.length === tamanho) {
        return bate(caminho[caminho.length - 1], caminho[0]);
      }
      for (const s of seqs) {
        if (caminho.includes(s)) continue;
        if (caminho.length > 0 && !bate(caminho[caminho.length - 1], s)) continue;
        caminho.push(s);
        if (anda()) return true;
        caminho.pop();
      }
      return false;
    };
    if (anda()) return caminho.slice();
  }
  return null;
}

function imprimir() {
  console.log('\n== Tabela 1: a cadeia de Markov contra a formula de Conway ==');
  console.log('  k | sequencias | pares | divergencias | estados da maior cadeia');
  for (const k of COMPRIMENTOS) {
    const r = medir(k);
    console.log(
      `  ${k} | ${String(r.sequencias).padStart(10)} | ${br(r.pares).padStart(5)} | ${String(r.divergem).padStart(12)} | ${r.estadosMax}`
    );
    if (r.divergem > 0) {
      console.error(`DIVERGENCIA em k=${k}: ${JSON.stringify(r.exemplos)}`);
      process.exit(1);
    }
  }

  console.log('\n== Tabela 2: o jogo e justo? ==');
  console.log('  k | pares | empates (50%) | maior vantagem | em que par');
  for (const k of COMPRIMENTOS) {
    const r = medir(k);
    const p = r.parMaisDesigual;
    console.log(
      `  ${k} | ${br(r.pares).padStart(5)} | ${String(r.empates).padStart(13)} | ${r.maiorVantagem.padStart(14)} | ${p.a} ganha de ${p.b}`
    );
  }

  console.log('\n== Tabela 3: toda sequencia tem quem a bata? ==');
  console.log('  k | sequencias | sem resposta vencedora');
  for (const k of COMPRIMENTOS) {
    const r = medir(k);
    console.log(`  ${k} | ${String(r.sequencias).padStart(10)} | ${r.semResposta}`);
  }
  console.log('  (zero quer dizer que o segundo jogador sempre tem como ganhar)');

  console.log('\n== Tabela 4: a receita de Conway acerta a melhor resposta? ==');
  console.log('  k | sequencias | a receita ganha | a receita e a MELHOR');
  for (const k of COMPRIMENTOS) {
    const r = medir(k);
    console.log(
      `  ${k} | ${String(r.sequencias).padStart(10)} | ${String(r.receitaGanha).padStart(15)} | ${r.receitaCerta}`
    );
  }

  console.log('\n== Tabela 5: a melhor resposta a cada sequencia de 3 ==');
  console.log('  escolha do 1o | melhor resposta | chance da resposta | em decimal');
  {
    const r = medir(3);
    for (const [alvo, { resposta, p }] of r.melhorResposta) {
      console.log(
        `  ${alvo.padEnd(13)} | ${resposta.padEnd(15)} | ${texto(p).padStart(18)} | ${paraNumero(p).toFixed(4)}`
      );
    }
  }

  console.log('\n== Tabela 6: o menor ciclo, que mostra a nao transitividade ==');
  for (const k of [2, 3, 4]) {
    const ciclo = acharMenorCiclo(k);
    if (!ciclo) {
      console.log(`  k=${k}: nenhum ciclo ate seis elos`);
      continue;
    }
    console.log(`  k=${k}: o menor ciclo tem ${ciclo.length} elos`);
    for (let i = 0; i < ciclo.length; i++) {
      const a = ciclo[i];
      const b = ciclo[(i + 1) % ciclo.length];
      console.log(`    ${a} ganha de ${b} com ${texto(probabilidadeDeA(a, b))}`);
    }
  }

  console.log('\n== Tabela 7: as correlacoes de Conway de CCC e KCC ==');
  for (const [a, b] of [['CCC', 'CCC'], ['CCC', 'KCC'], ['KCC', 'KCC'], ['KCC', 'CCC']]) {
    console.log(`  L(${a}, ${b}) = ${correlacao(a, b)}`);
  }
  console.log(`  logo KCC ganha de CCC com ${texto(probabilidadeDeA('KCC', 'CCC'))}`);

  console.log('\n== Fechamento ==');
  const soma = COMPRIMENTOS.reduce((a, k) => a + medir(k).pares, 0);
  const div = COMPRIMENTOS.reduce((a, k) => a + medir(k).divergem, 0);
  const sem = COMPRIMENTOS.reduce((a, k) => a + medir(k).semResposta, 0);
  console.log(`  pares varridos ................... ${br(soma)}`);
  console.log(`  divergencias Markov x Conway ..... ${div}`);
  console.log(`  sequencias sem resposta vencedora  ${sem}`);
  console.log('');
  if (div > 0) process.exit(1);
}

if (process.argv[1]?.endsWith('medidor.js')) imprimir();
