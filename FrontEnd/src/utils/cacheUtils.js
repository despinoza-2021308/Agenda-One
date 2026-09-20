/**
 * Utilidades para caché local seguro con patrón Stale-While-Revalidate (SWR)
 * Permite que la aplicación muestre honorarios, citas y clientes en 0 milisegundos
 * al abrir la aplicación, mientras sincroniza con Supabase en segundo plano.
 */

/**
 * Obtiene datos del almacenamiento local con fallback seguro
 * @param {string} key 
 * @param {any} fallback 
 * @returns {any}
 */
export function getCachedData(key, fallback = []) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return fallback;
  }
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed !== null && parsed !== undefined ? parsed : fallback;
  } catch (err) {
    console.warn(`⚠️ [Cache] Error al leer clave ${key} de localStorage:`, err);
    return fallback;
  }
}

/**
 * Guarda datos en el almacenamiento local de forma segura
 * @param {string} key 
 * @param {any} data 
 */
export function setCachedData(key, data) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn(`⚠️ [Cache] Error al escribir clave ${key} en localStorage:`, err);
  }
}

/**
 * Verifica si existe caché previo válido para una clave
 * @param {string} key 
 * @returns {boolean}
 */
export function hasCachedData(key) {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.length > 0 : !!parsed;
  } catch (_) {
    return false;
  }
}
