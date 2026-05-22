export type PCEStats = {
  totalRespondentes: number;
  dispostosMudar: number;
  clarezaMedia: number;
  dependenciaTotal: number;
  faseEmpresa: { label: string; count: number }[];
  faturamento: { label: string; count: number }[];
  faixaEtaria: { label: string; count: number }[];
  equipe: { label: string; count: number }[];
  canaisVenda: { label: string; count: number }[];
  clareza: { label: string; count: number }[];
  desafios: { label: string; count: number }[];
  investimento: { label: string; count: number }[];
  cidades: { label: string; count: number }[];
  satisfacaoAmbiente: { label: string; count: number }[];
  dependencia: { label: string; count: number }[];
  segmentos: { label: string; count: number }[];
  fetchedAt: string;
};
