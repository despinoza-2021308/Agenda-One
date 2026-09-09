/**
 * Utilidades para cálculo y validación de horas (Modelo AD-RE-11)
 */

/**
 * Calcula la diferencia en horas decimales entre hora_inicio y hora_fin
 * @param {string} horaInicio - Formato "HH:MM" o "HH:MM:SS"
 * @param {string} horaFin - Formato "HH:MM" o "HH:MM:SS"
 * @returns {number} Horas decimales redondeadas a 2 decimales (ej: 4.50)
 */
function calcularHorasDecimales(horaInicio, horaFin) {
  if (!horaInicio || !horaFin) return 0;

  const [h1, m1] = horaInicio.split(':').map(Number);
  const [h2, m2] = horaFin.split(':').map(Number);

  const minutosInicio = h1 * 60 + m1;
  let minutosFin = h2 * 60 + m2;

  // Manejo de citas que cruzan medianoche si aplica
  if (minutosFin < minutosInicio) {
    minutosFin += 24 * 60;
  }

  const minutosTotales = minutosFin - minutosInicio;
  const horas = minutosTotales / 60;

  // Redondear a 2 decimales
  return Math.round(horas * 100) / 100;
}

/**
 * Valida formato de hora HH:MM o HH:MM:SS
 */
function validarFormatoHora(hora) {
  const regex = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;
  return regex.test(hora);
}

module.exports = {
  calcularHorasDecimales,
  validarFormatoHora
};
