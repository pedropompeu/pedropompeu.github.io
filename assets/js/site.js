import { VAGAS_LANCAMENTO, SEGMENTOS, textosOferta } from './config.js';
import { mensagem, linkWhats, rotuloOrigem, refDaPrevia } from './whats.js';
import { pesoPorDistancia, inclinacao, suportaGiroscopio, escalaComputador } from './efeitos.js';

const TEMPO_LIMITE_MS = 8000;
const MENSAGEM_ERRO = 'A prévia não carregou. Confira a internet e toque em Tentar de novo.';

const $ = (sel, raiz = document) => raiz.querySelector(sel);
const $$ = (sel, raiz = document) => Array.from(raiz.querySelectorAll(sel));
const soCelular = () => window.matchMedia('(max-width: 1023px)').matches;

/* ---------- Prévia (estado do iframe) ---------- */
const previa = {
  secao: null,
  frame: null,
  status: null,
  tentar: null,
  timer: null,
  segmento: 'cafeteria',
  carregou: false,
};

function nomeDe(seg) {
  return SEGMENTOS[seg] ? SEGMENTOS[seg].nome : seg;
}

function modoAtual() {
  return previa.secao.dataset.modo === 'computador' ? 'computador' : 'celular';
}

function textoPronto() {
  return `Modelo de ${nomeDe(previa.segmento)} no ${modoAtual()}.`;
}

function definirEstado(estado, texto) {
  previa.secao.dataset.estado = estado;
  if (texto) previa.status.textContent = texto;
  previa.frame.setAttribute('aria-busy', estado === 'carregando' ? 'true' : 'false');
  if (previa.tentar) previa.tentar.hidden = estado !== 'erro';
}

function carregar(texto) {
  const url = previa.frame.dataset.src;
  if (!url) return;
  clearTimeout(previa.timer);
  definirEstado('carregando', texto || `Montando o site da ${nomeDe(previa.segmento)}`);
  previa.carregou = true;
  previa.frame.loading = 'eager'; // lazy atrasaria o load e estouraria o limite de 8 s
  previa.timer = setTimeout(() => definirEstado('erro', MENSAGEM_ERRO), TEMPO_LIMITE_MS);
  if (previa.frame.getAttribute('src') === url) {
    // Mesma URL: atribuir src de novo não recarrega; replace() recarrega sem criar histórico.
    try {
      previa.frame.contentWindow.location.replace(url);
      return;
    } catch (erro) {
      console.error(erro);
    }
  }
  previa.frame.src = url;
}

// O load é do modelo pedido agora? Um load atrasado do modelo anterior não pode marcar "pronto" (PW-018).
function carregouOAlvo() {
  try {
    const doc = previa.frame.contentDocument;
    if (!doc) return true; // sem acesso ao documento, não há como conferir
    const alvo = new URL(previa.frame.dataset.src, document.baseURI);
    return new URL(doc.URL).pathname === alvo.pathname;
  } catch (erro) {
    return true;
  }
}

// Links de WhatsApp do modelo dentro do iframe ganham ref próprio (PW-022). Mesma origem; se falhar, fica o ref original.
function marcarRefDaPrevia() {
  try {
    const doc = previa.frame.contentDocument;
    if (!doc) return;
    $$('a[href^="https://wa.me/"]', doc).forEach((a) => {
      a.href = refDaPrevia(a.getAttribute('href'));
    });
  } catch (erro) {
    console.error(erro);
  }
}

function initPrevia() {
  previa.secao = $('#previa');
  previa.frame = $('#previa-frame');
  previa.status = $('#previa-status');
  if (!previa.secao || !previa.frame || !previa.status) return;

  definirEstado('vazio', 'Toque num negócio para ver o modelo.');

  previa.tentar = document.createElement('button');
  previa.tentar.type = 'button';
  previa.tentar.className = 'btn-vidro previa-tentar';
  previa.tentar.textContent = 'Tentar de novo';
  previa.tentar.hidden = true;
  previa.status.after(previa.tentar);
  previa.tentar.addEventListener('click', () => carregar());

  previa.frame.addEventListener('load', () => {
    if (!previa.carregou || !carregouOAlvo()) return;
    clearTimeout(previa.timer);
    marcarRefDaPrevia();
    definirEstado('pronto', textoPronto());
  });

  // No computador a prévia carrega quando entra na tela; no celular, só após o toque num segmento.
  if (!soCelular() && 'IntersectionObserver' in window) {
    const obs = new IntersectionObserver((entradas) => {
      if (entradas.some((e) => e.isIntersecting)) {
        obs.disconnect();
        if (!previa.carregou) carregar();
      }
    }, { rootMargin: '200px' });
    obs.observe(previa.secao);
  } else if (!soCelular()) {
    carregar();
  }

  iniciarAbas();
}

