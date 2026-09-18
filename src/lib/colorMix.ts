// Eine Variante hat eine primäre Farbe (hex) und optional weitere Farben
// (mixColors), falls sie ein "Mix" aus mehreren Farben ist. Zusammen
// höchstens MAX_MIX_COLORS Farben.
export const MAX_MIX_COLORS = 4;

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export function parseMixColors(json: string | null | undefined): string[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((c): c is string => typeof c === "string" && HEX_RE.test(c));
  } catch {
    return [];
  }
}

export function sanitizeMixColors(colors: string[]): string[] {
  return colors.filter((c) => HEX_RE.test(c)).slice(0, MAX_MIX_COLORS - 1);
}

// Alle Farben einer Variante (primär + Mix), z. B. für die Anzeige der
// einzelnen Farbpunkte im Bearbeiten-Modus.
export function allColors(hex: string, mixColorsJson: string | null | undefined): string[] {
  return [hex, ...parseMixColors(mixColorsJson)];
}

// CSS-Hintergrund für einen Farbpunkt/Swatch: einfarbig bei einer Farbe,
// sonst ein gleichmäßig aufgeteilter conic-gradient ("Mix").
export function swatchBackground(hex: string, mixColorsJson: string | null | undefined): string {
  const colors = allColors(hex, mixColorsJson);
  if (colors.length <= 1) return colors[0] || hex;
  const step = 100 / colors.length;
  const stops = colors
    .map((c, i) => `${c} ${(i * step).toFixed(2)}% ${((i + 1) * step).toFixed(2)}%`)
    .join(", ");
  return `conic-gradient(${stops})`;
}
