/** Blank inputs get a positional default, same as the legacy app (`Joueur ${i+1}`);
 *  everything else is trimmed as typed. */
export function resolvePlayerNames(rawNames: string[]): string[] {
  return rawNames.map((raw, i) => raw.trim() || `Joueur ${i + 1}`);
}

/** Case-insensitive, trimmed comparison. Returns the first duplicate found, or null.
 *  New: the legacy app allowed duplicate names, making the score table ambiguous. */
export function findDuplicateName(names: string[]): string | null {
  const seen = new Set<string>();
  for (const name of names) {
    const key = name.trim().toLowerCase();
    if (seen.has(key)) {
      return name;
    }
    seen.add(key);
  }
  return null;
}
