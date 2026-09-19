import * as XLSX from 'xlsx';

// Nombres canónicos de días de la semana
const DAY_NAMES = [
  'LUNES', 'MARTES', 'MIERCOLES', 'MIÉRCOLES',
  'JUEVES', 'VIERNES', 'SABADO', 'SÁBADO', 'DOMINGO'
];

// Columnas base de los 7 días de la semana (cada día ocupa 3 columnas: [desc, horas, capacitador])
const DAY_COLUMNS = [0, 3, 6, 9, 12, 15, 18];

// Meses en español a número (1 a 12)
const MONTHS_MAP = {
  'ENE': 1, 'ENERO': 1,
  'FEB': 2, 'FEBRERO': 2,
  'MAR': 3, 'MARZO': 3,
  'ABR': 4, 'ABRIL': 4,
  'MAY': 5, 'MAYO': 5,
  'JUN': 6, 'JUNIO': 6,
  'JUL': 7, 'JULIO': 7,
  'AGO': 8, 'AGOSTO': 8,
  'SEP': 9, 'SEPTIEMBRE': 9,
  'OCT': 10, 'OCTUBRE': 10,
  'NOV': 11, 'NOVIEMBRE': 11,
  'DIC': 12, 'DICIEMBRE': 12
};

/**
 * Parsea el nombre de la hoja (ej. "JUN 2026", "MAY 2026", "OCT 2026")
 */
export function parseSheetMonthInfo(sheetName) {
  if (!sheetName) return null;
  const upper = sheetName.trim().toUpperCase();
  const yearMatch = upper.match(/20\d{2}/);
  const year = yearMatch ? parseInt(yearMatch[0], 10) : new Date().getFullYear();

  let monthNum = null;
  let monthLabel = '';
  for (const [abbr, m] of Object.entries(MONTHS_MAP)) {
    if (upper.includes(abbr)) {
      monthNum = m;
      monthLabel = abbr;
      break;
    }
  }

  if (!monthNum) return null;

  const monthKey = `${year}-${String(monthNum).padStart(2, '0')}`;
  return {
    year,
    month: monthNum,
    key: monthKey,
    sheetName,
    label: `${monthLabel} ${year}`
  };
}

/**
 * Extrae rangos de hora (ej: "8 A 12", "14 A 18", "8:30 A 12:30", "17 A 17:30")
 */
export function extractHorariosFromDesc(desc) {
  let hora_inicio = '08:00';
  let hora_fin = '12:00';

  if (!desc) return { hora_inicio, hora_fin };

  // Requiere límites de palabra \b para evitar falsos positivos con códigos de normas (ej: ISO 9001 - 2015)
  const timeMatches = desc.matchAll(/\b(\d{1,2}(?::\d{2})?)\s*(?:A|-|A LAS)\s*(\d{1,2}(?::\d{2})?)\b/gi);
  for (const match of timeMatches) {
    const parseHour = (t) => {
      const [h, min = 0] = t.split(':').map(Number);
      return h + min / 60;
    };
    const t1 = parseHour(match[1]);
    const t2 = parseHour(match[2]);

    // Validar que sea un horario laboral plausible (5:00 a 23:00) y que fin > inicio
    if (t1 >= 5 && t1 <= 21 && t2 >= 6 && t2 <= 23 && t2 > t1 && (t2 - t1) <= 16) {
      const formatTime = (t) => {
        if (t.includes(':')) {
          const [hh, mm] = t.split(':');
          return `${hh.padStart(2, '0')}:${mm.padEnd(2, '0')}`;
        }
        return `${t.padStart(2, '0')}:00`;
      };
      hora_inicio = formatTime(match[1]);
      hora_fin = formatTime(match[2]);
      break;
    }
  }

  return { hora_inicio, hora_fin };
}

/**
 * Detecta modalidad a partir del texto
 */
export function detectModalidad(desc) {
  if (!desc) return 'Presencial';
  if (/VIRTUAL/i.test(desc)) return 'Virtual';
  if (/H[IÍ]BRIDA/i.test(desc)) return 'Híbrida';
  return 'Presencial';
}

/**
 * Detecta tipo de servicio
 */
