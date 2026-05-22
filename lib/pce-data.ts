import type { PCEStats } from './pce-sheets';
import { PCE_PARTICIPANTS } from './pce-participants';

function computeSegmentos() {
  const map = new Map<string, number>();
  const skip = new Set(['ainda não tenho', 'não tenho empresa', 'não tenho', '']);
  for (const p of PCE_PARTICIPANTS) {
    const seg = p.segmento.trim();
    if (!skip.has(seg.toLowerCase())) {
      map.set(seg, (map.get(seg) ?? 0) + 1);
    }
  }
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);
}

export const PCE_STATS: PCEStats = {
  totalRespondentes: 100,
  dispostosMudar: 82,
  clarezaMedia: 2.9,
  dependenciaTotal: 60,

  faseEmpresa: [
    { label: 'Empresa estruturando crescimento', count: 36 },
    { label: 'Já vendo mas instável', count: 29 },
    { label: 'Ideia / começando agora', count: 16 },
    { label: 'Empresa consolidada / escalando', count: 8 },
    { label: 'Empresa em crescimento acelerado', count: 7 },
  ],

  faturamento: [
    { label: 'Até R$5 mil', count: 37 },
    { label: 'R$5 mil a R$10 mil', count: 18 },
    { label: 'Ainda não faturo', count: 13 },
    { label: 'mais de R$50 mil', count: 9 },
    { label: 'R$10 mil a R$20 mil', count: 8 },
    { label: 'R$30 mil a R$50 mil', count: 8 },
    { label: 'R$20 mil a R$30 mil', count: 2 },
  ],

  faixaEtaria: [
    { label: 'de 41 a 50 anos', count: 39 },
    { label: 'de 31 a 40 anos', count: 36 },
    { label: 'de 51 a 60 anos', count: 13 },
    { label: 'de 20 a 30 anos', count: 7 },
    { label: 'acima de 60 anos', count: 1 },
  ],

  equipe: [
    { label: 'Sim, até 3 pessoas', count: 39 },
    { label: 'Não, trabalho sozinho(a)', count: 28 },
    { label: 'De 4 a 10 pessoas', count: 15 },
    { label: '11 a 30 pessoas', count: 6 },
    { label: 'mais de 30 pessoas', count: 4 },
  ],

  // multi-select: contagem de menções (acima de 100 por ser múltipla escolha)
  canaisVenda: [
    { label: 'Indicação', count: 77 },
    { label: 'Redes sociais', count: 58 },
    { label: 'Parcerias', count: 32 },
    { label: 'Outros', count: 29 },
    { label: 'Tráfego pago', count: 27 },
    { label: 'Equipe comercial', count: 10 },
  ],

  // escala 0-5
  clareza: [
    { label: '0', count: 1 },
    { label: '1', count: 10 },
    { label: '2', count: 9 },
    { label: '3', count: 51 },
    { label: '4', count: 20 },
    { label: '5', count: 1 },
  ],

  // multi-select: contagem de menções
  desafios: [
    { label: 'Vendas (fechamento, previsibilidade, conversão)', count: 58 },
    { label: 'Marketing (posicionamento, conteúdo, demanda)', count: 57 },
    { label: 'Gestão (processos, organização, operação)', count: 47 },
    { label: 'Produto (clareza de oferta, diferenciação, preço)', count: 38 },
    { label: 'Falta de tempo / sobrecarga', count: 38 },
    { label: 'Liderança (time, delegação, desenvolvimento)', count: 21 },
  ],

  investimento: [
    { label: 'Invisto pouco, de forma pontual', count: 34 },
    { label: 'Invisto com certa frequência', count: 30 },
    { label: 'Não invisto', count: 15 },
    { label: 'Invisto de forma estruturada', count: 11 },
  ],

  cidades: [
    { label: 'Lisboa', count: 25 },
    { label: 'Porto', count: 4 },
    { label: 'Setúbal', count: 3 },
    { label: 'Sintra', count: 3 },
    { label: 'Cascais', count: 3 },
    { label: 'Leiria', count: 3 },
  ],

  // escala 1-5
  satisfacaoAmbiente: [
    { label: '1', count: 13 },
    { label: '2', count: 27 },
    { label: '3', count: 38 },
    { label: '4', count: 7 },
    { label: '5', count: 1 },
  ],

  dependencia: [
    { label: 'Sim, totalmente', count: 60 },
    { label: 'Parcialmente', count: 22 },
    { label: 'Não, tenho estrutura independente', count: 5 },
  ],

  segmentos: computeSegmentos(),

  fetchedAt: new Date().toISOString(),
};
