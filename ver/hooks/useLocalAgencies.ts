// ver/pages/hooks/useLocalAgencies.ts
import useSWR, { mutate as globalMutate } from 'swr';
import axios from 'axios';

// Prefer a shared axios instance if you already have one at ver/utils/api.ts
// import api from '../../utils/api';
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000',
  withCredentials: true,
});

export type LocalAgency = {
  id: string | number;             // accept both
  name: string;
  address?: string | null;
  email: string;
  phone: string;
  contactPerson?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

const KEY = ['/api/local-agencies'] as const;

// id helpers
const toKey = (v: string | number) => String(v);
const eqId = (a: string | number, b: string | number) => String(a) === String(b);

const fetcher = async (): Promise<LocalAgency[]> => {
  const { data } = await api.get<LocalAgency[]>(KEY[0]);
  return Array.isArray(data) ? data : [];
};

const safeList = (cur: unknown): LocalAgency[] =>
  Array.isArray(cur) ? (cur as LocalAgency[]) : [];

export function useLocalAgencies() {
  const { data, error, isLoading, mutate } = useSWR<LocalAgency[]>(KEY, fetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true,
  });

  return {
    agencies: data ?? [],
    error,
    isLoading: !!isLoading,
    mutate,
    key: KEY,
  };
}

// Create (optimistic add; replace tmp with server response)
export async function createAgency(
  input: Omit<LocalAgency, 'id' | 'createdAt' | 'updatedAt'>
): Promise<LocalAgency | null> {
  const optimistic: LocalAgency = { id: `tmp-${Date.now()}`, ...input };

  await globalMutate(
    KEY,
    (cur?: LocalAgency[]) => [optimistic, ...safeList(cur)],
    { revalidate: false }
  );

  try {
    const { data: created } = await api.post<LocalAgency>(KEY[0], input);
    if (created && typeof created === 'object' && 'id' in created) {
      await globalMutate(
        KEY,
        (cur?: LocalAgency[]) => {
          const list = safeList(cur);
          return [created as LocalAgency, ...list.filter(a => !eqId(a.id, optimistic.id))];
        },
        { revalidate: false }
      );
      return created;
    }
    await globalMutate(KEY);
    return null;
  } catch (err) {
    await globalMutate(KEY);
    throw err;
  }
}

// Update (optimistic patch; populate with server response)
export async function updateAgency(
  id: string | number,
  patch: Partial<Omit<LocalAgency, 'id'>>
): Promise<LocalAgency | null> {
  await globalMutate(
    KEY,
    (cur?: LocalAgency[]) => safeList(cur).map(a => (eqId(a.id, id) ? { ...a, ...patch } : a)),
    { revalidate: false }
  );

  try {
    const { data: updated } = await api.put<LocalAgency>(`${KEY[0]}/${toKey(id)}`, patch);
    if (updated && typeof updated === 'object' && 'id' in updated) {
      await globalMutate(
        KEY,
        (cur?: LocalAgency[]) => safeList(cur).map(a => (eqId(a.id, id) ? (updated as LocalAgency) : a)),
        { revalidate: false }
      );
      return updated;
    }
    await globalMutate(KEY);
    return null;
  } catch (err) {
    await globalMutate(KEY);
    throw err;
  }
}

// Delete (optimistic remove; confirm with revalidate)
export async function deleteAgency(id: string | number): Promise<void> {
  await globalMutate(
    KEY,
    (cur?: LocalAgency[]) => safeList(cur).filter(a => !eqId(a.id, id)),
    { revalidate: false }
  );

  try {
    await api.delete(`${KEY[0]}/${toKey(id)}`);
    await globalMutate(KEY);
  } catch (err) {
    await globalMutate(KEY);
    throw err;
  }
}

// Optional: default export for consumers that prefer default import style
export default useLocalAgencies;