export function detectTipoServicio(desc) {
  if (!desc) return 'Asesoría';
  if (/CURSO/i.test(desc) || /DIP/i.test(desc) || /CAPACITACI[OÓ]N/i.test(desc)) return 'Capacitación';
  if (/AUDITOR[IÍ]A/i.test(desc)) return 'Auditoría';
  if (/REUNI[OÓ]N/i.test(desc)) return 'Reunión';
  return 'Asesoría';
}

/**
 * Cruza la descripción con el catálogo de clientes existente
 */
export function matchClient(desc, clientsCatalog = []) {
  if (!desc) return { client: null, suggestedName: 'Cliente General' };

  const clean = desc.replace(/\s+/g, ' ').toUpperCase().trim();

  // 1. Coincidencia exacta o por subcadena en alias / nombre_empresa
  for (const cli of clientsCatalog) {
    const alias = (cli.alias || '').toUpperCase().trim();
    const nombre = (cli.nombre_empresa || '').toUpperCase().trim();

    if (alias && alias.length >= 3 && clean.includes(alias)) {
      return { client: cli, suggestedName: cli.nombre_empresa };
    }
    if (nombre && nombre.length >= 3 && clean.includes(nombre)) {
      return { client: cli, suggestedName: cli.nombre_empresa };
    }
  }

  // 2. Extracción heurística del nombre (primera palabra relevante antes de palabras clave)
  const tokens = clean.split(/[\s\-]/);
  const keywords = ['ASESORÍA', 'ASESORIA', 'CAPACITACIÓN', 'CAPACITACION', 'CURSO', 'REUNIÓN', 'REUNION', 'AUDITORÍA', 'AUDITORIA', 'VIRTUAL', 'PRESENCIAL', 'BLOQUEADO'];
  const nameParts = [];
  for (const tok of tokens) {
    if (keywords.includes(tok) || /^\d/.test(tok)) break;
    nameParts.push(tok);
  }

  const candidate = nameParts.join(' ').trim();
  const fallbackName = candidate.length >= 2 ? candidate : tokens[0] || 'Cliente General';

  return { client: null, suggestedName: fallbackName };
}

/**
 * Lee un archivo File / ArrayBuffer y devuelve el workbook y hojas compatibles
 */
export async function readWorkbookFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetNames = workbook.SheetNames || [];

        // Filtrar hojas que correspondan a meses (ej: "JUN 2026", "MAY 2026")
        const monthSheets = sheetNames
          .map(name => ({ name, info: parseSheetMonthInfo(name) }))
          .filter(item => item.info !== null);

        resolve({
          workbook,
          allSheets: sheetNames,
          monthSheets
        });
      } catch (err) {
        reject(new Error('No se pudo leer el archivo Excel: ' + err.message));
      }
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo desde el disco.'));
    reader.readAsArrayBuffer(file);
  });
}

export const DEFAULT_TRAINER_IDS = {
  'MO': 1, // Mariana Orellana
  'OQ': 2, // Oscar Quan
  'PF': 3, // Pedro Fuentes
  'ZG': 4, // Zoila Galvez
  'JB': 5, // Josue Bautista
  'JA': 6, // Jaime Avalos
  'LT': 7, // Luis Teo
  'BJ': 8, // Byron Jerez
  'LM': 2, // Lic. Mario (Consultoría de apoyo)
  'SR': 2  // Respaldo de consultoría
};

export const TRAINER_NAME_KEYWORDS = {
  'MARIANA': 'MO', 'ORELLANA': 'MO',
  'PEDRO': 'PF', 'FUENTES': 'PF',
  'ZOILA': 'ZG', 'GALVEZ': 'ZG',
  'JOSUE': 'JB', 'BAUTISTA': 'JB',
  'JAIME': 'JA', 'AVALOS': 'JA',
  'LUIS': 'LT', 'TEO': 'LT',
  'BYRON': 'BJ', 'JEREZ': 'BJ',
  'OSCAR': 'OQ', 'QUAN': 'OQ'
};

/**
 * Extrae o resuelve el código del capacitador a partir de la celda de capacitador y la descripción.
 */
