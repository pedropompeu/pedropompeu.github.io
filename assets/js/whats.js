import { NUMERO_WHATS, VAGAS_LANCAMENTO, PLANOS, SEGMENTOS } from './config.js';

const brl = (n) => `R$ ${n.toLocaleString('pt-BR')}`;
const tem = (obj, chave) => typeof chave === 'string' && Object.hasOwn(obj, chave);

export function precoTexto(planoId) {
  if (!tem(PLANOS, planoId)) throw new Error(`Plano desconhecido: ${planoId}`);
  const p = PLANOS[planoId];
  if (p.aPartirDe) return `A partir de ${brl(p.aPartirDe)} + ${brl(p.mensal)}/mês`;
  return `${brl(p.entrada)} + ${brl(p.mensal)}/mês`;
}

const OUTRO = 'Oi, Pedro! Tenho um negócio de ______ e quero ver como ficaria o meu site.';

function corpo({ segmento, plano, vagas }) {
  const outro = segmento === 'outro';
  if (segmento && !outro && !tem(SEGMENTOS, segmento)) throw new Error(`Segmento desconhecido: ${segmento}`);
  if (plano === 'lancamento') {
    const n = vagas ?? VAGAS_LANCAMENTO;
    if (n === 1) return 'Oi, Pedro! Quero ser o primeiro cliente sem entrada. Meu negócio é ______.';
    return `Oi, Pedro! Quero ser um dos ${n} primeiros clientes sem entrada. Meu negócio é ______.`;
  }
  if (plano && !tem(PLANOS, plano)) throw new Error(`Plano desconhecido: ${plano}`);
  const seg = outro ? undefined : SEGMENTOS[segmento];

  if (!plano) {
    return seg ? `Oi, Pedro! Vi o modelo de ${seg.nome} no site e quero um assim para ${seg.para}.` : OUTRO;
  }
  if (plano === 'sistemas') {
    return seg
      ? `Oi, Pedro! Quero um sistema de ${seg.sistema} para ${seg.para}.`
      : 'Oi, Pedro! Preciso de um sistema para o meu negócio. Quero ______ (ex.: agendamento, pedidos).';
  }
  const nome = PLANOS[plano].nome;
  if (seg) return `Oi, Pedro! Vi o modelo de ${seg.nome} e quero o plano ${nome} (${precoTexto(plano)}) para ${seg.para}.`;
  return `Oi, Pedro! Quero o plano ${nome} (${precoTexto(plano)}). Meu negócio é ______.`;
}

export function mensagem({ segmento, plano, origem, vagas } = {}) {
  const texto = corpo({ segmento, plano, vagas });
  return origem ? `${texto}\n\n(ref: ${origem})` : texto;
}

export function linkWhats(texto) {
  return `https://wa.me/${NUMERO_WHATS}?text=${encodeURIComponent(texto)}`;
}

export function rotuloOrigem(...partes) {
  return partes.filter(Boolean).map((p) => String(p).toLowerCase()).join('-');
}

const REF_MODELO = /\(ref: modelo-([a-z]+)\)$/;

/** Link de WhatsApp de um modelo aberto dentro da prévia da home: troca o ref para distinguir o lead (PW-022). */
export function refDaPrevia(href) {
  const prefixo = `https://wa.me/${NUMERO_WHATS}?text=`;
  if (typeof href !== 'string' || !href.startsWith(prefixo)) return href;
  let texto;
  try {
    texto = decodeURIComponent(href.slice(prefixo.length));
  } catch {
    return href;
  }
  if (!REF_MODELO.test(texto)) return href;
  return linkWhats(texto.replace(REF_MODELO, '(ref: home-previa-modelo-$1)'));
}
