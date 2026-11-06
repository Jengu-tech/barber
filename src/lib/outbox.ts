type OutboxTable = 'queue_items' | 'transactions';

interface OutboxEntry {
  id: string;
  table: OutboxTable;
  row: any;
  ts: number;
}

interface OutboxInput {
  id?: string;
  table: OutboxTable;
  row: any;
  ts?: number;
}

const OUTBOX_KEY = 'barberq_outbox';
const MAX_ENTRIES = 100;

let isFlushing = false;

function readOutbox(): OutboxEntry[] {
  try {
    const raw = localStorage.getItem(OUTBOX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (entry: any) =>
        entry &&
        (entry.table === 'queue_items' || entry.table === 'transactions') &&
        entry.row &&
        entry.row.id !== undefined
    );
  } catch (err) {
    console.warn('[Outbox] Failed to read local outbox:', err);
    return [];
  }
}

function writeOutbox(entries: OutboxEntry[]) {
  try {
    localStorage.setItem(OUTBOX_KEY, JSON.stringify(entries));
  } catch (err) {
    console.warn('[Outbox] Failed to write local outbox:', err);
  }
}

function emitOutboxChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('barberq_outbox_change'));
  }
}

function dropOldest(entries: OutboxEntry[]): OutboxEntry | null {
  let dropIndex = -1;

  for (let i = 0; i < entries.length; i++) {
    if (
      entries[i].table === 'queue_items' &&
      (dropIndex === -1 || entries[i].ts < entries[dropIndex].ts)
    ) {
      dropIndex = i;
    }
  }

  if (dropIndex === -1) {
    for (let i = 0; i < entries.length; i++) {
      if (
        entries[i].table === 'transactions' &&
        (dropIndex === -1 || entries[i].ts < entries[dropIndex].ts)
      ) {
        dropIndex = i;
      }
    }
  }

  if (dropIndex === -1) dropIndex = 0;

  const [dropped] = entries.splice(dropIndex, 1);
  return dropped || null;
}

export function pushOutbox(input: OutboxInput): void {
  const rowId = input?.row?.id;
  if (rowId === undefined || rowId === null) {
    console.warn('[Outbox] Ignoring entry without row.id');
    return;
  }

  const entries = readOutbox().filter(
    (entry) => !(entry.table === input.table && entry.row?.id === rowId)
  );

  const ts = input.ts ?? Date.now();
  const id = input.id || `${input.table}:${rowId}:${ts}:${Math.random().toString(36).slice(2, 8)}`;

  entries.push({ id, table: input.table, row: input.row, ts });

  while (entries.length > MAX_ENTRIES) {
    const dropped = dropOldest(entries);
    console.warn(`[Outbox] Limit of ${MAX_ENTRIES} reached, dropping oldest entry`, dropped);
  }

  writeOutbox(entries);
  emitOutboxChange();
}

function removeEntry(entryId: string) {
  const current = readOutbox();
  writeOutbox(current.filter((entry) => entry.id !== entryId));
}

function isPermanentError(status: number, error: any): boolean {
  if (status >= 400 && status < 500) return true;
  const code = String(error?.code || '');
  if (!code) return false;
  if (code.startsWith('PGRST')) return true;
  return /^(22|23|42)/.test(code);
}

export async function flushOutbox(): Promise<number> {
  if (isFlushing) return 0;
  isFlushing = true;

  let flushed = 0;
  let total = 0;

  try {
    const entries = readOutbox();
    total = entries.length;
    if (total === 0) return 0;

    const { getRealSupabase } = await import('./supabase');
    const real = getRealSupabase();
    if (!real) {
      total = 0;
      return 0;
    }

    for (const entry of entries) {
      try {
        const response =
          entry.table === 'queue_items'
            ? await real.from('queue_items').upsert(entry.row, { onConflict: 'id' })
            : await real.from('transactions').upsert(entry.row, {
                onConflict: 'id',
                ignoreDuplicates: true,
              });

        if (response?.error) {
          const status = Number(response.status || 0);

          if (status >= 500) {
            console.warn('[Outbox] Remote error, keeping remaining entries:', response.error);
            break;
          }

          if (isPermanentError(status, response.error)) {
            console.error('[Outbox] Dropping entry after permanent error:', entry, response.error);
            removeEntry(entry.id);
            continue;
          }

          console.warn('[Outbox] Remote error, keeping remaining entries:', response.error);
          break;
        }

        removeEntry(entry.id);
        flushed++;
      } catch (err) {
        console.warn('[Outbox] Network error, keeping remaining entries:', err);
        break;
      }
    }
  } catch (err) {
    console.warn('[Outbox] Flush failed:', err);
  } finally {
    isFlushing = false;
    if (total > 0) {
      console.info(`[Outbox] Flushed ${flushed}/${total}`);
      emitOutboxChange();
    }
  }

  return flushed;
}

export function getPendingCount(): number {
  try {
    const raw = localStorage.getItem(OUTBOX_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch (err) {
    console.warn('[Outbox] Failed to count pending entries:', err);
    return 0;
  }
}
