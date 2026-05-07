/**
 * fetcher.ts — wrapper padrão de fetch com `mode: 'cors'`.
 *
 * Use este utilitário para QUALQUER chamada HTTP do projeto SDW.hub Dashboard.
 * Garante CORS habilitado, JSON serializado, headers padrão e tratamento de erro consistente.
 */

export type FetcherInit = Omit<RequestInit, 'body' | 'mode'> & {
  body?: unknown;
  /** Permite forçar revalidação no cache do Next App Router. */
  revalidate?: number | false;
  /** Tags para revalidateTag() — útil em Server Components. */
  tags?: string[];
};

export class FetcherError extends Error {
  constructor(
    message: string,
    public status: number,
    public statusText: string,
    public payload?: unknown,
  ) {
    super(message);
    this.name = 'FetcherError';
  }
}

/**
 * fetcher — fetch com CORS habilitado por padrão.
 *
 * @example
 *   const data = await fetcher<EventStats>('https://api.sdwhub.com/stats');
 *   await fetcher('/api/lead', { method: 'POST', body: { email } });
 */
export async function fetcher<T = unknown>(
  url: string,
  init: FetcherInit = {},
): Promise<T> {
  const { body, revalidate, tags, headers, ...rest } = init;

  const finalHeaders = new Headers(headers);
  if (body !== undefined && !finalHeaders.has('Content-Type')) {
    finalHeaders.set('Content-Type', 'application/json');
  }
  if (!finalHeaders.has('Accept')) {
    finalHeaders.set('Accept', 'application/json');
  }

  const next: RequestInit & { next?: { revalidate?: number | false; tags?: string[] } } = {
    ...rest,
    mode: 'cors',
    credentials: rest.credentials ?? 'same-origin',
    headers: finalHeaders,
  };

  if (body !== undefined) {
    next.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  if (revalidate !== undefined || tags?.length) {
    next.next = {
      ...(revalidate !== undefined ? { revalidate } : {}),
      ...(tags?.length ? { tags } : {}),
    };
  }

  const response = await fetch(url, next);

  if (!response.ok) {
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      payload = await response.text().catch(() => undefined);
    }
    throw new FetcherError(
      `Request failed: ${response.status} ${response.statusText}`,
      response.status,
      response.statusText,
      payload,
    );
  }

  if (response.status === 204) return undefined as T;

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return (await response.json()) as T;
  }
  return (await response.text()) as unknown as T;
}