function iniciarAbas() {
  const abas = $$('[role="tab"]', previa.secao);
  const celular = $('#celular');

  const ajustarEscala = () => {
    if (modoAtual() !== 'computador' || !celular) {
      previa.frame.style.removeProperty('--escala');
      return;
    }
    const estilo = getComputedStyle(celular);
    const padding = parseFloat(estilo.paddingLeft) || 0;
    previa.frame.style.setProperty('--escala', String(escalaComputador(celular.clientWidth - 2 * padding)));
  };

  const selecionar = (aba, foco) => {
    abas.forEach((a) => {
      const ativa = a === aba;
      a.setAttribute('aria-selected', String(ativa));
      a.classList.toggle('is-ativo', ativa);
      a.tabIndex = ativa ? 0 : -1;
    });
    previa.secao.dataset.modo = aba.dataset.modo;
    if (foco) aba.focus();
    ajustarEscala();
    if (previa.secao.dataset.estado === 'pronto') previa.status.textContent = textoPronto();
  };

  abas.forEach((aba) => {
    aba.addEventListener('click', () => selecionar(aba, false));
    aba.addEventListener('keydown', (ev) => {
      const i = abas.indexOf(aba);
      let alvo = null;
      if (ev.key === 'ArrowRight') alvo = abas[(i + 1) % abas.length];
      else if (ev.key === 'ArrowLeft') alvo = abas[(i - 1 + abas.length) % abas.length];
      else if (ev.key === 'Home') alvo = abas[0];
      else if (ev.key === 'End') alvo = abas[abas.length - 1];
      if (!alvo) return;
      ev.preventDefault();
      selecionar(alvo, true);
    });
  });

  const inicial = abas.find((a) => a.getAttribute('aria-selected') === 'true') || abas[0];
  if (inicial) selecionar(inicial, false);

  if (celular && 'ResizeObserver' in window) new ResizeObserver(ajustarEscala).observe(celular);
}

/* ---------- Segmentos ---------- */
function initSegmentos() {
  const botoes = $$('button.segmento[data-segmento]');
  const quero = $('#previa-quero');
  const abrir = $('#previa-abrir');
  const planos = $$('.plano-cta');

  const atualizarLinks = (seg) => {
    if (quero) {
      const texto = mensagem({ segmento: seg, origem: rotuloOrigem('home', 'previa', seg) });
      quero.href = linkWhats(texto);
    }
    planos.forEach((a) => {
      const plano = a.dataset.plano;
      const texto = mensagem({ segmento: seg, plano, origem: rotuloOrigem('home', seg, plano) });
      a.href = linkWhats(texto);
    });
  };

  const marcar = (botao) => {
    botoes.forEach((b) => {
      const ativo = b === botao;
      b.classList.toggle('is-ativo', ativo);
      b.setAttribute('aria-pressed', String(ativo));
    });
  };

  botoes.forEach((botao) => {
    botao.addEventListener('click', () => {
      const seg = botao.dataset.segmento;
      if (!SEGMENTOS[seg]) return;
      marcar(botao);
      atualizarLinks(seg);
      if (abrir) abrir.href = botao.dataset.modelo;
      if (previa.frame) {
        previa.segmento = seg;
        previa.frame.dataset.src = botao.dataset.modelo;
        carregar(previa.carregou ? `Trocando para ${nomeDe(seg)}` : `Montando o site da ${nomeDe(seg)}`);
      }
      if (soCelular()) {
        const alvo = $('#previa');
        if (alvo) alvo.scrollIntoView({ behavior: 'auto', block: 'start' });
      }
    });
  });

  // No celular a prévia começa vazia: nenhum segmento aparece como escolhido.
  const inicial = botoes.find((b) => b.dataset.segmento === 'cafeteria');
  if (inicial && !soCelular()) marcar(inicial);
}

/* ---------- Oferta de lançamento ---------- */
function initOferta() {
  const oferta = $('#oferta');
  if (!oferta) return;
  const textos = textosOferta(VAGAS_LANCAMENTO);
  if (!textos) {
    oferta.remove();
    return;
  }
  const escrever = (sel, texto) => {
    const el = $(sel);
    if (el) el.textContent = texto;
  };
  escrever('#oferta-vagas', textos.vagas);
  escrever('#oferta-primeiros', textos.primeiros);
  escrever('#oferta-cta span', textos.cta);
  const cta = $('#oferta-cta');
  if (cta) {
    cta.href = linkWhats(mensagem({ plano: 'lancamento', vagas: VAGAS_LANCAMENTO, origem: 'home-lancamento' }));
  }
}

/* ---------- Movimento ---------- */
function initMovimento() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.classList.add('sem-movimento');
    return;
  }
  for (const init of [moverManchas, pesoDoTitulo, inclinarCelular, digitarEndereco]) {
    try {
      init();
    } catch (erro) {
      console.error(erro);
    }
  }
}

function moverManchas() {
  const manchas = $$('.mancha');
  if (!manchas.length) return;
  const fatores = [0.04, -0.06, 0.03];
  let ponto = null;
  let agendado = false;
  window.addEventListener('pointermove', (ev) => {
    ponto = { x: ev.clientX, y: ev.clientY };
    if (agendado) return;
    agendado = true;
    requestAnimationFrame(() => {
      agendado = false;
      const nx = (ponto.x / window.innerWidth - 0.5) * 2;
      const ny = (ponto.y / window.innerHeight - 0.5) * 2;
      manchas.forEach((m, i) => {
        const f = fatores[i % fatores.length] * 1000;
        m.style.transform = `translate(${(nx * f).toFixed(1)}px, ${(ny * f).toFixed(1)}px)`;
      });
    });
  }, { passive: true });
}

