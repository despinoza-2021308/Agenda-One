/**
 * Utilidades para cálculo y validación de horas (Modelo AD-RE-11)
 */

/**
 * Calcula la diferencia en horas decimales entre hora_inicio y hora_fin
 * @param {string} horaInicio - Formato "HH:MM" o "HH:MM:SS"
 * @param {string} horaFin - Formato "HH:MM" o "HH:MM:SS"
 * @returns {number} Horas decimales redondeadas a 2 decimales (ej: 4.50) o 0 si inválido
 */
function calcularHorasDecimales(horaInicio, horaFin) {
  if (!horaInicio || !horaFin) return 0;

  const [h1, m1] = horaInicio.split(':').map(Number);
  const [h2, m2] = horaFin.split(':').map(Number);

  if (isNaN(h1) || isNaN(m1) || isNaN(h2) || isNaN(m2)) return 0;

  const minutosInicio = h1 * 60 + m1;
  const minutosFin = h2 * 60 + m2;

  // En capacitaciones de una sesión diaria, la hora de fin debe ser estrictamente mayor a la de inicio
  if (minutosFin <= minutosInicio) {
    return 0;
  }

  const minutosTotales = minutosFin - minutosInicio;
  const horas = minutosTotales / 60;

  return Math.round(horas * 100) / 100;
}

/**
 * Valida formato de hora HH:MM o HH:MM:SS
 */
function validarFormatoHora(hora) {
  if (!hora || typeof hora !== 'string') return false;
  const regex = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;
  return regex.test(hora.trim());
}

/**
 * Valida combinación de horarios de inicio y fin para capacitaciones
 * @returns {{ valid: boolean, error?: string, horas?: number }}
 */
function validarHorarios(horaInicio, horaFin) {
  if (!horaInicio || !horaFin) {
    return { valid: false, error: 'La hora de inicio y fin son obligatorias.' };
  }

  if (!validarFormatoHora(horaInicio) || !validarFormatoHora(horaFin)) {
    return { valid: false, error: 'Formato de hora inválido. Debe ser HH:MM (24 horas).' };
  }

  const horas = calcularHorasDecimales(horaInicio, horaFin);

  if (horas <= 0) {
    return { valid: false, error: 'La hora de fin debe ser posterior a la hora de inicio.' };
  }

  if (horas < 0.25) {
    return { valid: false, error: 'La sesión debe durar al menos 15 minutos (0.25 horas).' };
  }

  if (horas > 16) {
    return { valid: false, error: 'La duración de una sesión no puede exceder las 16 horas en un solo día.' };
  }

  return { valid: true, horas };
}

/**
 * Valida que una fecha tenga formato YYYY-MM-DD y sea una fecha real de calendario
 * @returns {{ valid: boolean, error?: string, isWeekend?: boolean }}
 */
function validarFecha(fechaStr) {
  if (!fechaStr || typeof fechaStr !== 'string') {
    return { valid: false, error: 'La fecha es obligatoria.' };
  }

  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(fechaStr.trim())) {
    return { valid: false, error: 'La fecha debe tener formato AAAA-MM-DD.' };
  }

  const [year, month, day] = fechaStr.split('-').map(Number);

  if (year < 2020 || year > 2040) {
    return { valid: false, error: 'El año de la fecha debe estar entre 2020 y 2040.' };
  }

  const dateObj = new Date(year, month - 1, day);
  if (
    dateObj.getFullYear() !== year ||
    dateObj.getMonth() !== month - 1 ||
    dateObj.getDate() !== day
  ) {
    return { valid: false, error: 'La fecha ingresada no existe en el calendario.' };
  }

  // 0 = Domingo, 6 = Sábado
  const dayOfWeek = dateObj.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  return { valid: true, isWeekend };
}

/**
 * Valida formato de correo electrónico
 */
function validarEmail(email) {
  if (!email) return true; // Opcional
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email.trim());
}

/**
 * Valida formato de teléfono (al menos 8 dígitos numéricos)
 */
function validarTelefono(tel) {
  if (!tel) return true; // Opcional
  const cleanDigits = String(tel).replace(/\D/g, '');
  return cleanDigits.length >= 8 && cleanDigits.length <= 16;
}

module.exports = {
  calcularHorasDecimales,
  validarFormatoHora,
  validarHorarios,
  validarFecha,
  validarEmail,
  validarTelefono
};
