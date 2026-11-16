// Fondos pastel del diseño institucional para tarjetas sin imagen
const PASTEL_COLORS = ['#fff1c2', '#f2dad5', '#dce7f1', '#e9efd2', '#e8ddd0', '#e4def0'];

export function pastelColor(index: number): string {
  return PASTEL_COLORS[Math.abs(index) % PASTEL_COLORS.length];
}
