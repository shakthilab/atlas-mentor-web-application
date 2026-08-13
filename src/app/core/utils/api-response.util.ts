/**
 * The backend serves list data in two different shapes depending on the endpoint:
 * a flat array (`data: [...]`) or a paginated wrapper (`data: { content: [...] }`,
 * from Spring's PageResponse/Page). These helpers normalize both into a flat array
 * so callers don't each re-implement the same defensive unwrapping.
 */
export function extractListData<T = any>(res: any): T[] {
  const raw = res?.data ?? res;
  if (Array.isArray(raw)) return raw;
  if (raw && Array.isArray(raw.content)) return raw.content;
  return [];
}

/**
 * Same normalization as extractListData, but preserves the response envelope
 * (success/message/etc.) with `data` replaced by the flattened list.
 */
export function normalizeListEnvelope<T = any>(res: any, fallback: Record<string, any> = {}): any {
  const data = extractListData<T>(res);
  if (res && res.data !== undefined && res.data !== null) {
    return { ...res, data };
  }
  return { success: res?.success ?? false, ...fallback, data };
}
