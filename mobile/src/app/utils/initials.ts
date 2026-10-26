// Artículos y conectores que no aportan a las iniciales (ej. "Minisúper El Roble" → "MR", no "ME")
const CONNECTORS = new Set(['a', 'al', 'de', 'del', 'e', 'el', 'en', 'la', 'las', 'lo', 'los', 'o', 'u', 'un', 'una', 'y']);

// Primera letra de la primera y la última palabra; con una sola palabra, sus dos primeras letras
export function initials(name: string | null | undefined): string {
  const words = (name ?? '')
    .split(/\s+/)
    .map((word) => word.replace(/[^\p{L}\p{N}]/gu, ''))
    .filter(Boolean);
  const meaningful = words.filter((word) => !CONNECTORS.has(word.toLocaleLowerCase('es')));
  const source = meaningful.length ? meaningful : words;

  if (!source.length) {
    return '';
  }
  if (source.length === 1) {
    return Array.from(source[0]).slice(0, 2).join('').toLocaleUpperCase('es');
  }
  const first = Array.from(source[0])[0];
  const last = Array.from(source[source.length - 1])[0];
  return `${first}${last}`.toLocaleUpperCase('es');
}
