export const NUMERO_WHATS = '5553981097510';
export const VAGAS_LANCAMENTO = 5;

export const PLANOS = {
  essencial: { nome: 'Essencial', entrada: 297, mensal: 79, avista: 1490 },
  profissional: { nome: 'Profissional', entrada: 497, mensal: 129, avista: 2990 },
  sistemas: { nome: 'Sistemas', aPartirDe: 2500, mensal: 249 },
};

export const SEGMENTOS = {
  cafeteria: { rotulo: 'Cafeteria', nome: 'cafeteria', para: 'o meu café', sistema: 'pedidos pelo celular', modelo: 'modelos/cafeteria/' },
  academia: { rotulo: 'Academia', nome: 'academia', para: 'a minha academia', sistema: 'agendamento de aulas', modelo: 'modelos/academia/' },
  bar: { rotulo: 'Bar', nome: 'bar', para: 'o meu bar', sistema: 'pedidos pelo celular', modelo: 'modelos/bar/' },
};

export function ofertaVisivel(vagas) {
  return vagas > 0;
}

export function textoVagas(vagas) {
  if (!ofertaVisivel(vagas)) return '';
  return `${vagas} ${vagas === 1 ? 'vaga' : 'vagas'} sem entrada`;
}

export function textosOferta(vagas) {
  if (!ofertaVisivel(vagas)) return null;
  const um = vagas === 1;
  return {
    vagas: textoVagas(vagas),
    primeiros: um ? 'O primeiro cliente fica' : `Os ${vagas} primeiros clientes ficam`,
    cta: um ? 'Ser o primeiro sem entrada' : `Ser um dos ${vagas} primeiros sem entrada`,
  };
}
