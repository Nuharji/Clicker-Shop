// Zentrale Regeln dafür, welche Haus/Etage/Zimmer-Kombinationen im Internat erlaubt sind.
// Haus 1–13: Etage 1–2, Zimmer 1–4
// Haus 15–18: Etage 1–3, Zimmer 1–4
// (Haus 14 existiert bewusst nicht)

export const HAUS_LIST: number[] = [
  ...Array.from({ length: 13 }, (_, i) => i + 1), // 1..13
  ...Array.from({ length: 4 }, (_, i) => i + 15), // 15..18
];

export const ZIMMER_LIST: number[] = [1, 2, 3, 4];

// Maximal erlaubte Anzahl an Accounts pro Zimmer (unabhängig vom Namen).
export const MAX_ACCOUNTS_PER_ROOM = 2;

export function etagenForHaus(haus: number): number[] {
  if (haus >= 1 && haus <= 13) return [1, 2];
  if (haus >= 15 && haus <= 18) return [1, 2, 3];
  return [];
}

export function isValidAddress(haus: number, etage: number, zimmer: number): boolean {
  if (!HAUS_LIST.includes(haus)) return false;
  if (!etagenForHaus(haus).includes(etage)) return false;
  if (!ZIMMER_LIST.includes(zimmer)) return false;
  return true;
}

export function formatAddress(haus: number, etage: number, zimmer: number): string {
  return `${haus}.${etage}.${zimmer}`;
}
