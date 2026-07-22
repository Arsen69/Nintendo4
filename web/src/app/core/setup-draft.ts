/** In-progress setup-screen state, kept separate from the committed GameSession so
 *  reloading mid-typing doesn't lose entered names. Deliberately not a GameStateStore:
 *  drafts are inherently local/ephemeral and never need a backend-backed implementation. */
export interface SetupDraft {
  playerCount: number;
  names: string[];
}

function isSetupDraft(value: unknown): value is SetupDraft {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const v = value as Record<string, unknown>;
  return (
    typeof v['playerCount'] === 'number' &&
    Array.isArray(v['names']) &&
    v['names'].every((n) => typeof n === 'string')
  );
}

function key(gameId: string): string {
  return `scoreboard:${gameId}:setup-draft`;
}

export function loadSetupDraft(gameId: string): SetupDraft | null {
  const raw = localStorage.getItem(key(gameId));
  if (raw === null) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw);
    return isSetupDraft(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveSetupDraft(gameId: string, draft: SetupDraft): void {
  localStorage.setItem(key(gameId), JSON.stringify(draft));
}

export function clearSetupDraft(gameId: string): void {
  localStorage.removeItem(key(gameId));
}
