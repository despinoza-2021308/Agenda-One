/**
 * Utilidad universal y segura para copiar texto al portapapeles.
 * Compatible con navegadores modernos (HTTPS) y conexiones HTTP en redes locales (fallback DOM textarea).
 *
 * @param {string} text - El texto a copiar
 * @returns {Promise<boolean>} - true si se copió con éxito, false en caso de fallo
 */
export async function copyTextToClipboard(text) {
  if (typeof window === 'undefined') return false;
  const str = String(text ?? '');

  // 1. Intentar API moderna navigator.clipboard (solo funciona bajo contexto seguro / localhost)
  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(str);
      return true;
    } catch (_) {
      // Si el navegador rechaza el permiso o estamos en HTTP no seguro, continuar al fallback
    }
  }

  // 2. Respaldo universal con elemento textarea temporal
  try {
    const textarea = document.createElement('textarea');
    textarea.value = str;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '0';
    textarea.style.left = '-9999px';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';

    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);
    return successful;
  } catch (err) {
    console.warn('⚠️ [Clipboard] No se pudo copiar texto al portapapeles:', err);
    return false;
  }
}
