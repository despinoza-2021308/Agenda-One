const db = require('../config/db');

/**
 * Reporte mensual consolidado agrupado por capacitador
 * Query params: ?year=2026&month=9
 */
async function getResumenMensual(req, res, next) {
  try {
    const today = new Date();
    const year = parseInt(req.query.year || today.getFullYear(), 10);
    const month = parseInt(req.query.month || (today.getMonth() + 1), 10);

    if (db.isPostgresConnected()) {
      const query = `
        SELECT 
          c.id AS capacitador_id,
          c.nombre_completo,
          c.iniciales,
          c.color,
          COUNT(ci.id)::INT AS total_citas,
          COALESCE(SUM(ci.horas), 0)::FLOAT AS total_horas,
          COALESCE(SUM(CASE WHEN ci.modalidad = 'Presencial' THEN ci.horas ELSE 0 END), 0)::FLOAT AS horas_presencial,
          COALESCE(SUM(CASE WHEN ci.modalidad = 'Virtual' THEN ci.horas ELSE 0 END), 0)::FLOAT AS horas_virtual,
          COALESCE(SUM(CASE WHEN ci.modalidad = 'Híbrida' THEN ci.horas ELSE 0 END), 0)::FLOAT AS horas_hibrida
        FROM capacitadores c
        LEFT JOIN citas ci ON c.id = ci.capacitador_id 
          AND EXTRACT(YEAR FROM ci.fecha) = $1 
          AND EXTRACT(MONTH FROM ci.fecha) = $2
        WHERE c.activo = TRUE
        GROUP BY c.id, c.nombre_completo, c.iniciales, c.color
        ORDER BY total_horas DESC, c.nombre_completo ASC
      `;

      const result = await db.pool.query(query, [year, month]);
      
      const stats = calcularKPIs(result.rows, year, month);
      return res.json({
        periodo: { year, month },
        resumenPorCapacitador: result.rows,
        kpis: stats
      });
    }

    // Modo respaldo en memoria
    const capacitadores = db.mockStore.capacitadores.filter(c => c.activo);
    const citasDelMes = db.mockStore.citas.filter(ci => {
      const [y, m] = ci.fecha.split('-').map(Number);
      return y === year && m === month;
    });

    const resumen = capacitadores.map(cap => {
      const citasCap = citasDelMes.filter(ci => ci.capacitador_id === cap.id);
      const total_citas = citasCap.length;
      const total_horas = citasCap.reduce((acc, curr) => acc + Number(curr.horas), 0);
      const horas_presencial = citasCap
        .filter(c => c.modalidad === 'Presencial')
        .reduce((acc, curr) => acc + Number(curr.horas), 0);
      const horas_virtual = citasCap
        .filter(c => c.modalidad === 'Virtual')
        .reduce((acc, curr) => acc + Number(curr.horas), 0);
      const horas_hibrida = citasCap
        .filter(c => c.modalidad === 'Híbrida')
        .reduce((acc, curr) => acc + Number(curr.horas), 0);

      return {
        capacitador_id: cap.id,
        nombre_completo: cap.nombre_completo,
        iniciales: cap.iniciales,
        color: cap.color,
        total_citas,
        total_horas: Math.round(total_horas * 100) / 100,
        horas_presencial: Math.round(horas_presencial * 100) / 100,
        horas_virtual: Math.round(horas_virtual * 100) / 100,
        horas_hibrida: Math.round(horas_hibrida * 100) / 100
      };
    }).sort((a, b) => b.total_horas - a.total_horas);

    const stats = calcularKPIs(resumen, year, month);

    return res.json({
      periodo: { year, month },
      resumenPorCapacitador: resumen,
      kpis: stats
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Reporte histórico acumulado de todos los tiempos
 */
async function getHistorico(req, res, next) {
  try {
    if (db.isPostgresConnected()) {
      const query = `
        SELECT 
          c.id AS capacitador_id,
          c.nombre_completo,
          c.iniciales,
          c.color,
          COUNT(ci.id)::INT AS total_citas_historico,
          COALESCE(SUM(ci.horas), 0)::FLOAT AS total_horas_historico
        FROM capacitadores c
        LEFT JOIN citas ci ON c.id = ci.capacitador_id
        WHERE c.activo = TRUE
        GROUP BY c.id, c.nombre_completo, c.iniciales, c.color
        ORDER BY total_horas_historico DESC
      `;
      const result = await db.pool.query(query);
      return res.json(result.rows);
    }

    // Modo respaldo
    const resumen = db.mockStore.capacitadores.filter(c => c.activo).map(cap => {
      const citasCap = db.mockStore.citas.filter(ci => ci.capacitador_id === cap.id);
      const total_citas_historico = citasCap.length;
      const total_horas_historico = citasCap.reduce((acc, curr) => acc + Number(curr.horas), 0);
      return {
        capacitador_id: cap.id,
        nombre_completo: cap.nombre_completo,
        iniciales: cap.iniciales,
        color: cap.color,
        total_citas_historico,
        total_horas_historico: Math.round(total_horas_historico * 100) / 100
      };
    }).sort((a, b) => b.total_horas_historico - a.total_horas_historico);

    return res.json(resumen);
  } catch (error) {
    next(error);
  }
}

function calcularKPIs(resumen, year, month) {
  const totalHorasMes = resumen.reduce((sum, item) => sum + item.total_horas, 0);
  const totalCitasMes = resumen.reduce((sum, item) => sum + item.total_citas, 0);
  const horasPresenciales = resumen.reduce((sum, item) => sum + item.horas_presencial, 0);
  const horasVirtuales = resumen.reduce((sum, item) => sum + item.horas_virtual, 0);
  const capacitadorTop = resumen.length > 0 && resumen[0].total_horas > 0 ? resumen[0] : null;

  return {
    totalHorasMes: Math.round(totalHorasMes * 100) / 100,
    totalCitasMes,
    horasPresenciales: Math.round(horasPresenciales * 100) / 100,
    horasVirtuales: Math.round(horasVirtuales * 100) / 100,
    porcentajePresencial: totalHorasMes > 0 ? Math.round((horasPresenciales / totalHorasMes) * 100) : 0,
    porcentajeVirtual: totalHorasMes > 0 ? Math.round((horasVirtuales / totalHorasMes) * 100) : 0,
    capacitadorTop: capacitadorTop ? {
      nombre: capacitadorTop.nombre_completo,
      iniciales: capacitadorTop.iniciales,
      color: capacitadorTop.color,
      horas: capacitadorTop.total_horas
    } : null
  };
}

module.exports = {
  getResumenMensual,
  getHistorico
};
