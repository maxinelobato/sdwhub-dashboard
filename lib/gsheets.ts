import { google } from 'googleapis';
import type { Lead } from './sheets';
import type { EventId } from './event-config';

const SHEETS_CONFIG: Record<EventId, { spreadsheetId: string; tabName: string; saEmail: string; saKeyEnv: string }> = {
  '3420900': {
    spreadsheetId: '12j80r4_0WKyhJZZJtOS9QCZPgxGBfyWZXEb7yq68TaE',
    tabName: 'sympla',
    saEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL_3420900 ?? '',
    saKeyEnv: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_3420900 ?? '',
  },
  '3426453': {
    spreadsheetId: '1PlLN9PLB97ZIfahTThbH3-PwiZxxEB8RkPsd4tz87GY',
    tabName: 'sympla-ab',
    saEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL_3426453 ?? '',
    saKeyEnv: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_3426453 ?? '',
  },
};

const HEADERS = [
  'Data Compra',
  'Ordem Inscrição',
  'Nome',
  'Sobrenome',
  'WhatsApp',
  'UTM Source',
  'UTM Campaign',
  'UTM Content',
  'UTM Term',
  'Fonte',
];

function getAuth(eventId: EventId) {
  const { saEmail, saKeyEnv } = SHEETS_CONFIG[eventId];
  const key = saKeyEnv.replace(/\\n/g, '\n');
  if (!saEmail || !key) throw new Error(`Credenciais Google não configuradas para evento ${eventId}`);
  return new google.auth.JWT({ email: saEmail, key, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
}

function formatDateTime(date: Date | null): string {
  if (!date) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;
}

function leadToRow(lead: Lead): string[] {
  return [
    formatDateTime(lead.timestamp),
    lead.ordemInscricao != null ? String(lead.ordemInscricao) : '',
    lead.nome,
    lead.sobrenome,
    lead.whatsapp,
    lead.utmSource,
    lead.utmCampaign,
    lead.utmContent,
    lead.utmTerm,
    lead.fonte,
  ];
}

async function ensureTab(
  sheets: ReturnType<typeof google.sheets>,
  spreadsheetId: string,
  tabName: string,
): Promise<void> {
  const meta = await sheets.spreadsheets.get({ spreadsheetId, fields: 'sheets.properties.title' });
  const exists = (meta.data.sheets ?? []).some((s) => s.properties?.title === tabName);
  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests: [{ addSheet: { properties: { title: tabName } } }] },
    });
  }
}

export async function syncLeadsToSheet(leads: Lead[], eventId: EventId = '3420900'): Promise<{ updated: number }> {
  const { spreadsheetId, tabName } = SHEETS_CONFIG[eventId];
  const auth = getAuth(eventId);
  const sheets = google.sheets({ version: 'v4', auth });

  await ensureTab(sheets, spreadsheetId, tabName);

  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `${tabName}!A:J`,
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${tabName}!A1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [HEADERS, ...leads.map(leadToRow)] },
  });

  return { updated: leads.length };
}
