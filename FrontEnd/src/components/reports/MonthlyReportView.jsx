import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  MapPin, 
  Video,
  FileSpreadsheet,
  Clock,
  UserCheck
} from 'lucide-react';
import { api } from '../../services/api';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function MonthlyReportView({ initialDate = new Date() }) {
  const [selectedYear, setSelectedYear] = useState(initialDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(initialDate.getMonth() + 1); // 1-12
  const [reportData, setReportData] = useState(null);
  const [historicoData, setHistoricoData] = useState([]);
  const [activeSubTab, setActiveSubTab] = useState('monthly'); // 'monthly' | 'history'
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const [resMonthly, resHist] = await Promise.all([
        api.getResumenMensual(selectedYear, selectedMonth),
        api.getHistorico()
      ]);
      setReportData(resMonthly);
      setHistoricoData(resHist);
    } catch (err) {
      console.error('Error al cargar reportes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [selectedYear, selectedMonth]);

  // Exportar a archivo CSV compatible con Excel
  const handleExportCSV = async () => {
    try {
      const citas = await api.getCitas({ year: selectedYear, month: selectedMonth });
      
      const headers = [
        'ID Cita',
        'Fecha',
        'Hora Inicio',
        'Hora Fin',
        'Horas Efectivas (H)',
        'Iniciales',
        'Capacitador',
        'Cliente / Empresa',
        'Modalidad',
        'Tipo de Servicio',
        'Estado',
        'Descripción / Observaciones'
      ];

      const rows = citas.map(c => [
        c.id,
        `"${c.fecha}"`,
        `"${c.hora_inicio}"`,
        `"${c.hora_fin}"`,
        c.horas,
        `"${c.capacitador_iniciales || ''}"`,
        `"${c.capacitador_nombre || ''}"`,
        `"${c.cliente_nombre || ''}"`,
        `"${c.modalidad}"`,
        `"${c.tipo_servicio}"`,
        `"${c.estado || 'Programada'}"`,
        `"${(c.observaciones || '').replace(/"/g, '""')}"`
      ]);

      const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Reporte_Horas_Capacitadores_${selectedYear}_${String(selectedMonth).padStart(2, '0')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Error al exportar CSV: ' + err.message);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const resumen = reportData?.resumenPorCapacitador || [];
  const kpis = reportData?.kpis || { totalHorasMes: 0, totalCitasMes: 0, horasPresenciales: 0, horasVirtuales: 0 };

  return (
    <div className="space-y-6">
      
      {/* Barra de Filtros de Periodo y Acciones */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mes:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
              className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {MONTH_NAMES.map((name, idx) => (
                <option key={idx + 1} value={idx + 1}>{name}</option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[2024, 2025, 2026, 2027, 2028].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveSubTab('monthly')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === 'monthly' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mes Actual
            </button>
            <button
              onClick={() => setActiveSubTab('history')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === 'history' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Histórico
            </button>
          </div>
        </div>

        {/* Botones de Exportación e Impresión */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Exportar Excel</span>
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Reporte</span>
          </button>
        </div>
      </div>

      {/* Cabecera Oficial para Vista de Impresión */}
      <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">CONTROL DE HORAS POR CAPACITADOR</h1>
            <p className="text-xs text-slate-600 font-medium">Reporte Oficial de Citas Presenciales y Virtuales</p>
          </div>
          <div className="text-right">
            <span className="text-sm font-bold text-slate-900">Periodo: {MONTH_NAMES[selectedMonth - 1]} {selectedYear}</span>
            <p className="text-[10px] text-slate-500">Fecha Emisión: {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* TABLA PRINCIPAL: REPORTE DE HORAS POR CAPACITADOR */}
      {activeSubTab === 'monthly' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-600" />
                Reporte de Horas por Capacitador ({MONTH_NAMES[selectedMonth - 1]} {selectedYear})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Desglose de horas trabajadas discriminadas por modalidad (Presencial vs Virtual)
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs font-bold text-slate-600 hidden sm:flex flex-wrap justify-end">
              <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                ✅ {kpis.citasImpartidas || 0} impartidas
              </span>
              <span className="flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
                🗓️ {kpis.citasProgramadas || 0} programadas
              </span>
              {kpis.citasCanceladas > 0 && (
                <span className="flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200 line-through">
                  ❌ {kpis.citasCanceladas} canceladas
                </span>
              )}
              <span className="bg-slate-900 text-white px-2.5 py-1 rounded-lg font-black" title="Total de horas efectivas (excluye canceladas)">
                Total: {kpis.totalHorasMes}h
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-4 px-6">Capacitador</th>
                  <th className="py-4 px-4 text-center">Código</th>
                  <th className="py-4 px-4 text-center">Citas / Estado</th>
                  <th className="py-4 px-6 text-right text-emerald-700">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> Horas Presenciales
                    </span>
                  </th>
                  <th className="py-4 px-6 text-right text-purple-700">
                    <span className="inline-flex items-center gap-1">
                      <Video className="w-3.5 h-3.5" /> Horas Virtuales
                    </span>
                  </th>
                  <th className="py-4 px-6 text-right font-black text-slate-900 text-sm">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-4 h-4 text-blue-600" /> Total Horas (H)
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {resumen.map((cap) => {
                  return (
                    <tr key={cap.capacitador_id} className="hover:bg-slate-50/90 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-900 text-sm">
                        <div className="flex items-center gap-3">
                          <span
                            className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
                            style={{ backgroundColor: cap.color }}
                          />
                          <span>{cap.nombre_completo}</span>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <span
                          className="px-2.5 py-1 rounded-lg text-xs font-black text-white shadow-xs"
                          style={{ backgroundColor: cap.color }}
                        >
                          {cap.iniciales}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <div className="font-extrabold text-slate-900 text-sm">{cap.total_citas}</div>
                        <div className="flex items-center justify-center gap-1 text-[10px] font-bold mt-0.5 flex-wrap">
                          {(cap.citas_impartidas > 0) && (
                            <span className="text-emerald-700 bg-emerald-50 px-1 rounded" title="Impartidas">
                              ✅{cap.citas_impartidas}
                            </span>
                          )}
                          {(cap.citas_programadas > 0) && (
                            <span className="text-blue-700 bg-blue-50 px-1 rounded" title="Programadas">
                              🗓️{cap.citas_programadas}
                            </span>
                          )}
                          {(cap.citas_canceladas > 0) && (
                            <span className="text-rose-600 bg-rose-50 px-1 rounded line-through" title="Canceladas">
                              ❌{cap.citas_canceladas}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-6 text-right font-mono font-bold text-emerald-700 text-sm">
                        {cap.horas_presencial} hrs
                      </td>

                      <td className="py-4 px-6 text-right font-mono font-bold text-purple-700 text-sm">
                        {cap.horas_virtual} hrs
                      </td>

                      <td className="py-4 px-6 text-right font-mono font-black text-slate-950 text-base">
                        {cap.total_horas} hrs
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Fila de Totales Generales */}
              <tfoot className="bg-slate-100 font-black border-t-2 border-slate-300 text-slate-900">
                <tr>
                  <td className="py-4 px-6 uppercase tracking-wider text-xs font-extrabold text-slate-700">
                    TOTAL GENERAL ACUMULADO
                  </td>
                  <td className="py-4 px-4 text-center text-slate-400">-</td>
                  <td className="py-4 px-4 text-center text-slate-900 font-black text-base">
                    {kpis.totalCitasMes}
                  </td>
                  <td className="py-4 px-6 text-right font-mono text-emerald-800 text-base font-black">
                    {kpis.horasPresenciales} hrs
                  </td>
                  <td className="py-4 px-6 text-right font-mono text-purple-800 text-base font-black">
                    {kpis.horasVirtuales} hrs
                  </td>
                  <td className="py-4 px-6 text-right font-mono font-black text-blue-700 text-lg">
                    {kpis.totalHorasMes} hrs
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* PESTAÑA HISTÓRICO GENERAL */}
      {activeSubTab === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-900 text-base">
              Histórico Acumulado por Capacitador
            </h3>
            <p className="text-xs text-slate-500">
              Total acumulado de citas y horas desde el inicio de operaciones
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-4 px-6">Capacitador</th>
                  <th className="py-4 px-4 text-center">Código</th>
                  <th className="py-4 px-4 text-center">Total Citas Históricas</th>
                  <th className="py-4 px-6 text-right font-black text-slate-900">Total Horas Acumuladas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historicoData.map((item) => (
                  <tr key={item.capacitador_id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-900">
                      <div className="flex items-center gap-3">
                        <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span>{item.nombre_completo}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span
                        className="px-2.5 py-1 rounded-lg text-xs font-black text-white"
                        style={{ backgroundColor: item.color }}
                      >
                        {item.iniciales}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center font-bold text-slate-700">
                      {item.total_citas_historico}
                    </td>
                    <td className="py-4 px-6 text-right font-mono font-black text-blue-700 text-base">
                      {item.total_horas_historico} hrs
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
