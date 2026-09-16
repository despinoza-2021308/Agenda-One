// ====================================================================
// UTILIDADES DE AUDITORÍA Y CONTROL DE ACTUALIZACIÓN POR MES (AD-RE-11)
// ====================================================================

const STORAGE_KEY = 'agenda_month_last_updated_map';

const MONTH_ABBR = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic'
];

/**
 * Obtiene la clave YYYY-MM para un objeto Date o string ISO
 */
export function getMonthKey(date) {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Obtiene el código del mes en formato "mmm-YY" (ej: "sep-26", "jul-26")
 */
export function getMonthCode(date) {
  if (!date) return 'sep-26';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return 'sep-26';
  const m = d.getMonth();
  const y = String(d.getFullYear()).slice(-2);
  return `${MONTH_ABBR[m] || 'sep'}-${y}`;
}

/**
 * Formatea una fecha a DD/MM/YYYY (ej: 16/09/2026, 23/07/2026)
 */
export function formatDateDDMMYYYY(val) {
  if (!val) return '';
  try {
    if (typeof val === 'string' && val.includes('-') && !val.includes('T')) {
      const [y, m, d] = val.split('-');
      if (y && m && d) {
        return `${String(d).padStart(2, '0').slice(0, 2)}/${String(m).padStart(2, '0')}/${y}`;
      }
    }
    const d = new Date(val);
    if (isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (_) {
    return '';
  }
}

/**
 * Carga el mapa de actualizaciones de meses guardado en localStorage
 */
export function loadMonthUpdates() {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch (_) {
    return {};
  }
}

/**
 * Guarda o actualiza la fecha de modificación para un mes específico
 */
export function recordMonthUpdate(monthKey, timestamp = null) {
  if (typeof window === 'undefined' || !monthKey) return {};
  try {
    const current = loadMonthUpdates();
    const updatedMap = {
      ...current,
      [monthKey]: timestamp || new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMap));
    return updatedMap;
  } catch (_) {
    return {};
  }
}

/**
 * Calcula la fecha de última actualización para el mes activo
 * Prioriza:
 * 1. Registro explícito de cambios en monthUpdatesMap
 * 2. Fecha más reciente de updated_at / created_at en las citas del mes
 * 3. Fecha de la última cita registrada del mes
 * 4. Fecha de inicio del mes como fallback
 */
export function getMonthLastUpdateDate(monthKey, citas = [], monthUpdatesMap = {}) {
  // 1. Si hay registro manual o cambio reciente guardado para este mes
  if (monthUpdatesMap && monthUpdatesMap[monthKey]) {
    const formatted = formatDateDDMMYYYY(monthUpdatesMap[monthKey]);
    if (formatted) return formatted;
  }

  // 2. Filtrar citas correspondientes a este mes (YYYY-MM)
  const monthCitas = (citas || []).filter(c => {
    const f = String(c.fecha || '').split('T')[0];
    return f.startsWith(monthKey);
  });

  if (monthCitas.length > 0) {
    let latestTime = 0;

    monthCitas.forEach(c => {
      if (c.updated_at) {
        const t = new Date(c.updated_at).getTime();
        if (!isNaN(t) && t > latestTime) latestTime = t;
      }
      if (c.created_at) {
        const t = new Date(c.created_at).getTime();
        if (!isNaN(t) && t > latestTime) latestTime = t;
      }
    });

    if (latestTime > 0) {
      return formatDateDDMMYYYY(new Date(latestTime));
    }

    // Si no tienen timestamp completo, tomar la fecha más alta de las citas del mes
    const sortedDates = monthCitas
      .map(c => String(c.fecha || '').split('T')[0])
      .filter(Boolean)
      .sort();

    if (sortedDates.length > 0) {
      return formatDateDDMMYYYY(sortedDates[sortedDates.length - 1]);
    }
  }

  // 3. Fallback por defecto si no hay citas registradas en el mes
  if (monthKey && monthKey.includes('-')) {
    const [y, m] = monthKey.split('-');
    return `01/${m}/${y}`;
  }

  return formatDateDDMMYYYY(new Date());
}
