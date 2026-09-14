const { describe, it } = require('node:test');
const assert = require('node:assert');

/**
 * Función canónica de detección de traslapes en Agenda-One
 */
function verificarTraslapeCitas(candidata, listaExistente) {
  const fStart = String(candidata.hora_inicio).slice(0, 5);
  const fEnd = String(candidata.hora_fin).slice(0, 5);

  if (fStart >= fEnd) return null; // Horario inválido
  if (candidata.estado === 'Cancelada') return null; // Citas canceladas no generan conflicto

  return listaExistente.find(c => {
    // 1. Mismo capacitador
    const sameCap = String(c.capacitador_id) === String(candidata.capacitador_id);
    // 2. Misma fecha
    const sameDate = String(c.fecha).split('T')[0] === String(candidata.fecha).split('T')[0];
    // 3. No colisionar contra sí misma si es una edición
    const notSelf = !candidata.id || Number(c.id) !== Number(candidata.id);
    
    if (!sameCap || !sameDate || !notSelf) return false;
    if (c.estado === 'Cancelada') return false; // Citas canceladas liberan el horario

    const cStart = String(c.hora_inicio).slice(0, 5);
    const cEnd = String(c.hora_fin).slice(0, 5);

    // Algoritmo de traslape de intervalos continuos: cStart < fEnd && cEnd > fStart
    return cStart < fEnd && cEnd > fStart;
  }) || null;
}

describe('Detección Inteligente de Traslapes y Conflictos de Horario', () => {
  const citasExistentes = [
    {
      id: 101,
      capacitador_id: 1, // Mariana Orellana
      fecha: '2026-09-14',
      hora_inicio: '08:00',
      hora_fin: '11:00',
      estado: 'Programada',
      cliente_nombre: 'Cliente Alpha'
    },
    {
      id: 102,
      capacitador_id: 1,
      fecha: '2026-09-14',
      hora_inicio: '14:00',
      hora_fin: '17:00',
      estado: 'Cancelada', // Esta cita está cancelada, su horario está liberado
      cliente_nombre: 'Cliente Beta'
    },
    {
      id: 103,
      capacitador_id: 2, // Oscar Quan
      fecha: '2026-09-14',
      hora_inicio: '08:00',
      hora_fin: '11:00',
      estado: 'Programada',
      cliente_nombre: 'Cliente Gamma'
    }
  ];

  it('debe detectar conflicto si una nueva cita se traslapa parcialmente con el inicio (07:30 a 09:00)', () => {
    const conflicto = verificarTraslapeCitas({
      capacitador_id: 1,
      fecha: '2026-09-14',
      hora_inicio: '07:30',
      hora_fin: '09:00',
      estado: 'Programada'
    }, citasExistentes);

    assert.notStrictEqual(conflicto, null);
    assert.strictEqual(conflicto.id, 101);
  });

  it('debe detectar conflicto si una nueva cita está completamente contenida (09:00 a 10:00)', () => {
    const conflicto = verificarTraslapeCitas({
      capacitador_id: 1,
      fecha: '2026-09-14',
      hora_inicio: '09:00',
      hora_fin: '10:00',
      estado: 'Programada'
    }, citasExistentes);

    assert.notStrictEqual(conflicto, null);
    assert.strictEqual(conflicto.id, 101);
  });

  it('debe PERMITIR citas consecutivas en el límite exacto (11:00 a 14:00 no debe colisionar con 08:00 a 11:00)', () => {
    const conflicto = verificarTraslapeCitas({
      capacitador_id: 1,
      fecha: '2026-09-14',
      hora_inicio: '11:00',
      hora_fin: '14:00',
      estado: 'Programada'
    }, citasExistentes);

    assert.strictEqual(conflicto, null);
  });

  it('debe PERMITIR agendar en un horario donde la cita previa esté "Cancelada" (14:00 a 17:00)', () => {
    const conflicto = verificarTraslapeCitas({
      capacitador_id: 1,
      fecha: '2026-09-14',
      hora_inicio: '14:00',
      hora_fin: '17:00',
      estado: 'Programada'
    }, citasExistentes);

    assert.strictEqual(conflicto, null);
  });

  it('debe PERMITIR el mismo horario si es con OTRO capacitador (Capacitador 3 en 08:00 a 11:00)', () => {
    const conflicto = verificarTraslapeCitas({
      capacitador_id: 3,
      fecha: '2026-09-14',
      hora_inicio: '08:00',
      hora_fin: '11:00',
      estado: 'Programada'
    }, citasExistentes);

    assert.strictEqual(conflicto, null);
  });

  it('al editar una cita, NO debe marcar colisión consigo misma', () => {
    const conflicto = verificarTraslapeCitas({
      id: 101, // Es la misma cita 101 siendo editada
      capacitador_id: 1,
      fecha: '2026-09-14',
      hora_inicio: '08:00',
      hora_fin: '11:30', // Extendiendo 30 minutos
      estado: 'Programada'
    }, citasExistentes);

    assert.strictEqual(conflicto, null);
  });
});
