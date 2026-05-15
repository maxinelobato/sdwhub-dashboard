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
    utm_campaign?: string;
    utm_content?: string;
    utm_term?: string;
    referrer?: string;
  };
};

type SymplaPage<T> = {
  data: T[];
  pagination: { total_page: number };
};

type ParticipantWithUtm = SymplaParticipant & {
  utm_source: string;
  utm_campaign: string;
  utm_content: string;
  utm_term: string;
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

async function buildUtmMap(
  eventId: string,
  token: string,
): Promise<Map<string, { utm_source: string; utm_campaign: string; utm_content: string; utm_term: string }>> {
  const orders = await fetchAll<SymplaOrder>(`${BASE_URL}/events/${eventId}/orders`, token);
  return new Map(
    orders.map((o) => [
      o.id,
      {
        utm_source:   o.utm?.utm_source?.trim()   ?? '',
        utm_campaign: o.utm?.utm_campaign?.trim() ?? '',
        utm_content:  o.utm?.utm_content?.trim()  ?? '',
        utm_term:     o.utm?.utm_term?.trim()     ?? '',
      },
    ]),
  );
}

export async function fetchAllParticipants(since?: Date, eventId?: string): Promise<ParticipantWithUtm[]> {
  const token = process.env.SYMPLA_API_TOKEN!;
  const eid   = eventId ?? process.env.SYMPLA_EVENT_ID!;

  const [participants, utmMap] = await Promise.all([
    fetchAll<SymplaParticipant>(`${BASE_URL}/events/${eid}/participants`, token),
    buildUtmMap(eid, token),
  ]);

  const filtered = since
    ? participants.filter((p) => {
        const dateStr = p.order_approved_date ?? p.order_date;
        if (!dateStr) return false;
        return new Date(dateStr) >= since;
      })
    : participants;

  return filtered.map((p) => ({
    ...p,
    utm_source:   utmMap.get(p.order_id)?.utm_source   ?? '',
    utm_campaign: utmMap.get(p.order_id)?.utm_campaign ?? '',
    utm_content:  utmMap.get(p.order_id)?.utm_content  ?? '',
    utm_term:     utmMap.get(p.order_id)?.utm_term     ?? '',
  }));
}

export function participantToRow(p: ParticipantWithUtm, eventId?: string) {
  const purchaseDate = p.order_approved_date ?? p.order_date ?? null;

  return {
    sympla_id:       String(p.id),
    event_id:        eventId ?? process.env.SYMPLA_EVENT_ID ?? null,
    ordem_inscricao: p.id,
    data_compra:     purchaseDate ? new Date(purchaseDate).toISOString() : null,
    nome:            p.first_name?.trim() || null,
    sobrenome:       p.last_name?.trim()  || null,
    whatsapp:        getCustomField(p.custom_form, 'whatsapp') || null,
    utm_source:      p.utm_source   || null,
    utm_campaign:    p.utm_campaign || null,
    utm_content:     p.utm_content  || null,
    utm_term:        p.utm_term     || null,
    fonte:           'sympla',
  };
}