export function extractTrainerCode(trainerRaw, desc = '', knownCodes = []) {
  const codesList = knownCodes.length > 0 ? knownCodes : Object.keys(DEFAULT_TRAINER_IDS);

  // 1. Limpieza y análisis de trainerRaw (columna C del día)
  if (trainerRaw) {
    const clean = String(trainerRaw).replace(/[\r\n\t]/g, ' ').trim().toUpperCase();
    
    // Coincidencia directa exacta
    if (codesList.includes(clean)) {
      return clean;
    }

    // Coincidencia por nombre completo o primer nombre en celda de capacitador
    for (const [nameKey, code] of Object.entries(TRAINER_NAME_KEYWORDS)) {
      if (clean.includes(nameKey) && codesList.includes(code)) {
        return code;
      }
    }

    // Si viene compuesto o con guiones (ej. "OQ- MO-JB-BJ", "MO / OQ", "OQ MF CJ")
    // Dar prioridad a cualquier capacitador asignado que NO sea OQ
    const tokens = clean.split(/[\s\-/,|;]+/).filter(Boolean);
    const nonOq = tokens.find(t => codesList.includes(t) && t !== 'OQ');
    if (nonOq) return nonOq;

    const anyMatch = tokens.find(t => codesList.includes(t));
    if (anyMatch) return anyMatch;

    // Si es un código limpio de 2 a 3 letras alfabéticas
    if (/^[A-Z]{2,3}$/.test(clean)) {
      return clean;
    }
  }

  // 2. Búsqueda secundaria inteligente dentro del texto de la descripción
  if (desc) {
    const cleanDesc = String(desc).replace(/\s+/g, ' ').trim().toUpperCase();

    // Patrón 2A: Iniciales entre corchetes o paréntesis, ej: "[MO]", "(PF)", "[LT]"
    const bracketMatch = cleanDesc.match(/(?:\[|\()([A-Z]{2,3})(?:\]|\))/);
    if (bracketMatch && codesList.includes(bracketMatch[1])) {
      return bracketMatch[1];
    }

    // Patrón 2B: Iniciales explícitas al final del texto, ej: "LA POPULAR VIRTUAL 14 A 17 LT" o "INTECAP CURSO MO"
    const endMatch = cleanDesc.match(/\b([A-Z]{2,3})\s*$/);
    if (endMatch && codesList.includes(endMatch[1])) {
      return endMatch[1];
    }

    // Patrón 2C: Iniciales como palabra aislada en el texto (revisando los demás antes que OQ)
    for (const code of codesList) {
      if (code === 'OQ') continue;
      const wordRegex = new RegExp(`(?:^|[^A-Z])${code}(?:[^A-Z]|$)`);
      if (wordRegex.test(cleanDesc)) {
        return code;
      }
    }

    // Patrón 2D: Coincidencia por nombre del capacitador en la descripción (revisando los demás antes que OQ)
    for (const [nameKey, code] of Object.entries(TRAINER_NAME_KEYWORDS)) {
      if (nameKey !== 'OSCAR' && nameKey !== 'QUAN' && cleanDesc.includes(nameKey) && codesList.includes(code)) {
        return code;
      }
    }

    // Si contiene explícitamente OQ en la descripción
    if (/(?:^|[^A-Z])OQ(?:[^A-Z]|$)/.test(cleanDesc)) {
      return 'OQ';
    }
  }

  // 3. Fallback estándar si no se especificó capacitador
  return 'OQ';
}

/**
 * Parsea una hoja de mes específica del libro de trabajo AD-RE-11
 */
