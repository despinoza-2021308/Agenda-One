/**
 * Utilidades centralizadas para manejo robusto de fechas sin desfase de zona horaria (UTC vs Local)
 * Previene el error común donde .toISOString().split('T')[0] cambia de día después de las 18:00 (UTC-6)
 */

/**
 * Retorna la fecha local en formato YYYY-MM-DD
 * @param {Date|string|number} [input=new Date()]
 * @returns {string} YYYY-MM-DD
 */
export function getLocalDateString(input = new Date()) {
  let d = input;
  if (typeof input === 'string') {
    // Si ya viene en formato YYYY-MM-DD, retornar directamente
    if (/^\d{4}-\d{2}-\d{2}/.test(input)) {
      return input.slice(0, 10);
    }
    d = new Date(input);
  } else if (typeof input === 'number') {
    d = new Date(input);
  }

  if (!(d instanceof Date) || isNaN(d.getTime())) {
    d = new Date();
  }

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parsea de forma segura un string YYYY-MM-DD a objeto Date local (a mediodía para evitar saltos de borde)
 * @param {string} dateStr YYYY-MM-DD
 * @returns {Date}
 */
export function parseLocalDate(dateStr) {
  if (!dateStr) return new Date();
  const [y, m, d] = String(dateStr).split('T')[0].split('-').map(Number);
  if (!y || !m || !d) return new Date();
  return new Date(y, m - 1, d, 12, 0, 0);
}
