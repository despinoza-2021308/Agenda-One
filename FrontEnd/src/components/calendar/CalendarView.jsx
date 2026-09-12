import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  Building2, 
  MapPin, 
  Video, 
  Plus, 
  Filter, 
  CheckCircle2,
  Users,
  MessageSquare
} from 'lucide-react';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DAYS_OF_WEEK = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const DAY_NAMES_FULL = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const HOURS_OF_DAY = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', 
  '14:00', '15:00', '16:00', '17:00', '18:00'
];

export const STATUS_CONFIG = {
  'Programada': { label: 'Programada', emoji: '🗓️', badge: 'bg-blue-50 text-blue-700 border-blue-200/80', dot: 'bg-blue-500' },
  'En Curso': { label: 'En Curso', emoji: '⏳', badge: 'bg-amber-50 text-amber-700 border-amber-200/80', dot: 'bg-amber-500' },
  'Impartida': { label: 'Impartida', emoji: '✅', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/80', dot: 'bg-emerald-500' },
  'Cancelada': { label: 'Cancelada', emoji: '❌', badge: 'bg-rose-50 text-rose-700 border-rose-200/80 line-through', dot: 'bg-rose-500' },
  'Reprogramada': { label: 'Reprogramada', emoji: '🔄', badge: 'bg-purple-50 text-purple-700 border-purple-200/80', dot: 'bg-purple-500' }
};

export default function CalendarView({ 
  citas = [], 
  capacitadores = [], 
  onSelectCita, 
  onAddCitaDate,
  onOpenWhatsApp,
  currentDate,
  setCurrentDate 
}) {
  const [selectedCapacitadorId, setSelectedCapacitadorId] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [calendarMode, setCalendarMode] = useState('month'); // 'month' | 'day' | 'week' | 'list'

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  // Fecha actual en formato YYYY-MM-DD
  const currentDateStr = useMemo(() => {
    const y = currentDate.getFullYear();
    const m = String(currentDate.getMonth() + 1).padStart(2, '0');
    const d = String(currentDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [currentDate]);

  // Citas del día seleccionado
  const dayAppointments = useMemo(() => {
    return citas.filter(c => String(c.fecha).split('T')[0] === currentDateStr);
  }, [citas, currentDateStr]);

  // Capacitadores a mostrar en la vista diaria según filtro
  const displayedCapacitadores = useMemo(() => {
    if (selectedCapacitadorId === 'ALL') return capacitadores;
    return capacitadores.filter(cp => String(cp.id) === String(selectedCapacitadorId));
  }, [capacitadores, selectedCapacitadorId]);

  // Navegación de mes / día / semana
  const handlePrev = () => {
    if (calendarMode === 'day') {
      const prev = new Date(currentDate);
      prev.setDate(prev.getDate() - 1);
      setCurrentDate(prev);
    } else if (calendarMode === 'week') {
      const prevWeek = new Date(currentDate);
      prevWeek.setDate(prevWeek.getDate() - 7);
      setCurrentDate(prevWeek);
    } else {
      setCurrentDate(new Date(year, month - 1, 1));
    }
  };

  const handleNext = () => {
    if (calendarMode === 'day') {
      const next = new Date(currentDate);
      next.setDate(next.getDate() + 1);
      setCurrentDate(next);
    } else if (calendarMode === 'week') {
      const nextWeek = new Date(currentDate);
      nextWeek.setDate(nextWeek.getDate() + 7);
      setCurrentDate(nextWeek);
    } else {
      setCurrentDate(new Date(year, month + 1, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Filtrado de citas por capacitador y estado
  const filteredCitas = useMemo(() => {
    return citas.filter(c => {
      const matchCap = selectedCapacitadorId === 'ALL' || String(c.capacitador_id) === String(selectedCapacitadorId);
      const matchStatus = selectedStatus === 'ALL' || (c.estado || 'Programada') === selectedStatus;
      return matchCap && matchStatus;
    });
  }, [citas, selectedCapacitadorId, selectedStatus]);

  // Horas acumuladas efectivas según filtro actual en el mes (excluye citas canceladas)
  const totalHorasFiltradas = useMemo(() => {
    return filteredCitas
      .filter(c => c.estado !== 'Cancelada')
      .reduce((acc, c) => acc + (parseFloat(c.horas) || 0), 0);
  }, [filteredCitas]);

  // Estructura de días del mes para el calendario
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Ajustar para que la semana empiece en Lunes (0 = Domingo en JS -> convertimos a 0 = Lunes)
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const days = [];

    // Días del mes previo para rellenar
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      days.push({
        dayNumber: dayNum,
        dateString: dateStr,
        isCurrentMonth: false,
        date: new Date(year, month - 1, dayNum)
      });
    }

    // Días del mes actual
    const todayStr = new Date().toISOString().split('T')[0];
    for (let d = 1; d <= lastDayOfMonth.getDate(); d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dayNumber: d,
        dateString: dateStr,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        date: new Date(year, month, d)
      });
    }

    // Días del siguiente mes para completar las 5 o 6 filas (múltiplos de 7)
    const remainingDays = 7 - (days.length % 7);
    if (remainingDays < 7) {
      for (let nextDay = 1; nextDay <= remainingDays; nextDay++) {
        const dateStr = `${year}-${String(month + 2).padStart(2, '0')}-${String(nextDay).padStart(2, '0')}`;
        days.push({
          dayNumber: nextDay,
          dateString: dateStr,
          isCurrentMonth: false,
          date: new Date(year, month + 1, nextDay)
        });
      }
    }

    return days;
  }, [year, month]);

  return (
    <div className="space-y-4 flex-1 flex flex-col">
      {/* Barra de control superior: Filtros de capacitador y navegación */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Navegación de mes / año */}
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              <button
                onClick={handlePrev}
                title="Mes anterior"
                className="p-1.5 rounded-lg hover:bg-white text-slate-700 hover:text-slate-900 transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleToday}
                className="px-3 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 rounded-lg hover:bg-white transition-all"
              >
                Hoy
              </button>
              <button
                onClick={handleNext}
                title="Mes siguiente"
                className="p-1.5 rounded-lg hover:bg-white text-slate-700 hover:text-slate-900 transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {calendarMode === 'day' ? (
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight capitalize">
                  {DAY_NAMES_FULL[currentDate.getDay()]}, {currentDate.getDate()} de {MONTH_NAMES[month]}
                </h2>
                <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Turnos
                </span>
              </div>
            ) : (
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight capitalize">
                {MONTH_NAMES[month]} <span className="text-slate-400 font-normal">{year}</span>
              </h2>
            )}
          </div>

          {/* Estadísticas rápidas y selector de vista */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="bg-blue-50/80 border border-blue-100 px-3.5 py-1.5 rounded-xl flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-blue-800 font-medium">
                Total Horas:{' '}
                <strong className="text-blue-950 font-bold text-sm">{totalHorasFiltradas.toFixed(1)} h</strong>
              </span>
              <span className="text-blue-300">|</span>
              <span className="text-xs text-blue-700">
                {filteredCitas.length} citas
              </span>
            </div>

            {/* Selector de modo: Mes / Día (Turnos) / Lista */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setCalendarMode('month')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  calendarMode === 'month'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Mes
              </button>
              <button
                onClick={() => setCalendarMode('day')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  calendarMode === 'day'
                    ? 'bg-white text-blue-700 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Día (Turnos)</span>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              </button>
              <button
                onClick={() => setCalendarMode('list')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  calendarMode === 'list'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Lista
              </button>
            </div>

            {/* Botón WhatsApp */}
            {onOpenWhatsApp && (
              <button
                type="button"
                onClick={() => onOpenWhatsApp({ capacitadorId: selectedCapacitadorId !== 'ALL' ? selectedCapacitadorId : null })}
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-xs shadow-emerald-600/20 transition-all transform active:scale-95"
                title="Notificar agenda por WhatsApp"
              >
                <MessageSquare className="w-4 h-4 fill-white/25" />
                <span className="hidden sm:inline">WhatsApp</span>
              </button>
            )}
          </div>
        </div>

        {/* Filtro rápido por Capacitador (Iniciales y Colores) */}
        <div className="pt-3 border-t border-slate-100 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 shrink-0 mr-1">
            <Filter className="w-3.5 h-3.5" /> Filtrar:
          </span>

          <button
            onClick={() => setSelectedCapacitadorId('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 flex items-center gap-1.5 ${
              selectedCapacitadorId === 'ALL'
                ? 'bg-slate-900 text-white shadow-sm font-semibold'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Todos ({citas.length})
          </button>

          {capacitadores.map((cap) => {
            const isSelected = selectedCapacitadorId === String(cap.id);
            const countForCap = citas.filter(c => c.capacitador_id === cap.id).length;

            return (
              <button
                key={cap.id}
                onClick={() => setSelectedCapacitadorId(isSelected ? 'ALL' : String(cap.id))}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 flex items-center gap-2 border ${
                  isSelected
                    ? 'ring-2 ring-offset-1 font-semibold text-slate-900 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
                style={{
                  borderColor: isSelected ? cap.color : undefined,
                  backgroundColor: isSelected ? `${cap.color}15` : undefined
                }}
              >
                <span
                  className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold text-white shadow-xs"
                  style={{ backgroundColor: cap.color }}
                >
                  {cap.iniciales}
                </span>
                <span>{cap.nombre_completo.split(' ')[0]}</span>
                <span className="text-[10px] opacity-70">({countForCap})</span>
              </button>
            );
          })}
        </div>

        {/* Filtro rápido por Estado de la Cita */}
        <div className="pt-2.5 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-thin">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <span>Estado:</span>
          </span>

          <button
            onClick={() => setSelectedStatus('ALL')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 ${
              selectedStatus === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos
          </button>

          {Object.entries(STATUS_CONFIG).map(([stKey, stCfg]) => {
            const isSelected = selectedStatus === stKey;
            const countForStatus = citas.filter(c => {
              const matchesCap = selectedCapacitadorId === 'ALL' || String(c.capacitador_id) === String(selectedCapacitadorId);
              return matchesCap && (c.estado || 'Programada') === stKey;
            }).length;

            return (
              <button
                key={stKey}
                onClick={() => setSelectedStatus(isSelected ? 'ALL' : stKey)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 border ${
                  isSelected
                    ? `${stCfg.badge} ring-2 ring-offset-1 font-bold shadow-xs`
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <span>{stCfg.emoji}</span>
                <span>{stCfg.label}</span>
                <span className="text-[10px] opacity-75 font-mono">({countForStatus})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* VISTA DE CUADRÍCULA MENSUAL */}
      {calendarMode === 'month' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
          {/* Cabecera de días de la semana */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/75">
            {DAYS_OF_WEEK.map((day, idx) => (
              <div 
                key={day} 
                className={`py-2.5 text-center text-xs font-bold tracking-wider uppercase ${
                  idx >= 5 ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Días del calendario con celdas equilibradas y tarjetas de alta legibilidad */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 flex-1">
            {calendarDays.map((dayObj, index) => {
              const dayCitas = filteredCitas.filter(c => c.fecha === dayObj.dateString);
              const dayTotalHoras = dayCitas
                .filter(c => c.estado !== 'Cancelada')
                .reduce((acc, c) => acc + (parseFloat(c.horas) || 0), 0);

              return (
                <div
                  key={index}
                  className={`min-h-[145px] sm:min-h-[170px] lg:min-h-[185px] xl:min-h-[210px] 2xl:min-h-[240px] p-1.5 sm:p-2 flex flex-col transition-colors group relative ${
                    !dayObj.isCurrentMonth
                      ? 'bg-slate-50/40 text-slate-400'
                      : dayObj.isToday
                      ? 'bg-blue-50/30'
                      : 'hover:bg-slate-50/60'
                  }`}
                >
                  {/* Cabecera del día: Número y total de horas */}
                  <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-slate-100">
                    <span
                      className={`inline-flex items-center justify-center text-xs sm:text-sm font-bold rounded-md w-6 h-6 ${
                        dayObj.isToday
                          ? 'bg-blue-600 text-white font-black shadow-xs'
                          : !dayObj.isCurrentMonth
                          ? 'text-slate-400'
                          : 'text-slate-800'
                      }`}
                    >
                      {dayObj.dayNumber}
                    </span>

                    <div className="flex items-center gap-1">
                      {dayTotalHoras > 0 && (
                        <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-200/80 px-1.5 py-0.5 rounded shadow-2xs font-mono">
                          {dayTotalHoras}h
                        </span>
                      )}
                      {dayCitas.length > 0 && onOpenWhatsApp && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenWhatsApp({ date: dayObj.dateString, capacitadorId: selectedCapacitadorId !== 'ALL' ? selectedCapacitadorId : null });
                          }}
                          title={`Enviar agenda del ${dayObj.dateString} por WhatsApp`}
                          className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-emerald-50 text-emerald-600 rounded transition-opacity"
                        >
                          <MessageSquare className="w-3.5 h-3.5 fill-emerald-600/20" />
                        </button>
                      )}
                      <button
                        onClick={() => onAddCitaDate(dayObj.dateString)}
                        title={`Agendar cita el ${dayObj.dateString}`}
                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-blue-50 text-blue-600 rounded transition-opacity"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                    </div>
                  </div>

                  {/* Lista de citas en el día (Diseño limpio, actividad concreta destacada y legible) */}
                  <div className="flex-1 space-y-2 overflow-y-auto max-h-[260px] pr-0.5 scrollbar-thin">
                    {dayCitas.map((cita) => {
                      const color = cita.capacitador_color || '#3B82F6';
                      const estadoKey = cita.estado || 'Programada';
                      const estadoCfg = STATUS_CONFIG[estadoKey] || STATUS_CONFIG['Programada'];
                      const isCancelada = estadoKey === 'Cancelada';
                      const isImpartida = estadoKey === 'Impartida';
                      const fullTooltip = `Actividad: ${cita.observaciones || cita.tipo_servicio}\nEstado: ${estadoKey}\nCliente: ${cita.cliente_nombre}\nCapacitador: ${cita.capacitador_nombre} [${cita.capacitador_iniciales}]\nHorario: ${cita.hora_inicio} - ${cita.hora_fin} (${cita.horas}h)\nModalidad: ${cita.modalidad} | Tipo: ${cita.tipo_servicio}`;

                      return (
                        <div
                          key={cita.id}
                          onClick={() => onSelectCita(cita)}
                          role="button"
                          title={fullTooltip}
                          className={`w-full text-left p-2 sm:p-2.5 rounded-xl border shadow-2xs hover:shadow-md transition-all duration-150 space-y-1.5 cursor-pointer select-none group/card ${
                            isCancelada
                              ? 'bg-slate-50/90 border-dashed border-rose-200 opacity-70 hover:opacity-100 hover:border-rose-300'
                              : isImpartida
                              ? 'bg-emerald-50/20 border-slate-200/85 hover:border-emerald-300'
                              : 'bg-white border-slate-200/85 hover:border-slate-300'
                          }`}
                          style={{
                            borderLeftWidth: '4px',
                            borderLeftColor: isCancelada ? '#F43F5E' : color
                          }}
                        >
                          {/* Fila 1: Capacitador, Horario y Duración */}
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span
                                className="w-5 h-5 rounded-md text-[10px] font-black text-white flex items-center justify-center shrink-0 shadow-2xs leading-none"
                                style={{ backgroundColor: color }}
                                title={`Capacitador: ${cita.capacitador_nombre}`}
                              >
                                {cita.capacitador_iniciales}
                              </span>
                              <span className={`text-[11px] font-mono font-bold ${isCancelada ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                                {cita.hora_inicio} - {cita.hora_fin}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <span 
                                className={`text-[10px] font-black px-1.5 py-0.5 rounded font-mono ${
                                  isCancelada
                                    ? 'text-rose-500 bg-rose-50 border border-rose-200 line-through'
                                    : 'text-slate-800 bg-slate-100 border border-slate-200/80'
                                }`}
                              >
                                {cita.horas}h
                              </span>
                              {onOpenWhatsApp && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenWhatsApp({ cita });
                                  }}
                                  title="Enviar cita por WhatsApp"
                                  className="opacity-0 group-hover:opacity-100 hover:bg-emerald-100/70 text-emerald-600 p-0.5 rounded transition-opacity"
                                >
                                  <MessageSquare className="w-3 h-3 fill-emerald-600/20" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Fila 2: Insignia de Estado, Tipo de Servicio y Modalidad */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${estadoCfg.badge}`}>
                              <span>{estadoCfg.emoji}</span>
                              <span className="truncate max-w-[90px]">{estadoCfg.label}</span>
                            </span>

                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200/70 uppercase tracking-wider text-[9px]">
                              {cita.tipo_servicio}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                cita.modalidad === 'Presencial'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                                  : 'bg-blue-50 text-blue-700 border border-blue-200/80'
                              }`}
                            >
                              {cita.modalidad === 'Presencial' ? (
                                <MapPin className="w-2.5 h-2.5 text-emerald-600" />
                              ) : (
                                <Video className="w-2.5 h-2.5 text-blue-600" />
                              )}
                              {cita.modalidad}
                            </span>
                          </div>

                          {/* Fila 3: Actividad Concreta (Tema específico destacado) */}
                          <p className={`text-xs font-bold leading-snug line-clamp-2 ${isCancelada ? 'line-through text-slate-400 italic' : 'text-slate-900'}`}>
                            {cita.observaciones ? cita.observaciones : `${cita.tipo_servicio} Programado`}
                          </p>

                          {/* Fila 4: Cliente / Empresa */}
                          <div className="flex items-center gap-1 text-[11px] text-slate-600 font-medium truncate pt-1 border-t border-slate-100">
                            <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate text-slate-700 font-medium" title={cita.cliente_nombre}>
                              {cita.cliente_nombre}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VISTA DIARIA POR COLUMNAS DE CAPACITADOR ("AGENDA DE TURNOS") */}
      {calendarMode === 'day' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          
          {/* Banner de Resumen del Día */}
          <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-slate-50 border border-blue-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/25 shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <span>Agenda Diaria de Turnos en Paralelo</span>
                  <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {displayedCapacitadores.length} Capacitadores
                  </span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {dayAppointments.length} actividad(es) agendada(s) hoy · Total de {dayAppointments.reduce((acc, c) => acc + (parseFloat(c.horas) || 0), 0)} hrs asignadas
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600 bg-white border border-slate-200/80 px-3 py-1.5 rounded-xl shadow-2xs flex items-center gap-1.5">
                💡 <span className="hidden md:inline">Haz clic en cualquier espacio libre para agendar a esa hora</span>
                <span className="md:hidden">Toca un espacio libre para agendar</span>
              </span>
            </div>
          </div>

          {/* Cuadrícula de Turnos Horarios */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
            <div className="min-w-[820px]">
              
              {/* Encabezado de Columnas por Capacitador */}
              <div className="grid grid-cols-[88px_repeat(auto-fit,minmax(180px,1fr))] border-b border-slate-200 bg-slate-50/90 sticky top-0 z-10">
                <div className="p-3 text-center text-xs font-bold text-slate-500 border-r border-slate-200 uppercase tracking-wider flex items-center justify-center">
                  Horario
                </div>

                {displayedCapacitadores.map((cap) => {
                  const capCitasToday = dayAppointments.filter(c => String(c.capacitador_id) === String(cap.id));
                  const capHoursToday = capCitasToday.reduce((acc, c) => acc + (parseFloat(c.horas) || 0), 0);
                  const isFree = capHoursToday === 0;

                  return (
                    <div
                      key={cap.id}
                      className="p-3 border-r border-slate-200 last:border-r-0 flex flex-col justify-between gap-1.5 bg-slate-50/90"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white shrink-0 shadow-xs"
                            style={{ backgroundColor: cap.color }}
                          >
                            {cap.iniciales}
                          </span>
                          <span className="font-extrabold text-xs text-slate-900 truncate" title={cap.nombre_completo}>
                            {cap.nombre_completo}
                          </span>
                        </div>

                        {onOpenWhatsApp && (
                          <button
                            type="button"
                            onClick={() => onOpenWhatsApp({ date: currentDateStr, capacitadorId: cap.id })}
                            title={`Enviar agenda de hoy a ${cap.nombre_completo.split(' ')[0]} por WhatsApp`}
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors shrink-0"
                          >
                            <MessageSquare className="w-3.5 h-3.5 fill-emerald-600/20" />
                          </button>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        {isFree ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                            ✨ Totalmente Libre
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-full">
                            🕒 {capHoursToday}h ({capCitasToday.length} citas)
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-slate-400">
                          {cap.iniciales}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Filas de Horas */}
              <div className="divide-y divide-slate-100">
                {HOURS_OF_DAY.map((hStr) => {
                  const hourNum = parseInt(hStr.split(':')[0], 10);

                  return (
                    <div
                      key={hStr}
                      className="grid grid-cols-[88px_repeat(auto-fit,minmax(180px,1fr))] min-h-[76px]"
                    >
                      {/* Celda de Hora (Eje Izquierdo) */}
                      <div className="p-2 border-r border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center font-mono text-xs font-bold text-slate-600">
                        <span>{hStr}</span>
                        <span className="text-[10px] text-slate-400 font-normal">{hourNum >= 12 ? 'PM' : 'AM'}</span>
                      </div>

                      {/* Celdas por Capacitador */}
                      {displayedCapacitadores.map((cap) => {
                        // Buscar si alguna cita empieza en esta hora
                        const citaIniciando = dayAppointments.find(c => {
                          const sameCap = String(c.capacitador_id) === String(cap.id);
                          if (!sameCap) return false;
                          const startH = parseInt(String(c.hora_inicio).split(':')[0], 10);
                          return startH === hourNum;
                        });

                        // Buscar si alguna cita está en curso (empezó antes y termina después)
                        const citaEnCurso = !citaIniciando && dayAppointments.find(c => {
                          const sameCap = String(c.capacitador_id) === String(cap.id);
                          if (!sameCap) return false;
                          const startH = parseInt(String(c.hora_inicio).split(':')[0], 10);
                          const endH = parseInt(String(c.hora_fin).split(':')[0], 10);
                          const endM = parseInt(String(c.hora_fin).split(':')[1] || 0, 10);
                          const effectiveEndH = endM > 0 ? endH + 1 : endH;
                          return startH < hourNum && effectiveEndH > hourNum;
                        });

                        return (
                          <div
                            key={cap.id}
                            className="border-r border-slate-100 last:border-r-0 p-1.5 flex flex-col justify-center relative group"
                          >
                            {citaIniciando ? (
                              (() => {
                                const estKey = citaIniciando.estado || 'Programada';
                                const estCfg = STATUS_CONFIG[estKey] || STATUS_CONFIG['Programada'];
                                const isCanc = estKey === 'Cancelada';

                                return (
                                  <div
                                    onClick={() => onSelectCita(citaIniciando)}
                                    className={`w-full border-2 rounded-xl p-2.5 shadow-2xs hover:shadow-md transition-all cursor-pointer space-y-1.5 group/card relative ${
                                      isCanc
                                        ? 'bg-slate-50/90 border-dashed border-rose-300 opacity-70 hover:opacity-100'
                                        : 'bg-white border-blue-200 hover:border-blue-400'
                                    }`}
                                    style={{ borderLeftColor: isCanc ? '#F43F5E' : cap.color, borderLeftWidth: '4px' }}
                                  >
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="text-[11px] font-mono font-black text-slate-900 flex items-center gap-1">
                                        <Clock className="w-3 h-3 text-blue-600" />
                                        <span className={isCanc ? 'line-through text-slate-400' : ''}>
                                          {citaIniciando.hora_inicio} - {citaIniciando.hora_fin}
                                        </span>
                                      </span>
                                      <div className="flex items-center gap-1">
                                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded font-mono ${
                                          isCanc ? 'bg-rose-50 text-rose-600 border border-rose-200 line-through' : 'text-slate-800 bg-slate-100 border border-slate-200'
                                        }`}>
                                          {citaIniciando.horas}h
                                        </span>
                                        {onOpenWhatsApp && (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              onOpenWhatsApp({ cita: citaIniciando });
                                            }}
                                            title="Enviar por WhatsApp"
                                            className="opacity-0 group-hover/card:opacity-100 p-0.5 hover:bg-emerald-50 text-emerald-600 rounded transition-opacity"
                                          >
                                            <MessageSquare className="w-3.5 h-3.5 fill-emerald-600/20" />
                                          </button>
                                        )}
                                      </div>
                                    </div>

                                    <p className={`font-extrabold text-xs leading-snug line-clamp-2 ${isCanc ? 'line-through text-slate-400 italic' : 'text-slate-900'}`}>
                                      {citaIniciando.observaciones || `${citaIniciando.tipo_servicio} Programado`}
                                    </p>

                                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 gap-1">
                                      <span className="text-slate-600 font-medium truncate flex items-center gap-1" title={citaIniciando.cliente_nombre}>
                                        <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                                        <strong className="truncate text-slate-800">{citaIniciando.cliente_nombre}</strong>
                                      </span>
                                      <div className="flex items-center gap-1 shrink-0">
                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${estCfg.badge}`}>
                                          {estCfg.emoji} {estCfg.label}
                                        </span>
                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                                          citaIniciando.modalidad === 'Presencial' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                                        }`}>
                                          {citaIniciando.modalidad}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()
                            ) : citaEnCurso ? (
                              <div
                                onClick={() => onSelectCita(citaEnCurso)}
                                className="w-full h-full bg-blue-50/50 border-l-4 border-dashed border-blue-300 rounded-lg p-2 text-[11px] text-blue-800/80 font-medium flex items-center justify-between hover:bg-blue-100/50 transition-colors cursor-pointer"
                              >
                                <span className="truncate flex items-center gap-1">
                                  <span>↳</span>
                                  <span className="font-bold text-slate-800 truncate">{citaEnCurso.cliente_nombre}</span>
                                  <span className="text-slate-500 text-[10px]">({citaEnCurso.hora_inicio}-{citaEnCurso.hora_fin})</span>
                                </span>
                                <span className="text-[10px] text-blue-600 font-bold bg-white/70 px-1.5 py-0.5 rounded shrink-0">
                                  En curso
                                </span>
                              </div>
                            ) : (
                              /* Espacio libre con botón de agendamiento rápido */
                              <button
                                type="button"
                                onClick={() => {
                                  const endHourFormatted = `${String(Math.min(hourNum + 2, 18)).padStart(2, '0')}:00`;
                                  onAddCitaDate(currentDateStr, {
                                    capacitador_id: cap.id,
                                    hora_inicio: hStr,
                                    hora_fin: endHourFormatted,
                                    fecha: currentDateStr
                                  });
                                }}
                                className="w-full h-full min-h-[60px] rounded-xl border border-transparent hover:border-emerald-300 hover:border-dashed hover:bg-emerald-50/40 transition-all flex items-center justify-center group/slot cursor-pointer"
                                title={`Agendar a ${cap.nombre_completo.split(' ')[0]} el ${currentDateStr} a las ${hStr}`}
                              >
                                <div className="opacity-0 group-hover/slot:opacity-100 flex items-center gap-1.5 bg-white border border-emerald-300 px-2.5 py-1 rounded-lg text-emerald-700 text-xs font-bold shadow-xs transition-opacity transform group-hover/slot:scale-105">
                                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                                  <span>Agendar {hStr}</span>
                                </div>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

            </div>
          </div>

        </div>
      )}

      {/* VISTA DE LISTA DETALLADA */}
      {calendarMode === 'list' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900">
              Listado de Citas Agendadas ({filteredCitas.length})
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              Ordenadas por fecha ascendente
            </span>
          </div>

          {filteredCitas.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <CalendarIcon className="w-12 h-12 mx-auto mb-2 text-slate-300" />
              <p className="font-medium text-slate-600">No hay citas registradas para este periodo o filtro.</p>
              <button
                onClick={() => onAddCitaDate(new Date().toISOString().split('T')[0])}
                className="mt-3 text-xs font-semibold text-blue-600 hover:text-blue-700 underline"
              >
                + Registrar la primera cita
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 text-xs font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Fecha</th>
                    <th className="py-3 px-4">Horario</th>
                    <th className="py-3 px-4">Horas (H)</th>
                    <th className="py-3 px-4">Capacitador</th>
                    <th className="py-3 px-4">Cliente / Empresa</th>
                    <th className="py-3 px-4">Modalidad</th>
                    <th className="py-3 px-4">Servicio</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4">Observaciones</th>
                    <th className="py-3 px-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCitas.map((cita) => {
                    const color = cita.capacitador_color || '#3B82F6';
                    const estKey = cita.estado || 'Programada';
                    const estCfg = STATUS_CONFIG[estKey] || STATUS_CONFIG['Programada'];
                    const isCancelada = estKey === 'Cancelada';

                    return (
                      <tr
                        key={cita.id}
                        onClick={() => onSelectCita(cita)}
                        className={`hover:bg-slate-50 cursor-pointer transition-colors ${
                          isCancelada ? 'bg-slate-50/60 opacity-75' : ''
                        }`}
                      >
                        <td className="py-3 px-4 font-medium text-slate-900 whitespace-nowrap">
                          {cita.fecha}
                        </td>
                        <td className={`py-3 px-4 font-mono text-xs whitespace-nowrap ${isCancelada ? 'line-through text-slate-400' : 'text-slate-600'}`}>
                          {cita.hora_inicio} - {cita.hora_fin}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`font-bold px-2 py-0.5 rounded-md ${
                            isCancelada ? 'bg-rose-50 text-rose-600 line-through' : 'text-slate-900 bg-slate-100'
                          }`}>
                            {cita.horas} hrs
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-extrabold text-white shrink-0"
                              style={{ backgroundColor: isCancelada ? '#F43F5E' : color }}
                            >
                              {cita.capacitador_iniciales}
                            </span>
                            <span className="font-medium text-slate-800 text-xs">
                              {cita.capacitador_nombre}
                            </span>
                          </div>
                        </td>
                        <td className={`py-3 px-4 font-medium text-slate-900 ${isCancelada ? 'line-through text-slate-400' : ''}`}>
                          {cita.cliente_nombre}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                              cita.modalidad === 'Presencial'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {cita.modalidad === 'Presencial' ? (
                              <MapPin className="w-3 h-3" />
                            ) : (
                              <Video className="w-3 h-3" />
                            )}
                            {cita.modalidad}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-xs font-medium">
                            {cita.tipo_servicio}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${estCfg.badge}`}>
                            <span>{estCfg.emoji}</span>
                            <span>{estCfg.label}</span>
                          </span>
                        </td>
                        <td className={`py-3 px-4 text-xs max-w-xs truncate ${isCancelada ? 'line-through text-slate-400 italic' : 'text-slate-500'}`}>
                          {cita.observaciones || '-'}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {onOpenWhatsApp && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenWhatsApp({ cita });
                                }}
                                title="Enviar cita por WhatsApp"
                                className="p-1 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors"
                              >
                                <MessageSquare className="w-4 h-4 fill-emerald-600/20" />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectCita(cita);
                              }}
                              className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                            >
                              Editar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
