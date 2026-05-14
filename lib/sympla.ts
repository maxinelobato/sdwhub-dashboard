const BASE_URL = 'https://api.sympla.com.br/public/v3';

type CustomFormField = { id: number; name: string; value: string };

export type SymplaParticipant = {
  id: number;
  event_id: number;
  order_id: string;
  order_status: string;
  order_date: string;
  order_updated_date?: string;
  order_approved_date?: string;
  ticket_name?: string;
  ticket_sale_price?: number;
  first_name: string;
  last_name: string;
  email: string;
  custom_form?: CustomFormField[];
};

type SymplaOrder = {
  id: string;
  utm?: {
    utm_source?: string;
    utm_content?: string;
    referrer?: string;
  };
};

type SymplaPage<T> = {
  data: T[];
  pagination: { total_page: number };
};

type ParticipantWithUtm = SymplaParticipant & {
  utm_source: string;
  utm_content: string;
};

function getCustomField(form: CustomFormField[] | undefined, keyword: string): string {
  if (!form) return '';
  return form.find((f) => f.name.toLowerCase().includes(keyword.toLowerCase()))?.value?.trim() ?? '';
}

async function fetchPage<T>(url: string, token: string): Promise<SymplaPage<T>> {
  const res = await fetch(url, { headers: { s_token: token }, cache: 'no-store' });
  if (!res.ok) throw new Error(`Sympla API ${res.status}: ${await res.text()}`);
  return res.json();
}

async function fetchAll<T>(base: string, token: string): Promise<T[]> {
  const first = await fetchPage<T>(`${base}?page=1&page_size=100`, token);
  const all = [...first.data];
  for (let p = 2; p <= first.pagination.total_page; p++) {
    const page = await fetchPage<T>(`${base}?page=${p}&page_size=100`, token);
    all.push(...page.data);
  }
  return all;
}

async function buildUtmMap(eventId: string, token: string): Promise<Map<string, { utm_source: string; utm_content: string }>> {
  const orders = await fetchAll<SymplaOrder>(
    `${BASE_URL}/events/${eventId}/orders`,
    token,
  );
  return new Map(
    orders.map((o) => [
      o.id,
      {
        utm_source: o.utm?.utm_source?.trim() ?? '',
        utm_content: o.utm?.utm_content?.trim() ?? '',
      },
    ]),
  );
}

export async function fetchAllParticipants(): Promise<ParticipantWithUtm[]> {
  const token = process.env.SYMPLA_API_TOKEN!;
  const eventId = process.env.SYMPLA_EVENT_ID!;

  const [participants, utmMap] = await Promise.all([
    fetchAll<SymplaParticipant>(`${BASE_URL}/events/${eventId}/participants`, token),
    buildUtmMap(eventId, token),
  ]);

  return participants.map((p) => ({
    ...p,
    utm_source: utmMap.get(p.order_id)?.utm_source ?? '',
    utm_content: utmMap.get(p.order_id)?.utm_content ?? '',
  }));
}

export function participantToRow(p: ParticipantWithUtm) {
  const purchaseDate = p.order_approved_date ?? p.order_date ?? null;

  return {
    sympla_id: String(p.id),
    source: 'sympla' as const,
    timestamp: purchaseDate ? new Date(purchaseDate).toISOString() : null,
    nome: `${p.first_name} ${p.last_name}`.trim(),
    email: p.email ?? null,
    whatsapp: getCustomField(p.custom_form, 'whatsapp') || null,
    rede_social: null,
    atuacao: p.ticket_name ?? null,
    mercado: null,
    em_operacao: null,
    faturamento: null,
    tamanho_equipe: null,
    objetivo: null,
    pretende_participar: null,
    motivacao: null,
    utm_source: p.utm_source || null,
    utm_content: p.utm_content || null,
  };
}
