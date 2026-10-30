const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

// Laravel envía microsegundos ("...00.000000Z"); se recortan a milisegundos para que Date los lea en cualquier motor
const parse = (iso: string): Date => new Date(iso.replace(/(\.\d{3})\d+/, '$1'));

const isSameDay = (a: Date, b: Date): boolean => a.toDateString() === b.toDateString();

// Ej. "07 oct"
export function formatDay(iso: string): string {
  const date = parse(iso);
  return `${String(date.getDate()).padStart(2, '0')} ${MONTHS[date.getMonth()]}`;
}

// Ej. "11:05 a. m."
export function formatTime(iso: string): string {
  const date = parse(iso);
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours % 12 || 12}:${minutes} ${hours < 12 ? 'a. m.' : 'p. m.'}`;
}

// Solo la hora si es de hoy; si no, también el día. Ej. "11:05 a. m." o "07 oct · 11:05 a. m."
export function formatMoment(iso: string): string {
  return isSameDay(parse(iso), new Date()) ? formatTime(iso) : `${formatDay(iso)} · ${formatTime(iso)}`;
}

// Ej. "Hoy · 11:05 a. m.", "Ayer · 4:30 p. m." o "07 oct · 11:05 a. m."
export function formatDateTime(iso: string): string {
  const date = parse(iso);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  let day = formatDay(iso);
  if (isSameDay(date, new Date())) {
    day = 'Hoy';
  } else if (isSameDay(date, yesterday)) {
    day = 'Ayer';
  }
  return `${day} · ${formatTime(iso)}`;
}