export function parseMonthSheet(workbook, sheetName, clientsCatalog = [], options = {}) {
  const {
    excludeZeroHours = true,
    trainerMapping = {}, // ej: { 'OQ': 2, 'LT': 7 }
    defaultState = 'Programada' // 'Programada' o 'Impartida'
  } = options;

  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    throw new Error(`La hoja "${sheetName}" no existe en el libro de trabajo.`);
  }

  const monthInfo = parseSheetMonthInfo(sheetName);
  const year = monthInfo ? monthInfo.year : 2026;
  const monthNum = monthInfo ? monthInfo.month : 6;

  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  // 1. Detectar filas de cabecera de semanas (soporta formato estándar de 3 columnas o 1 columna por día)
  const weekHeaders = [];
  rows.forEach((r, idx) => {
    if (!r || !Array.isArray(r)) return;
    const matchingCols = [];
    r.forEach((cell, colIdx) => {
      const val = String(cell || '').toUpperCase().trim();
      const isDayName = DAY_NAMES.some(d => val.includes(d));
      if (isDayName) {
        const numMatch = val.match(/(\d{1,2})/);
        if (numMatch) {
          matchingCols.push({
            col: colIdx,
            day: parseInt(numMatch[1], 10),
            name: String(cell).trim()
          });
        }
      }
    });

    if (matchingCols.length >= 1) {
      let step = 3;
      if (matchingCols.length >= 2) {
        const diff = matchingCols[1].col - matchingCols[0].col;
        if (diff >= 1 && diff <= 4) {
          step = diff;
        }
      }
      weekHeaders.push({ rowIndex: idx, days: matchingCols, step });
    }
  });

  const validCitas = [];
  const excludedCitas = [];
  const specialEvents = [];
  const detectedTrainerCodes = new Set();
  const detectedClientNames = new Set();
  const newClientsSet = new Map();

  const effectiveTrainerMap = {
    ...DEFAULT_TRAINER_IDS,
    ...trainerMapping
  };

  // 2. Extraer citas recorriendo las semanas
  weekHeaders.forEach((wh, wIdx) => {
    const nextHeader = weekHeaders[wIdx + 1];
    const endRow = nextHeader ? nextHeader.rowIndex - 1 : Math.min(wh.rowIndex + 14, rows.length - 1);

    for (let r = wh.rowIndex + 1; r <= endRow; r++) {
      const row = rows[r];
      if (!row) continue;

      const firstCell = String(row[0] || '').toUpperCase().trim();
      if (firstCell.includes('TOTAL') || firstCell.includes('RESUMEN')) break;

      wh.days.forEach(d => {
        const desc = String(row[d.col] || '').replace(/\s+/g, ' ').trim();
        const hoursRaw = wh.step >= 2 ? String(row[d.col + 1] || '').trim() : '';
        const trainerRaw = wh.step >= 3 ? String(row[d.col + 2] || '').trim().toUpperCase() : '';

        if (!desc) return;

        // Evitar que cabeceras duplicadas se tomen como citas
        if (DAY_NAMES.some(dn => desc.toUpperCase().includes(dn) && /\d/.test(desc))) return;

        const dateStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
        // Soporte robusto de decimales en español (ej: "4,5" -> 4.5)
        let hoursNum = parseFloat(String(hoursRaw).replace(',', '.')) || 0;

        // Solo si la plantilla de la hoja es de 1 sola columna por día (sin columna H) se infieren las horas del texto
        if (wh.step === 1 && hoursNum <= 0) {
          const { hora_inicio, hora_fin } = extractHorariosFromDesc(desc);
          if (hora_inicio && hora_fin && hora_inicio !== hora_fin) {
            const [h1, m1] = hora_inicio.split(':').map(Number);
            const [h2, m2] = hora_fin.split(':').map(Number);
            const diff = (h2 + m2 / 60) - (h1 + m1 / 60);
            if (diff > 0 && diff <= 16) {
              hoursNum = parseFloat(diff.toFixed(2));
            }
          }
        }

        // Si en la descripción se indica explícitamente 0 horas (ej. "0 H", "0 HORAS", "CERO HORAS")
        if (/\b0\s*(?:H|HRS|HORAS)\b/i.test(desc) || /\bCERO\s*HORAS\b/i.test(desc)) {
          hoursNum = 0;
        }

        const isBlocked = /BLOQUEADO/i.test(desc);
        const isZeroHours = hoursNum <= 0;

        // Detección de asuetos y festividades especiales
        if (/DIA DEL TRABAJO|DIA DE LA MADRE|SEMANA SANTA|INDEPENDENCIA|NAVIDAD|AÑO NUEVO/i.test(desc)) {
          specialEvents.push({
            date: dateStr,
            day: d.day,
            name: d.name,
            desc
          });
          return;
        }

        // Extracción inteligente del capacitador (columna C o texto en la descripción)
        const trainerCode = extractTrainerCode(trainerRaw, desc, Object.keys(effectiveTrainerMap));
        detectedTrainerCodes.add(trainerCode);

        const { hora_inicio, hora_fin } = extractHorariosFromDesc(desc);
        const modalidad = detectModalidad(desc);
        const tipo_servicio = detectTipoServicio(desc);

        // Cruce con catálogo de clientes
        const { client, suggestedName } = matchClient(desc, clientsCatalog);
        detectedClientNames.add(suggestedName);

        if (!client) {
          newClientsSet.set(suggestedName.toUpperCase(), suggestedName);
        }

        const capacitadorId = effectiveTrainerMap[trainerCode] || DEFAULT_TRAINER_IDS[trainerCode] || 2;

        const citaObj = {
          fecha: dateStr,
          dia_nombre: d.name,
          hora_inicio,
          hora_fin,
          horas: hoursNum,
          cliente_id: client ? client.id : null,
          cliente_nombre: client ? client.nombre_empresa : suggestedName,
          is_new_client: !client,
          capacitador_id: capacitadorId,
          capacitador_iniciales: trainerCode,
          modalidad,
          tipo_servicio,
          estado: defaultState,
          observaciones: desc,
          bitacora: defaultState === 'Impartida' ? `Servicio impartido conforme a programación AD-RE-11: ${desc}` : null,
          isBlocked,
          isZeroHours
        };

        if ((excludeZeroHours && isZeroHours) || isBlocked) {
          excludedCitas.push({
            ...citaObj,
            reason: isBlocked ? 'Horario bloqueado' : '0 horas (reunión corta / no computable)'
          });
        } else {
          validCitas.push(citaObj);
        }
      });
    }
  });

  // 2B. Fallback: Si no tiene formato de cuadrícula semanal AD-RE-11, intentar como tabla plana (1 fila = 1 cita)
  if (weekHeaders.length === 0 && rows.length > 1) {
    let headerRowIdx = -1;
    let colMap = {};
    for (let r = 0; r < Math.min(10, rows.length); r++) {
      const row = rows[r];
      if (!Array.isArray(row)) continue;
      const colMapCandidate = {};
      row.forEach((c, idx) => {
        const val = String(c || '').toUpperCase().trim();
        if (val.includes('FECHA')) colMapCandidate.fecha = idx;
        else if (val.includes('HORA INI') || val === 'INICIO') colMapCandidate.hora_inicio = idx;
        else if (val.includes('HORA FIN') || val === 'FIN') colMapCandidate.hora_fin = idx;
        else if (val.includes('HORA') || val === 'H') colMapCandidate.horas = idx;
        else if (val.includes('CAPACITADOR') || val.includes('INICIAL')) colMapCandidate.capacitador = idx;
        else if (val.includes('CLIENTE') || val.includes('EMPRESA')) colMapCandidate.cliente = idx;
        else if (val.includes('MODALIDAD')) colMapCandidate.modalidad = idx;
        else if (val.includes('SERVICIO') || val.includes('TIPO')) colMapCandidate.tipo_servicio = idx;
        else if (val.includes('OBS') || val.includes('DESC')) colMapCandidate.observaciones = idx;
      });
      if (colMapCandidate.fecha !== undefined && (colMapCandidate.cliente !== undefined || colMapCandidate.observaciones !== undefined)) {
        headerRowIdx = r;
        colMap = colMapCandidate;
        break;
      }
    }

    if (headerRowIdx !== -1) {
      for (let r = headerRowIdx + 1; r < rows.length; r++) {
        const row = rows[r];
        if (!row || !Array.isArray(row)) continue;
        const rawDate = row[colMap.fecha];
        if (!rawDate) continue;

        let dateStr = '';
        if (typeof rawDate === 'number') {
          const jsDate = new Date(Math.round((rawDate - 25569) * 86400 * 1000));
          if (!isNaN(jsDate.getTime())) {
            dateStr = jsDate.toISOString().split('T')[0];
          }
        } else {
          const s = String(rawDate).trim();
          if (/^\d{4}-\d{2}-\d{2}/.test(s)) dateStr = s.slice(0, 10);
          else if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(s)) {
            const parts = s.split('/');
            dateStr = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          }
        }
        if (!dateStr) continue;

        const rawHours = colMap.horas !== undefined ? String(row[colMap.horas] || '').replace(',', '.') : '';
        let hoursNum = parseFloat(rawHours) || 0;
        const rawDesc = colMap.observaciones !== undefined ? String(row[colMap.observaciones] || '').trim() : '';
        const rawTrainer = colMap.capacitador !== undefined ? String(row[colMap.capacitador] || '').trim() : '';
        const rawClient = colMap.cliente !== undefined ? String(row[colMap.cliente] || '').trim() : '';

        const trainerCode = extractTrainerCode(rawTrainer, rawDesc, Object.keys(effectiveTrainerMap));
        detectedTrainerCodes.add(trainerCode);

        const { client, suggestedName } = matchClient(rawClient || rawDesc, clientsCatalog);
        detectedClientNames.add(suggestedName);
        if (!client) {
          newClientsSet.set(suggestedName.toUpperCase(), suggestedName);
        }

        const { hora_inicio, hora_fin } = extractHorariosFromDesc(rawDesc);
        const hIni = (colMap.hora_inicio !== undefined && String(row[colMap.hora_inicio]).trim()) || hora_inicio;
        const hFin = (colMap.hora_fin !== undefined && String(row[colMap.hora_fin]).trim()) || hora_fin;

        if (hoursNum <= 0 && hIni && hFin && hIni !== hFin) {
          const [h1, m1] = hIni.split(':').map(Number);
          const [h2, m2] = hFin.split(':').map(Number);
          const diff = (h2 + m2 / 60) - (h1 + m1 / 60);
          if (diff > 0 && diff <= 16) hoursNum = parseFloat(diff.toFixed(2));
        }

        const isBlocked = /BLOQUEADO/i.test(rawDesc);
        const isZeroHours = hoursNum <= 0;
        const capacitadorId = effectiveTrainerMap[trainerCode] || DEFAULT_TRAINER_IDS[trainerCode] || 2;

        const citaObj = {
          fecha: dateStr,
          dia_nombre: '',
          hora_inicio: hIni,
          hora_fin: hFin,
          horas: hoursNum,
          cliente_id: client ? client.id : null,
          cliente_nombre: client ? client.nombre_empresa : suggestedName,
          is_new_client: !client,
          capacitador_id: capacitadorId,
          capacitador_iniciales: trainerCode,
          modalidad: (colMap.modalidad !== undefined && String(row[colMap.modalidad]).trim()) || detectModalidad(rawDesc),
          tipo_servicio: (colMap.tipo_servicio !== undefined && String(row[colMap.tipo_servicio]).trim()) || detectTipoServicio(rawDesc),
          estado: defaultState,
          observaciones: rawDesc || rawClient,
          bitacora: defaultState === 'Impartida' ? `Servicio importado: ${rawDesc}` : null,
          isBlocked,
          isZeroHours
        };

        if ((excludeZeroHours && isZeroHours) || isBlocked) {
          excludedCitas.push({ ...citaObj, reason: isBlocked ? 'Horario bloqueado' : '0 horas' });
        } else {
          validCitas.push(citaObj);
        }
      }
    }
  }

  // 3. Totales y estadísticas
  const totalHoras = validCitas.reduce((acc, c) => acc + c.horas, 0);
  const trainerHours = {};
  validCitas.forEach(c => {
    trainerHours[c.capacitador_iniciales] = (trainerHours[c.capacitador_iniciales] || 0) + c.horas;
  });

  return {
    monthInfo,
    validCitas,
    excludedCitas,
    specialEvents,
    detectedTrainerCodes: Array.from(detectedTrainerCodes),
    detectedClientNames: Array.from(detectedClientNames),
    newClients: Array.from(newClientsSet.values()),
    stats: {
      totalValid: validCitas.length,
      totalExcluded: excludedCitas.length,
      totalHours: parseFloat(totalHoras.toFixed(2)),
      trainerHours
    }
  };
}
