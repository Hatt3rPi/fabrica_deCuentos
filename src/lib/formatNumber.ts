export function formatNumber(num: number): string {
  return Math.round(num).toLocaleString('es-ES');
}
