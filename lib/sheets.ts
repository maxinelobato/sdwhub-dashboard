import { fetcher } from './fetcher';

/**
 * sheets.ts — leitura do Google Sheets publicado em CSV.
 *
 * O CSV original do Typebot SDW.hub tem as colunas (ordem):
 *   Nome, Whatsapp, Email, Rede Social,
 *   "1. Qual sua principal atuação hoje?",
 *   "2. Qual o principal mercado de atuação da sua empresa?",
 *   "3. Sua empresa já está em operação?",
 *   "4. Qual o faturamento médio mensal do seu negócio hoje?",
 *   "5. Quantas pessoas fazem parte da sua operação hoje?",
 *   "6. Qual seu principal objetivo ao participar do SDW Belo Horizonte?",
 *   "7. Você pretende participar do evento",
 *   "8. Por que você acredita que deveria participar do SDW Belo Horizonte?"
 *
 * Para que filtros por dia funcionem, adicione no Typebot/Apps Script
 * uma PRIMEIRA coluna chamada `Timestamp` (ISO ou epoch ms).
 */

export type Lead = {
  rowIndex: number;
  /** Disponível apenas se a planilha tiver coluna Timestamp/Data. */
  timestamp: Date | null;
  nome: string;
  whatsapp: string;
  email: string;
  redeSocial: string;
  atuacao: string;
  mercado: string;
  emOperacao: string;
  faturamento: string;
  tamanhoEquipe: string;
  objetivo: string;
  pretendeParticipar: string;
  motivacao: string;
  raw: Record<string, string>;
};

const TIMESTAMP_COLUMN_CANDIDATES = ['timestamp', 'data', 'date', 'created_at', 'created', 'datetime'];

/** Parser CSV resiliente: respeita aspas duplas, vírgulas em campos e quebras de linha dentro de aspas. */
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let current: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      current.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && next === '\n') i++;
      current.push(field);
      rows.push(current);
      current = [];
      field = '';
    } else {
      field += char;
    }
  }

  if (field.length > 0 || current.length > 0) {
    current.push(field);
    rows.push(current);
  }

  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

function toDate(raw: string): Date | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const asNumber = Number(trimmed);
  if (!Number.isNaN(asNumber) && asNumber > 1_000_000_000) {
    const ms = asNumber < 1e12 ? asNumber * 1000 : asNumber;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  // BR format DD/MM/YYYY must be checked before new Date() — otherwise
  // "8/5/2026" is misread as August 5 (MM/DD) instead of May 8 (DD/MM).
  const brMatch = trimmed.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/,
  );
  if (brMatch) {
    const [, dd, mm, yyyy, hh = '0', min = '0', ss = '0'] = brMatch;
    const d = new Date(
      Number(yyyy),
      Number(mm) - 1,
      Number(dd),
      Number(hh),
      Number(min),
      Number(ss),
    );
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const direct = new Date(trimmed);
  if (!Number.isNaN(direct.getTime())) return direct;

  return null;
}

export type ParsedLeads = {
  leads: Lead[];
  /** A coluna Timestamp/Data foi detectada no header. */
  hasTimestamp: boolean;
  /** Quantidade de linhas com timestamp efetivamente preenchido e parseável. */
  withTimestamp: number;
  totalRows: number;
  fetchedAt: Date;
};

export function rowsToLeads(rows: string[][]): ParsedLeads {
  if (rows.length === 0) {
    return {
      leads: [],
      hasTimestamp: false,
      withTimestamp: 0,
      totalRows: 0,
      fetchedAt: new Date(),
    };
  }

  const headers = rows[0].map((h) => h.trim());
  const headersLower = headers.map((h) => h.toLowerCase());

  const tsIdx = headersLower.findIndex((h) =>
    TIMESTAMP_COLUMN_CANDIDATES.some((c) => h === c || h.includes(c)),
  );
  const hasTimestamp = tsIdx >= 0;

  const colIndex = (label: string) =>
    headersLower.findIndex((h) => h.includes(label.toLowerCase()));

  const idxNome = colIndex('nome');
  const idxWhats = colIndex('whatsapp');
  const idxEmail = colIndex('email');
  const idxRede = colIndex('rede social');
  const idxAtuacao = headersLower.findIndex((h) => h.includes('atuação'));
  const idxMercado = headersLower.findIndex((h) => h.includes('mercado'));
  const idxOperacao = headersLower.findIndex((h) => h.includes('operação'));
  const idxFaturamento = headersLower.findIndex((h) => h.includes('faturamento'));
  const idxEquipe = headersLower.findIndex((h) => h.includes('pessoas') || h.includes('operação hoje'));
  const idxObjetivo = headersLower.findIndex((h) => h.includes('objetivo'));
  const idxPretende = headersLower.findIndex((h) => h.includes('pretende'));
  const idxMotivo = headersLower.findIndex((h) => h.includes('acredita') || h.includes('motivo'));

  const leads: Lead[] = rows.slice(1).map((row, i) => {
    const cell = (idx: number) => (idx >= 0 ? row[idx]?.trim() ?? '' : '');
    const raw: Record<string, string> = {};
    headers.forEach((h, j) => {
      raw[h] = row[j] ?? '';
    });

    return {
      rowIndex: i,
      timestamp: hasTimestamp ? toDate(row[tsIdx] ?? '') : null,
      nome: cell(idxNome),
      whatsapp: cell(idxWhats),
      email: cell(idxEmail),
      redeSocial: cell(idxRede),
      atuacao: cell(idxAtuacao),
      mercado: cell(idxMercado),
      emOperacao: cell(idxOperacao),
      faturamento: cell(idxFaturamento),
      tamanhoEquipe: cell(idxEquipe),
      objetivo: cell(idxObjetivo),
      pretendeParticipar: cell(idxPretende),
      motivacao: cell(idxMotivo),
      raw,
    };
  });

  const withTimestamp = leads.filter((l) => l.timestamp !== null).length;
  return {
    leads,
    hasTimestamp,
    withTimestamp,
    totalRows: leads.length,
    fetchedAt: new Date(),
  };
}

/** Endpoint padrão: Sheets publicado via "Publicar na web > CSV". */
export const DEFAULT_LEADS_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vTfpU4XEsLcqY7jYF74-AKSzi9FGWfF-EuNmyp4D1y91Sob-no3SrNnoRQu8wcASwp9Cn9RKfAUhoBx/pub?gid=1054517737&single=true&output=csv';

export async function fetchLeads(url: string = DEFAULT_LEADS_CSV_URL): Promise<ParsedLeads> {
  const csv = await fetcher<string>(url, {
    headers: { Accept: 'text/csv' },
    cache: 'no-store',
  });
  const rows = parseCSV(csv);
  return rowsToLeads(rows);
}
