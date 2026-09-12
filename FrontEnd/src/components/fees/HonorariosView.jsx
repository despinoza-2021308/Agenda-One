import React, { useState, useMemo } from 'react';
import { 
  Banknote, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  Calendar, 
  Share2, 
  Printer, 
  ChevronDown, 
  ChevronUp, 
  ChevronLeft, 
  ChevronRight, 
  Edit3, 
  AlertCircle, 
  Coins, 
  Check, 
  X,
  FileSpreadsheet
} from 'lucide-react';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

/**
 * Formatea cantidades en Quetzales guatemaltecos (Q #,##0.00)
 */
export function formatQuetzales(amount) {
  const num = Number(amount) || 0;
  return `Q ${num.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function HonorariosView({
  citas = [],
  capacitadores = [],
  currentDate = new Date(2026, 8, 1),
  setCurrentDate,
  onSaveCapacitador,
  isAdmin = false,
  onOpenAdminLogin,
  onShowToast
}) {
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [expandedTrainers, setExpandedTrainers] = useState({});
  const [filterCapacitadorId, setFilterCapacitadorId] = useState('all');

  // Estado para edición rápida de tarifa por hora
  const [editingRateTrainer, setEditingRateTrainer] = useState(null);
  const [newRateValue, setNewRateValue] = useState('');
  const [savingRate, setSavingRate] = useState(false);
  const [rateError, setRateError] = useState(null);

  // Sincronizar fecha al navegar
  const handlePrevMonth = () => {
    let newMonth = selectedMonth - 1;
    let newYear = selectedYear;
    if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    }
    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
    if (setCurrentDate) setCurrentDate(new Date(newYear, newMonth, 1));
  };

  const handleNextMonth = () => {
    let newMonth = selectedMonth + 1;
    let newYear = selectedYear;
    if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    }
    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
    if (setCurrentDate) setCurrentDate(new Date(newYear, newMonth, 1));
  };

  // Toggle desglose de citas por capacitador
  const toggleExpand = (trainerId) => {
    setExpandedTrainers(prev => ({
      ...prev,
      [trainerId]: !prev[trainerId]
    }));
  };

  // Expandir o contraer todos
  const toggleAllExpand = (expand) => {
    const nextState = {};
    capacitadores.forEach(c => {
      nextState[c.id] = expand;
    });
    setExpandedTrainers(nextState);
  };

  // Filtrar citas correspondientes al mes y año seleccionados
  const citasDelMes = useMemo(() => {
    return (citas || []).filter(ci => {
      if (!ci.fecha) return false;
      const [y, m] = ci.fecha.split('-').map(Number);
      return y === selectedYear && (m - 1) === selectedMonth;
    });
  }, [citas, selectedYear, selectedMonth]);

  // Cálculo en tiempo real agrupado por capacitador
  const reportesHonorarios = useMemo(() => {
    const activeTrainers = (capacitadores || []).filter(c => c.activo !== false);

    return activeTrainers.map(cap => {
      const tarifaHora = Number(cap.tarifa_hora !== undefined && cap.tarifa_hora !== null ? cap.tarifa_hora : 150.00);
      
      // Todas las citas de este capacitador en el mes
      const citasCap = citasDelMes.filter(ci => Number(ci.capacitador_id) === Number(cap.id));
      
      // Citas válidas para cobro (excluye Canceladas)
      const citasEfectivas = citasCap.filter(ci => ci.estado !== 'Cancelada');
      const citasImpartidas = citasCap.filter(ci => ci.estado === 'Impartida');
      const citasProyectadas = citasCap.filter(ci => ci.estado === 'Programada' || ci.estado === 'En Curso' || ci.estado === 'Reprogramada' || !ci.estado);
      const citasCanceladas = citasCap.filter(ci => ci.estado === 'Cancelada');

      const totalHoras = citasEfectivas.reduce((acc, curr) => acc + (Number(curr.horas) || 0), 0);
      const horasImpartidas = citasImpartidas.reduce((acc, curr) => acc + (Number(curr.horas) || 0), 0);
      const horasProyectadas = citasProyectadas.reduce((acc, curr) => acc + (Number(curr.horas) || 0), 0);
      const horasCanceladas = citasCanceladas.reduce((acc, curr) => acc + (Number(curr.horas) || 0), 0);

      const totalHonorarios = Math.round(totalHoras * tarifaHora * 100) / 100;
      const honorariosDevengados = Math.round(horasImpartidas * tarifaHora * 100) / 100;
      const honorariosProyectados = Math.round(horasProyectadas * tarifaHora * 100) / 100;

      // Ordenar citas cronológicamente para el desglose
      const citasDetalle = [...citasCap].sort((a, b) => {
        const cmp = a.fecha.localeCompare(b.fecha);
        return cmp !== 0 ? cmp : (a.hora_inicio || '').localeCompare(b.hora_inicio || '');
      }).map(ci => {
        const horasNum = Number(ci.horas) || 0;
        const esCancelada = ci.estado === 'Cancelada';
        const subtotal = esCancelada ? 0 : Math.round(horasNum * tarifaHora * 100) / 100;
        return {
          ...ci,
          horasNum,
          subtotal,
          tarifaHora
        };
      });

      return {
        id: cap.id,
        nombre_completo: cap.nombre_completo,
        iniciales: cap.iniciales,
        color: cap.color,
        telefono: cap.telefono,
        tarifa_hora: tarifaHora,
        total_horas: Math.round(totalHoras * 100) / 100,
        horas_impartidas: Math.round(horasImpartidas * 100) / 100,
        horas_proyectadas: Math.round(horasProyectadas * 100) / 100,
        horas_canceladas: Math.round(horasCanceladas * 100) / 100,
        total_honorarios: totalHonorarios,
        honorarios_devengados: honorariosDevengados,
        honorarios_proyectados: honorariosProyectados,
        citas_total: citasCap.length,
        citas_impartidas_count: citasImpartidas.length,
        citas_detalle: citasDetalle
      };
    }).sort((a, b) => b.total_honorarios - a.total_honorarios);
  }, [capacitadores, citasDelMes]);

  // Totales Globales del Período
  const globalKPIs = useMemo(() => {
    const totalHonorarios = reportesHonorarios.reduce((sum, item) => sum + item.total_honorarios, 0);
    const totalDevengados = reportesHonorarios.reduce((sum, item) => sum + item.honorarios_devengados, 0);
    const totalProyectados = reportesHonorarios.reduce((sum, item) => sum + item.honorarios_proyectados, 0);
    const totalHoras = reportesHonorarios.reduce((sum, item) => sum + item.total_horas, 0);
    const totalHorasImpartidas = reportesHonorarios.reduce((sum, item) => sum + item.horas_impartidas, 0);
    const totalCitas = reportesHonorarios.reduce((sum, item) => sum + item.citas_total, 0);

    const porcentajeDevengado = totalHonorarios > 0 
      ? Math.round((totalDevengados / totalHonorarios) * 100) 
      : 0;

    return {
      totalHonorarios: Math.round(totalHonorarios * 100) / 100,
      totalDevengados: Math.round(totalDevengados * 100) / 100,
      totalProyectados: Math.round(totalProyectados * 100) / 100,
      totalHoras: Math.round(totalHoras * 100) / 100,
      totalHorasImpartidas: Math.round(totalHorasImpartidas * 100) / 100,
      totalCitas,
      porcentajeDevengado
    };
  }, [reportesHonorarios]);

  // Lista filtrada si el usuario selecciona un capacitador específico
  const trainersFiltrados = useMemo(() => {
    if (filterCapacitadorId === 'all') return reportesHonorarios;
    return reportesHonorarios.filter(t => String(t.id) === String(filterCapacitadorId));
  }, [reportesHonorarios, filterCapacitadorId]);

  // Iniciar ajuste de tarifa
  const handleStartEditRate = (trainer) => {
    if (!isAdmin && onOpenAdminLogin) {
      onOpenAdminLogin();
      return;
    }
    setEditingRateTrainer(trainer);
    setNewRateValue(trainer.tarifa_hora.toString());
    setRateError(null);
  };

  // Guardar ajuste de tarifa
  const handleSaveRate = async () => {
    if (!editingRateTrainer) return;
    const cleanRate = parseFloat(newRateValue);
    if (isNaN(cleanRate) || cleanRate < 0) {
      setRateError('Ingresa un valor numérico mayor o igual a 0');
      return;
    }

    setSavingRate(true);
    setRateError(null);
    try {
      if (onSaveCapacitador) {
        await onSaveCapacitador({
          ...editingRateTrainer,
          tarifa_hora: cleanRate
        }, editingRateTrainer.id);
      }
      setEditingRateTrainer(null);
      if (onShowToast) onShowToast(`Tarifa de ${editingRateTrainer.nombre_completo} actualizada a ${formatQuetzales(cleanRate)}/hr`);
    } catch (err) {
      setRateError(err.message || 'Error al guardar la tarifa');
    } finally {
      setSavingRate(false);
    }
  };

  // Enviar / Copiar Reporte WhatsApp para el capacitador
  const handleShareWhatsApp = (trainer) => {
    const mesNombre = MONTH_NAMES[selectedMonth];
    let mensaje = `*LIQUIDACIÓN DE HONORARIOS - AGENDA ONE*\n`;
    mensaje += `*Capacitador:* ${trainer.nombre_completo}\n`;
    mensaje += `*Período:* ${mesNombre} ${selectedYear}\n`;
    mensaje += `*Tarifa por hora:* ${formatQuetzales(trainer.tarifa_hora)}/hr\n`;
    mensaje += `------------------------------------\n`;
    mensaje += `*Total Horas Registradas:* ${trainer.total_horas.toFixed(2)} hrs\n`;
    mensaje += `*• Horas Impartidas:* ${trainer.horas_impartidas.toFixed(2)} hrs (${formatQuetzales(trainer.honorarios_devengados)})\n`;
    if (trainer.horas_proyectadas > 0) {
      mensaje += `*• Horas Programadas:* ${trainer.horas_proyectadas.toFixed(2)} hrs (${formatQuetzales(trainer.honorarios_proyectados)})\n`;
    }
    mensaje += `------------------------------------\n`;
    mensaje += `*TOTAL A COBRAR:* ${formatQuetzales(trainer.total_honorarios)}\n\n`;

    if (trainer.citas_detalle.length > 0) {
      mensaje += `*DESGLOSE DE SERVICIOS:*\n`;
      trainer.citas_detalle.forEach((ci, idx) => {
        const estadoTag = ci.estado === 'Cancelada' ? '❌ CANCELADA' : (ci.estado === 'Impartida' ? '✅ Impartida' : '⏳ ' + ci.estado);
        mensaje += `${idx + 1}. ${ci.fecha} | ${ci.cliente_nombre || 'Cliente'} | ${ci.horasNum.toFixed(1)}h | ${estadoTag} | ${formatQuetzales(ci.subtotal)}\n`;
      });
      mensaje += `\n`;
    }

    mensaje += `_Generado automáticamente por el Sistema de Agenda Centralizada AD-RE-11_`;

    if (trainer.telefono) {
      const cleanPhone = trainer.telefono.replace(/[^0-9]/g, '');
      const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(mensaje)}`;
      window.open(url, '_blank');
    } else {
      // Si no tiene teléfono configurado, copiar al portapapeles
      navigator.clipboard.writeText(mensaje).then(() => {
        if (onShowToast) onShowToast(`Reporte de honorarios de ${trainer.nombre_completo} copiado al portapapeles.`);
      }).catch(() => {
        alert(mensaje);
      });
    }
  };

  // Imprimir reporte de honorarios
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Barra Superior de Control y Navegación */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                Control de Honorarios por Capacitador
                <span className="text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 uppercase">
                  Quetzales (GTQ)
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cálculo en tiempo real basado en tarifas por hora oficiales y registro de citas del modelo AD-RE-11
              </p>
            </div>
          </div>
        </div>

        {/* Selector de Mes/Año y Acciones */}
        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
          {/* Navegador de Mes */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700">
            <button
              onClick={handlePrevMonth}
              title="Mes anterior"
              className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-3 py-1 text-xs font-bold text-slate-800 dark:text-slate-200 min-w-[130px] text-center">
              {MONTH_NAMES[selectedMonth]} {selectedYear}
            </div>
            <button
              onClick={handleNextMonth}
              title="Mes siguiente"
              className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Botón Imprimir / Exportar */}
          <button
            onClick={handlePrint}
            title="Imprimir resumen de honorarios"
            className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer no-print"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span className="hidden md:inline">Imprimir</span>
          </button>
        </div>
      </div>

      {/* Tarjetas de Métricas Globales (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Honorarios (Mes) */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-4 sm:p-5 text-white shadow-lg shadow-emerald-600/15 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-15 pointer-events-none">
            <Banknote className="w-28 h-28" />
          </div>
          <div className="flex items-center justify-between text-emerald-100 text-xs font-semibold mb-1">
            <span>Total Honorarios Acumulados</span>
            <Coins className="w-4 h-4 text-emerald-200" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            {formatQuetzales(globalKPIs.totalHonorarios)}
          </div>
          <div className="text-[11px] text-emerald-100/90 mt-2 flex items-center gap-1">
            <span>Mes: {MONTH_NAMES[selectedMonth]} {selectedYear}</span>
            <span className="inline-block w-1 h-1 rounded-full bg-emerald-300"></span>
            <span>{globalKPIs.totalCitas} citas totales</span>
          </div>
        </div>

        {/* KPI 2: Honorarios Devengados (Impartidas) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1">
            <span>Devengado (Impartidas)</span>
            <span className="p-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">
            {formatQuetzales(globalKPIs.totalDevengados)}
          </div>
          <div className="mt-2.5">
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
              <span>{globalKPIs.totalHorasImpartidas.toFixed(1)} hrs ejecutadas</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{globalKPIs.porcentajeDevengado}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(globalKPIs.porcentajeDevengado, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* KPI 3: Honorarios Proyectados (Programadas) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1">
            <span>Por Devengar (Programadas)</span>
            <span className="p-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">
            {formatQuetzales(globalKPIs.totalProyectados)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1">
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              {(globalKPIs.totalHoras - globalKPIs.totalHorasImpartidas).toFixed(1)} hrs
            </span>
            <span>pendientes de impartir</span>
          </p>
        </div>

        {/* KPI 4: Total Horas Facturables */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1">
            <span>Total Horas Facturables</span>
            <span className="p-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">
            {globalKPIs.totalHoras.toFixed(2)} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">hrs</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
            Excluye cancelaciones | En tiempo real
          </p>
        </div>
      </div>

      {/* Barra de Filtro de Capacitador y Acciones Rápidas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-100/70 dark:bg-slate-900/70 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 no-print transition-colors">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider pl-1">
            Filtrar Capacitador:
          </span>
          <select
            value={filterCapacitadorId}
            onChange={(e) => setFilterCapacitadorId(e.target.value)}
            className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Todos los Capacitadores ({reportesHonorarios.length})</option>
            {reportesHonorarios.map(t => (
              <option key={t.id} value={t.id}>
                {t.nombre_completo} ({formatQuetzales(t.tarifa_hora)}/h)
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => toggleAllExpand(true)}
            className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 px-2.5 py-1 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            Desplegar todo
          </button>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <button
            onClick={() => toggleAllExpand(false)}
            className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-2.5 py-1 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            Colapsar todo
          </button>
        </div>
      </div>

      {/* Listado de Capacitadores con Tarjetas y Desgloses */}
      <div className="space-y-4">
        {trainersFiltrados.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-10 text-center border border-slate-200 dark:border-slate-800">
            <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No se encontraron capacitadores activos.</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Registra o activa capacitadores en la pestaña de Capacitadores.</p>
          </div>
        ) : (
          trainersFiltrados.map((trainer) => {
            const isExpanded = !!expandedTrainers[trainer.id];
            const pctDevengadoTrainer = trainer.total_honorarios > 0
              ? Math.round((trainer.honorarios_devengados / trainer.total_honorarios) * 100)
              : 0;

            return (
              <div 
                key={trainer.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all overflow-hidden"
              >
                {/* Cabecera de la Tarjeta del Capacitador */}
                <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900">
                  
                  {/* Info del Capacitador */}
                  <div className="flex items-center gap-3.5">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-base font-extrabold text-white shadow-sm shrink-0"
                      style={{ backgroundColor: trainer.color }}
                    >
                      {trainer.iniciales}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-bold text-slate-900 dark:text-white text-base">
                          {trainer.nombre_completo}
                        </h2>
                        
                        {/* Tarifa Badge */}
                        <div 
                          className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/90 dark:border-emerald-800 px-2.5 py-0.5 rounded-full shadow-2xs"
                          title="Tarifa oficial por hora"
                        >
                          <Coins className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          <span>{formatQuetzales(trainer.tarifa_hora)} / hora</span>
                          <button
                            type="button"
                            onClick={() => handleStartEditRate(trainer)}
                            className="ml-1 p-0.5 hover:text-emerald-950 dark:hover:text-white rounded hover:bg-emerald-200/60 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer"
                            title="Modificar tarifa horaria"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                        <span className="font-mono text-slate-600 dark:text-slate-400 font-semibold">
                          Código: {trainer.iniciales}
                        </span>
                        <span>•</span>
                        <span>{trainer.citas_total} citas en {MONTH_NAMES[selectedMonth]}</span>
                        {trainer.telefono && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-emerald-700 dark:text-emerald-400 font-medium">
                              {trainer.telefono}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Resumen Financiero del Capacitador */}
                  <div className="flex items-center gap-4 sm:gap-6 flex-wrap justify-between lg:justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100 dark:border-slate-800">
                    
                    {/* Total Horas */}
                    <div className="text-left sm:text-right">
                      <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 block uppercase">
                        Horas Facturables
                      </span>
                      <span className="text-base font-extrabold text-slate-800 dark:text-slate-200">
                        {trainer.total_horas.toFixed(2)} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">hrs</span>
                      </span>
                    </div>

                    {/* Total a Cobrar (Quetzales) */}
                    <div className="text-left sm:text-right">
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 block uppercase">
                        Total Honorarios
                      </span>
                      <span className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-400 tracking-tight">
                        {formatQuetzales(trainer.total_honorarios)}
                      </span>
                    </div>

                    {/* Botones de Acción */}
                    <div className="flex items-center gap-2">
                      {/* Botón Compartir WhatsApp */}
                      <button
                        onClick={() => handleShareWhatsApp(trainer)}
                        title="Enviar estado de honorarios por WhatsApp"
                        className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all cursor-pointer no-print"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">WhatsApp</span>
                      </button>

                      {/* Botón Ver Desglose */}
                      <button
                        onClick={() => toggleExpand(trainer.id)}
                        className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                          isExpanded 
                            ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white' 
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                        title={isExpanded ? 'Ocultar desglose' : 'Ver desglose de citas'}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Barra de progreso de horas ejecutadas */}
                <div className="px-5 pb-3 pt-1 bg-slate-50/50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                    <span className="flex items-center gap-1.5">
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                        Devengado: {formatQuetzales(trainer.honorarios_devengados)}
                      </span>
                      <span>({trainer.horas_impartidas.toFixed(1)} hrs impartidas)</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="font-semibold text-blue-700 dark:text-blue-400">
                        Proyectado: {formatQuetzales(trainer.honorarios_proyectados)}
                      </span>
                      <span>({trainer.horas_proyectadas.toFixed(1)} hrs pendientes)</span>
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200/80 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${Math.min(pctDevengadoTrainer, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Desglose de Citas del Capacitador (Acordeón) */}
                {isExpanded && (
                  <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40 p-4 sm:p-5 animate-in slide-in-from-top-2 duration-150">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                        <FileSpreadsheet className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        Desglose de Citas y Cálculo de Honorarios ({trainer.citas_detalle.length})
                      </h3>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        Base: Horas × {formatQuetzales(trainer.tarifa_hora)}/hr
                      </span>
                    </div>

                    {trainer.citas_detalle.length === 0 ? (
                      <p className="text-xs text-slate-400 py-3 text-center italic">
                        No hay citas agendadas para este capacitador en el mes seleccionado.
                      </p>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold">
                              <th className="py-2.5 px-3">Fecha</th>
                              <th className="py-2.5 px-3">Horario</th>
                              <th className="py-2.5 px-3">Cliente / Empresa</th>
                              <th className="py-2.5 px-3">Servicio</th>
                              <th className="py-2.5 px-3 text-center">Modalidad</th>
                              <th className="py-2.5 px-3 text-center">Estado</th>
                              <th className="py-2.5 px-3 text-right">Horas</th>
                              <th className="py-2.5 px-3 text-right">Tarifa</th>
                              <th className="py-2.5 px-3 text-right">Subtotal (Q)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                            {trainer.citas_detalle.map((ci) => {
                              const isCanceled = ci.estado === 'Cancelada';
                              const isDone = ci.estado === 'Impartida';
                              return (
                                <tr 
                                  key={ci.id}
                                  className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors ${
                                    isCanceled ? 'bg-rose-50/30 dark:bg-rose-950/20 text-slate-400 dark:text-slate-500 line-through' : ''
                                  }`}
                                >
                                  <td className="py-2.5 px-3 font-mono font-semibold whitespace-nowrap">
                                    {ci.fecha}
                                  </td>
                                  <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 font-mono text-[11px] whitespace-nowrap">
                                    {ci.hora_inicio || '--:--'} - {ci.hora_fin || '--:--'}
                                  </td>
                                  <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white max-w-[200px] truncate">
                                    {ci.cliente_nombre || 'Cliente General'}
                                  </td>
                                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                                    {ci.tipo_servicio || 'Capacitación'}
                                  </td>
                                  <td className="py-2.5 px-3 text-center">
                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                      {ci.modalidad}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 text-center">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                      isDone ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300' :
                                      isCanceled ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 no-underline inline-block' :
                                      'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300'
                                    }`}>
                                      {ci.estado || 'Programada'}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                                    {ci.horasNum.toFixed(2)} h
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono text-slate-500 dark:text-slate-400">
                                    {formatQuetzales(trainer.tarifa_hora)}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                                    {isCanceled ? 'Q 0.00' : formatQuetzales(ci.subtotal)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot>
                            <tr className="bg-slate-50 dark:bg-slate-800/80 font-bold border-t border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                              <td colSpan={6} className="py-2.5 px-3 text-right uppercase text-[11px] text-slate-600 dark:text-slate-400">
                                Total Horas y Honorarios del Mes:
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-slate-900 dark:text-white">
                                {trainer.total_horas.toFixed(2)} h
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                                --
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-emerald-800 dark:text-emerald-400 text-sm font-extrabold">
                                {formatQuetzales(trainer.total_honorarios)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal Rápido de Modificación de Tarifa por Hora */}
      {editingRateTrainer && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Ajustar Tarifa por Hora</h3>
              </div>
              <button
                onClick={() => setEditingRateTrainer(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-extrabold text-white"
                  style={{ backgroundColor: editingRateTrainer.color }}
                >
                  {editingRateTrainer.iniciales}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">{editingRateTrainer.nombre_completo}</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Tarifa actual: {formatQuetzales(editingRateTrainer.tarifa_hora)}/hr</p>
                </div>
              </div>

              {rateError && (
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{rateError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Nueva Tarifa por Hora (Quetzales)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 dark:text-slate-400 font-bold text-xs">
                    Q
                  </div>
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    autoFocus
                    placeholder="200.00"
                    value={newRateValue}
                    onChange={(e) => setNewRateValue(e.target.value)}
                    className="w-full pl-8 pr-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                  El recálculo de honorarios se aplicará en tiempo real sobre todas las horas del mes.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingRateTrainer(null)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={savingRate}
                  onClick={handleSaveRate}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{savingRate ? 'Guardando...' : 'Actualizar Tarifa'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