function pesoDoTitulo() {
  const h1 = $('#titulo-home');
  if (!h1) return;
  const original = h1.textContent.trim();
  const leitura = document.createElement('span');
  leitura.className = 'sr-only';
  leitura.textContent = original;

  const visual = document.createDocumentFragment();
  const letras = [];
  original.split(' ').forEach((palavra, i, todas) => {
    const p = document.createElement('span');
    p.className = 'palavra';
    for (const ch of palavra) {
      const l = document.createElement('span');
      l.className = 'letra';
      l.setAttribute('aria-hidden', 'true');
      l.textContent = ch;
      p.append(l);
      letras.push(l);
    }
    visual.append(p);
    if (i < todas.length - 1) visual.append(document.createTextNode(' '));
  });
  h1.textContent = '';
  h1.append(leitura, visual);

  let ultimo = null;
  let agendado = false;
  const aplicar = () => {
    agendado = false;
    if (!ultimo) {
      letras.forEach((l) => l.style.removeProperty('font-variation-settings'));
      return;
    }
    const { x, y } = ultimo;
    const rects = letras.map((l) => l.getBoundingClientRect());
    letras.forEach((l, i) => {
      const r = rects[i];
      const d = Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2));
      l.style.fontVariationSettings = `"wght" ${Math.round(pesoPorDistancia(d))}`;
    });
  };
  const agendar = () => {
    if (agendado) return;
    agendado = true;
    requestAnimationFrame(aplicar);
  };
  window.addEventListener('pointermove', (ev) => {
    ultimo = { x: ev.clientX, y: ev.clientY };
    agendar();
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => {
    ultimo = null;
    agendar();
  });
}

function inclinarCelular() {
  const celular = $('#celular');
  if (!celular) return;
  const definir = (nx, ny) => {
    const { rotY, rotX } = inclinacao(nx, ny);
    celular.style.setProperty('--cel-rot-y', `${rotY}deg`);
    celular.style.setProperty('--cel-rot-x', `${rotX}deg`);
  };

  let ligado = false;
  const girar = (ev) => {
    if (ev.gamma == null || ev.beta == null) return;
    definir(ev.gamma / 45, (ev.beta - 45) / 45);
  };
  const ligarGiroscopio = () => {
    if (ligado) return;
    ligado = true;
    window.addEventListener('deviceorientation', girar, { passive: true });
  };

  const modo = suportaGiroscopio(window);
  if (modo === 'sim' && soCelular()) {
    ligarGiroscopio();
  }
  // iOS ('permissao'): inclinação desligada de propósito, sem pedir acesso aos sensores.

  let agendado = false;
  let ponto = null;
  window.addEventListener('pointermove', (ev) => {
    if (ev.pointerType === 'touch' || ligado) return; // com giroscópio ligado, o sensor manda (PW-018)
    ponto = ev;
    if (agendado) return;
    agendado = true;
    requestAnimationFrame(() => {
      agendado = false;
      const r = celular.getBoundingClientRect();
      const nx = (ponto.clientX - (r.left + r.width / 2)) / window.innerWidth * 2;
      const ny = (ponto.clientY - (r.top + r.height / 2)) / window.innerHeight * 2;
      definir(nx, ny);
    });
  }, { passive: true });
}

function digitarEndereco() {
  const alvo = $('#hero-endereco');
  if (!alvo) return;
  const texto = alvo.textContent;
  alvo.style.minWidth = `${texto.length}ch`; // reserva a largura final
  alvo.textContent = '';
  let i = 0;
  const passo = () => {
    i += 1;
    alvo.textContent = texto.slice(0, i);
    if (i < texto.length) setTimeout(passo, 70);
  };
  setTimeout(passo, 400);
}

/* ---------- Botão fixo: some sobre outros botões de WhatsApp (prévia e rodapé) ---------- */
function initBotaoFixo() {
  const fixo = $('#whats-fixo');
  const alvos = $$('.previa-acoes, .rodape-acoes');
  if (!fixo || !alvos.length || !('IntersectionObserver' in window)) return;
  const visiveis = new Set();
  const io = new IntersectionObserver((entradas) => {
    entradas.forEach((e) => (e.isIntersecting ? visiveis.add(e.target) : visiveis.delete(e.target)));
    const oculto = visiveis.size > 0;
    fixo.toggleAttribute('data-oculto', oculto);
    fixo.toggleAttribute('inert', oculto);
    if (oculto) fixo.setAttribute('aria-hidden', 'true');
    else fixo.removeAttribute('aria-hidden');
  });
  alvos.forEach((alvo) => io.observe(alvo));
}

/* ---------- Início ---------- */
function iniciar() {
  for (const init of [initPrevia, initSegmentos, initOferta, initMovimento, initBotaoFixo]) {
    try {
      init();
    } catch (erro) {
      console.error(erro);
    }
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
else iniciar();
