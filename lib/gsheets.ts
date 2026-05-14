import { google } from 'googleapis';
import type { Lead } from './sheets';

const SPREADSHEET_ID = '1PlLN9PLB97ZIfahTThbH3-PwiZxxEB8RkPsd4tz87GY';
const SHEET_GID = '2097604350';

const HEADERS = [
  'Timestamp',
  'Nome',
  'WhatsApp',
  'Email',
  'Rede Social',
  'Atuação',
  'Mercado',
  'Em Operação',
  'Faturamento',
  'Tamanho Equipe',
  'Objetivo',
  'Pretende Participar',
  'Motivação',
  'UTM Source',
  'UTM Content',
  'Fonte',
];

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!email || !key) throw new Error('GOOGLE_SERVICE_ACCOUNT_EMAIL ou GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY não configurados');

  return new google.auth.JWT({
    email,
    key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

async function getSheetName(sheets: ReturnType<typeof google.sheets>, sheetGid: string): Promise<string> {
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const tab = meta.data.sheets?.find((s) => String(s.properties?.sheetId) === sheetGid);
  if (!tab?.properties?.title) throw new Error(`Aba com gid ${sheetGid} não encontrada`);
  return tab.properties.title;
}

function leadToRow(lead: Lead): string[] {
  return [
    lead.timestamp?.toISOString() ?? '',
    lead.nome,
    lead.whatsapp,
    lead.email,
    lead.redeSocial,
    lead.atuacao,
    lead.mercado,
    lead.emOperacao,
    lead.faturamento,
    lead.tamanhoEquipe,
    lead.objetivo,
    lead.pretendeParticipar,
    lead.motivacao,
    lead.utmSource,
    lead.utmContent,
    'sympla',
  ];
}

export async function syncLeadsToSheet(leads: Lead[]): Promise<{ updated: number }> {
  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });
  const tabName = await getSheetName(sheets, SHEET_GID);
  const range = `'${tabName}'!A1`;

  const rows = [HEADERS, ...leads.map(leadToRow)];

  // Limpa a aba antes de reescrever para remover linhas de leads excluídos
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${tabName}'!A:P`,
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: rows },
  });

  return { updated: leads.length };
}
