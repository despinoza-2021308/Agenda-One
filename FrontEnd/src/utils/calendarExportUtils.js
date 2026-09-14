/**
 * calendarExportUtils.js
 * Utilidades para exportación y sincronización de citas con Google Calendar y calendarios estándar (.ics)
 * Compatible con iOS (Apple Calendar), Android, Google Calendar, Outlook y macOS.
 */

// Formatear fecha y hora local a formato compacto de calendario (YYYYMMDDTHHmmSS)
function formatCompactDateTime(dateStr, timeStr) {
  if (!dateStr) return '';
  const cleanDate = String(dateStr).split('T')[0].replace(/[^0-9]/g, '');
  const cleanTime = String(timeStr || '00:00').replace(/[^0-9]/g, '').padEnd(4, '0').slice(0, 4);
  return `${cleanDate}T${cleanTime}00`;
}

// Escapar texto para formato iCalendar (RFC 5545)
function escapeIcsText(str) {
  if (!str) return '';
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/**
 * Genera la URL para agendar directamente en Google Calendar vía web
 */
export function buildGoogleCalendarUrl(cita, capacitador = null) {
  if (!cita || !cita.fecha) return '#';

  const startIso = formatCompactDateTime(cita.fecha, cita.hora_inicio || '08:00');
  const endIso = formatCompactDateTime(cita.fecha, cita.hora_fin || '12:00');

  const capNombre = capacitador?.nombre_completo || cita.capacitador_nombre || 'Capacitador Asignado';
  const capInits = capacitador?.iniciales || cita.capacitador_iniciales || 'CP';

  const title = `[${cita.modalidad || 'Capacitación'}] ${cita.cliente_nombre || 'Cliente'} - ${cita.tipo_servicio || 'Servicio'}`;

  const detailsArr = [
    `📋 SERVICIO: ${cita.tipo_servicio || 'Capacitación'} (${cita.horas || 0} hrs)`,
    `👤 CAPACITADOR: [${capInits}] ${capNombre}`,
    `🏢 CLIENTE / EMPRESA: ${cita.cliente_nombre || 'No especificado'}`,
    `📍 MODALIDAD: ${cita.modalidad || 'Presencial'}`,
    `📌 ESTADO: ${cita.estado || 'Programada'}`,
    cita.observaciones ? `📝 INDICACIONES: ${cita.observaciones}` : null,
    cita.bitacora ? `📖 BITÁCORA: ${cita.bitacora}` : null,
    `\n---\nGenerado por Agenda-One | Control de Horas (AD-RE-11)`
  ].filter(Boolean);

  const location = cita.modalidad === 'Presencial' 
    ? (cita.cliente_nombre || 'Sede del cliente') 
    : 'Reunión Virtual / Enlace de Videoconferencia';

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${startIso}/${endIso}`,
    details: detailsArr.join('\n'),
    location: location
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Genera un bloque VEVENT para una cita
 */
function buildVEventString(cita, capacitador = null) {
  const startIso = formatCompactDateTime(cita.fecha, cita.hora_inicio || '08:00');
  const endIso = formatCompactDateTime(cita.fecha, cita.hora_fin || '12:00');
  const nowIso = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const uid = `agenda-one-${cita.id || Date.now()}-${Math.random().toString(36).substring(2, 8)}@agenda-one.local`;

  const capNombre = capacitador?.nombre_completo || cita.capacitador_nombre || 'Capacitador Asignado';
  const capInits = capacitador?.iniciales || cita.capacitador_iniciales || 'CP';

  const summary = escapeIcsText(`[${cita.modalidad || 'Capacitación'}] ${cita.cliente_nombre || 'Cliente'} - ${cita.tipo_servicio || 'Servicio'}`);
  
  const descParts = [
    `Servicio: ${cita.tipo_servicio || 'Capacitación'} (${cita.horas || 0} hrs)`,
    `Capacitador: [${capInits}] ${capNombre}`,
    `Cliente: ${cita.cliente_nombre || 'Cliente'}`,
    `Modalidad: ${cita.modalidad || 'Presencial'}`,
    `Estado: ${cita.estado || 'Programada'}`,
    cita.observaciones ? `Indicaciones: ${cita.observaciones}` : null,
    cita.bitacora ? `Bitacora: ${cita.bitacora}` : null,
    `Agenda-One AD-RE-11`
  ].filter(Boolean);

  const description = escapeIcsText(descParts.join('\n'));
  const location = escapeIcsText(
    cita.modalidad === 'Presencial'
      ? (cita.cliente_nombre || 'Sede de cliente')
      : 'Sesion Virtual / Enlace'
  );

  return [
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${nowIso}`,
    `DTSTART:${startIso}`,
    `DTEND:${endIso}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    'STATUS:CONFIRMED',
    // Alarma 30 minutos antes
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Recordatorio de capacitación Agenda-One',
    'END:VALARM',
    'END:VEVENT'
  ].join('\r\n');
}

/**
 * Genera el archivo .ics completo para una sola cita
 */
export function generateIcsContent(cita, capacitador = null) {
  const vEvent = buildVEventString(cita, capacitador);
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Agenda One//AD-RE-11 Control de Horas//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    vEvent,
    'END:VCALENDAR'
  ].join('\r\n');
}

/**
 * Genera el archivo .ics para el itinerario completo del día
 */
export function generateDayItineraryIcs(citas = [], capacitador = null, dateStr = '') {
  const events = citas.map(c => buildVEventString(c, capacitador)).join('\r\n');
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Agenda One//AD-RE-11 Itinerario Diario//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:Itinerario ${dateStr || ''} - Agenda One`,
    events,
    'END:VCALENDAR'
  ].join('\r\n');
}

/**
 * Descarga el contenido .ics en el dispositivo del usuario
 */
export function downloadIcsFile(filename, icsContent) {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename.endsWith('.ics') ? filename : `${filename}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
