import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  Users,
  MessageSquare,
  X,
  ExternalLink,
  ArrowLeft
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
  'Programada': { label: 'Programada', emoji: '🗓️', badge: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200/80 dark:border-blue-800', dot: 'bg-blue-500' },
  'En Curso': { label: 'En Curso', emoji: '⏳', badge: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800', dot: 'bg-amber-500' },
  'Impartida': { label: 'Impartida', emoji: '✅', badge: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800', dot: 'bg-emerald-500' },
  'Cancelada': { label: 'Cancelada', emoji: '❌', badge: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200/80 dark:border-rose-800 line-through', dot: 'bg-rose-500' },
  'Reprogramada': { label: 'Reprogramada', emoji: '🔄', badge: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200/80 dark:border-purple-800', dot: 'bg-purple-500' }
};

export default function CalendarView({ 
  citas = [], 
  capacitadores = [], 
  onSelectCita, 
  onAddCitaDate,
  onOpenWhatsApp,
  currentDate,
  setCurrentDate,
  selectedDayDetails: propSelectedDayDetails,
  onSelectDayDetails: propOnSelectDayDetails
}) {
  const [selectedCapacitadorId, setSelectedCapacitadorId] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [calendarMode, setCalendarMode] = useState('month'); // 'month' | 'day' | 'week' | 'list'
  const [localSelectedDayDetails, setLocalSelectedDayDetails] = useState(null);
  
  const selectedDayDetails = propSelectedDayDetails !== undefined ? propSelectedDayDetails : localSelectedDayDetails;
  const setSelectedDayDetails = propOnSelectDayDetails !== undefined ? propOnSelectDayDetails : setLocalSelectedDayDetails;

  // Formato largo de fecha para encabezados y modales
  const formatLongDate = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    const dayName = DAY_NAMES_FULL[dt.getDay()];
    const monthName = MONTH_NAMES[m - 1]?.toLowerCase();
    return `${dayName}, ${d} de ${monthName} de ${y}`;
  };

  // Cerrar modal de detalle de día al presionar Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && selectedDayDetails) {
        setSelectedDayDetails(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDayDetails]);

  // Bloquear scroll de la página para evitar desplazamientos y cortes de fondo con el modal abierto
  useEffect(() => {
    if (selectedDayDetails) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [selectedDayDetails]);

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

  // Citas del día seleccionado para el modal de detalle
  const modalDayCitas = useMemo(() => {
    if (!selectedDayDetails?.dateString) return [];
    return filteredCitas
      .filter(c => String(c.fecha || '').split('T')[0] === selectedDayDetails.dateString)
      .sort((a, b) => (a.hora_inicio || '').localeCompare(b.hora_inicio || ''));
  }, [filteredCitas, selectedDayDetails]);

  const modalDayTotalHoras = useMemo(() => {
    return modalDayCitas
      .filter(c => c.estado !== 'Cancelada')
      .reduce((acc, c) => acc + (parseFloat(c.horas) || 0), 0);
  }, [modalDayCitas]);

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
      <div className="glass-panel rounded-3xl p-4 sm:p-5 shadow-glass space-y-4 transition-all duration-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Navegación de mes / año */}
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/60 dark:border-white/5 backdrop-blur-md shadow-2xs">
              <button
                onClick={handlePrev}
                title="Mes anterior"
                className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleToday}
                className="px-3 py-1 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-white dark:hover:bg-slate-700 transition-all cursor-pointer"
              >
                Hoy
              </button>
              <button
                onClick={handleNext}
                title="Mes siguiente"
                className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {calendarMode === 'day' ? (
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setCalendarMode('month')}
                  className="p-1.5 rounded-xl bg-slate-100/80 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors group flex items-center gap-1 shrink-0 border border-slate-200/60 dark:border-white/5 cursor-pointer shadow-glass-sm"
                  title="Volver a la vista de mes"
                >
                  <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-bold hidden sm:inline">Mes</span>
                </button>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight capitalize">
                  {DAY_NAMES_FULL[currentDate.getDay()]}, {currentDate.getDate()} de {MONTH_NAMES[month]}
                </h2>
                <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50/80 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-2.5 py-0.5 rounded-full uppercase tracking-wider backdrop-blur-xs">
                  Turnos
                </span>
              </div>
            ) : calendarMode === 'list' ? (
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setCalendarMode('month')}
                  className="p-1.5 rounded-xl bg-slate-100/80 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors group flex items-center gap-1 shrink-0 border border-slate-200/60 dark:border-white/5 cursor-pointer shadow-glass-sm"
                  title="Volver a la vista de mes"
                >
                  <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-bold hidden sm:inline">Mes</span>
                </button>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight capitalize">
                  {MONTH_NAMES[month]} <span className="text-slate-400 dark:text-slate-500 font-normal">{year}</span>
                </h2>
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-0.5 rounded-full uppercase tracking-wider backdrop-blur-xs">
                  Lista
                </span>
              </div>
            ) : (
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight capitalize">
                {MONTH_NAMES[month]} <span className="text-slate-400 dark:text-slate-500 font-normal">{year}</span>
              </h2>
            )}
          </div>

          {/* Estadísticas rápidas y selector de vista */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/60 px-3.5 py-1.5 rounded-2xl flex items-center gap-2 backdrop-blur-md shadow-glass-sm">
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="text-xs text-blue-900 dark:text-blue-200 font-medium">
                Total Horas:{' '}
                <strong className="text-blue-950 dark:text-white font-extrabold text-sm">{totalHorasFiltradas.toFixed(1)} h</strong>
              </span>
              <span className="text-blue-300 dark:text-blue-700">|</span>
              <span className="text-xs text-blue-700 dark:text-blue-300 font-semibold">
                {filteredCitas.length} citas
              </span>
            </div>

            {/* Selector de modo: Mes / Día (Turnos) / Lista */}
            <div className="flex items-center bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/60 dark:border-white/5 backdrop-blur-md shadow-2xs">
              <button
                onClick={() => setCalendarMode('month')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  calendarMode === 'month'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-glass-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Mes
              </button>
              <button
                onClick={() => setCalendarMode('day')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  calendarMode === 'day'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-glass-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>Día (Turnos)</span>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
              </button>
              <button
                onClick={() => setCalendarMode('list')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  calendarMode === 'list'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-glass-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
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
                className="inline-flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-md shadow-emerald-600/25 transition-all transform active:scale-95 cursor-pointer"
                title="Notificar agenda por WhatsApp"
              >
                <MessageSquare className="w-4 h-4 fill-white/25" />
                <span className="hidden sm:inline">WhatsApp</span>
              </button>
            )}
          </div>
        </div>

        {/* Filtro rápido por Capacitador (Iniciales y Colores) */}
        <div className="pt-3 border-t border-slate-200/60 dark:border-white/5 flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin touch-pan-x pr-4">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1 shrink-0 mr-1">
            <Filter className="w-3.5 h-3.5" /> Filtrar:
          </span>

          <button
            onClick={() => setSelectedCapacitadorId('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer shadow-glass-sm ${
              selectedCapacitadorId === 'ALL'
                ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-md'
                : 'glass-pill text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
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
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 border shadow-glass-sm cursor-pointer ${
                  isSelected
                    ? 'ring-2 ring-offset-1 dark:ring-offset-slate-900 text-slate-900 dark:text-white shadow-md'
                    : 'border-slate-200/80 dark:border-slate-700/80 bg-white/70 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
                }`}
                style={{
                  borderColor: isSelected ? cap.color : undefined,
                  backgroundColor: isSelected ? `${cap.color}18` : undefined
                }}
              >
                <span
                  className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black text-white shadow-xs"
                  style={{ backgroundColor: cap.color }}
                >
                  {cap.iniciales}
                </span>
                <span>{cap.nombre_completo.split(' ')[0]}</span>
                <span className="text-[10px] opacity-75 font-mono">({countForCap})</span>
              </button>
            );
          })}
        </div>

        {/* Filtro rápido por Estado de la Cita */}
        <div className="pt-2.5 border-t border-slate-200/60 dark:border-white/5 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin touch-pan-x pr-4">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <span>Estado:</span>
          </span>

          <button
            onClick={() => setSelectedStatus('ALL')}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-glass-sm ${
              selectedStatus === 'ALL'
                ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-xs'
                : 'glass-pill text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'
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
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 border cursor-pointer shadow-glass-sm ${
                  isSelected
                    ? `${stCfg.badge} ring-2 ring-offset-1 dark:ring-offset-slate-900 shadow-md`
                    : 'border-slate-200/80 dark:border-slate-700/80 bg-white/70 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
                }`}
              >
                <span>{stCfg.emoji}</span>
                <span>{stCfg.label}</span>
                <span className="text-[10px] opacity-80 font-mono">({countForStatus})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* VISTA DE CUADRÍCULA MENSUAL */}
      {calendarMode === 'month' && (
        <div className="glass-panel rounded-3xl border border-white/80 dark:border-white/10 shadow-glass overflow-hidden flex-1 flex flex-col transition-all duration-200">
          {/* Cabecera de días de la semana */}
          <div className="grid grid-cols-7 border-b border-slate-200/60 dark:border-white/10 bg-slate-100/50 dark:bg-slate-800/40 backdrop-blur-md">
            {DAYS_OF_WEEK.map((day, idx) => (
              <div 
                key={day} 
                className={`py-2.5 text-center text-xs font-extrabold tracking-wider uppercase ${
                  idx >= 5 ? 'text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Días del calendario con celdas equilibradas y tarjetas de alta legibilidad */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-200/50 dark:divide-white/5 flex-1">
            {calendarDays.map((dayObj, index) => {
              const dayCitas = filteredCitas.filter(c => String(c.fecha || '').split('T')[0] === dayObj.dateString);
              const dayTotalHoras = dayCitas
                .filter(c => c.estado !== 'Cancelada')
                .reduce((acc, c) => acc + (parseFloat(c.horas) || 0), 0);

              return (
                <div
                  key={index}
                  className={`min-h-[64px] sm:min-h-[120px] md:min-h-[150px] lg:min-h-[175px] xl:min-h-[200px] 2xl:min-h-[230px] p-1 sm:p-2 flex flex-col transition-colors group relative ${
                    !dayObj.isCurrentMonth
                      ? 'bg-slate-100/25 dark:bg-slate-950/40 text-slate-400 dark:text-slate-600'
                      : dayObj.isToday
                      ? 'bg-blue-500/10 dark:bg-blue-600/15 ring-1 ring-inset ring-blue-500/30'
                      : 'hover:bg-white/40 dark:hover:bg-slate-800/30'
                  }`}
                >
                  {/* Cabecera del día: Número y total de horas */}
                  <div 
                    onClick={() => {
                      if (dayCitas.length > 0) {
                        setSelectedDayDetails({
                          dateString: dayObj.dateString,
                          dayNumber: dayObj.dayNumber,
                          date: dayObj.date
                        });
                      }
                    }}
                    className={`flex items-center justify-between mb-1 sm:mb-1.5 pb-0.5 sm:pb-1 border-b border-slate-100 dark:border-slate-800 ${
                      dayCitas.length > 0 ? 'cursor-pointer hover:bg-slate-100/70 dark:hover:bg-slate-800/70 rounded px-1 -mx-1 transition-colors' : ''
                    }`}
                    title={dayCitas.length > 0 ? `Ver todas las citas del día (${dayCitas.length})` : undefined}
                  >
                    <div className="flex items-center gap-1 sm:gap-1.5">
                      <span
                        className={`inline-flex items-center justify-center text-xs sm:text-sm font-bold rounded-md w-5 h-5 sm:w-6 sm:h-6 ${
                          dayObj.isToday
                            ? 'bg-blue-600 text-white font-black shadow-xs'
                            : !dayObj.isCurrentMonth
                            ? 'text-slate-400 dark:text-slate-600'
                            : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {dayObj.dayNumber}
                      </span>
                      {dayCitas.length > 0 && (
                        <span className="sm:hidden text-[9px] font-bold text-blue-600 dark:text-blue-400 bg-blue-100/80 dark:bg-blue-950/60 px-1 rounded">
                          {dayCitas.length}
                        </span>
                      )}
                      {dayCitas.length > 2 && (
                        <span className="hidden sm:inline text-[10px] font-black text-blue-600 dark:text-blue-400 bg-blue-100/80 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-1 rounded shadow-2xs">
                          {dayCitas.length}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      {dayTotalHoras > 0 && (
                        <span className="text-[9px] sm:text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 px-1 sm:px-1.5 py-0.5 rounded shadow-2xs font-mono">
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
                          className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded transition-opacity hidden sm:inline-block"
                        >
                          <MessageSquare className="w-3.5 h-3.5 fill-emerald-600/20" />
                        </button>
                      )}
                      <button
                        onClick={() => onAddCitaDate(dayObj.dateString)}
                        title={`Agendar cita el ${dayObj.dateString}`}
                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-blue-50 dark:hover:bg-slate-800 text-blue-600 dark:text-blue-400 rounded transition-opacity hidden sm:inline-block"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                    </div>
                  </div>

                  {/* Vista compacta para móviles (< sm): puntos e iniciales */}
                  <div 
                    onClick={() => {
                      if (dayCitas.length > 0) {
                        setSelectedDayDetails({
                          dateString: dayObj.dateString,
                          dayNumber: dayObj.dayNumber,
                          date: dayObj.date
                        });
                      } else {
                        onAddCitaDate(dayObj.dateString);
                      }
                    }}
                    className={`sm:hidden flex-1 flex flex-col justify-start pt-0.5 cursor-pointer`}
                  >
                    {dayCitas.length > 0 ? (
                      <div className="flex flex-wrap gap-1 items-center content-start p-0.5">
                        {dayCitas.slice(0, 3).map((c, i) => (
                          <span
                            key={c.id || i}
                            className="w-2 h-2 rounded-full shadow-2xs shrink-0"
                            style={{ backgroundColor: c.capacitador_color || '#3B82F6' }}
                            title={`${c.capacitador_iniciales || ''}: ${c.cliente_nombre || ''}`}
                          />
                        ))}
                        {dayCitas.length > 3 && (
                          <span className="text-[8px] font-black text-slate-500 dark:text-slate-400 leading-none">+{dayCitas.length - 3}</span>
                        )}
                      </div>
                    ) : (
                      <div className="flex-1" />
                    )}
                  </div>

                  {/* Lista de citas en el día para tablets y pantallas grandes (Muestra hasta 2 citas y botón estilizado si hay más) */}
                  <div className="hidden sm:flex flex-1 flex-col space-y-1.5 overflow-y-auto max-h-[260px] pr-0.5 scrollbar-thin">
                    {dayCitas.slice(0, 2).map((cita) => {
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
                          className={`w-full text-left p-2 sm:p-2.5 rounded-xl border transition-all duration-200 space-y-1.5 cursor-pointer select-none group/card backdrop-blur-md ${
                            isCancelada
                              ? 'bg-rose-50/70 dark:bg-rose-950/40 border-dashed border-rose-200/90 dark:border-rose-900/60 opacity-70 hover:opacity-100 hover:border-rose-300'
                              : isImpartida
                              ? 'glass-card glass-card-hover border-emerald-300/40 dark:border-emerald-500/30 hover:border-emerald-400 shadow-glass-sm'
                              : 'glass-card glass-card-hover border-white/70 dark:border-white/10 hover:border-blue-300/60 shadow-glass-sm'
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
                              <span className={`text-[11px] font-mono font-bold ${isCancelada ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-200'}`}>
                                {cita.hora_inicio} - {cita.hora_fin}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <span 
                                className={`text-[10px] font-black px-1.5 py-0.5 rounded font-mono ${
                                  isCancelada
                                    ? 'text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 line-through'
                                    : 'text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 border border-slate-200/80 dark:border-slate-600'
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
                                  className="opacity-0 group-hover:opacity-100 hover:bg-emerald-100/70 dark:hover:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 p-0.5 rounded transition-opacity"
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

                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200/70 dark:border-slate-600 uppercase tracking-wider text-[9px]">
                              {cita.tipo_servicio}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                cita.modalidad === 'Presencial'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800'
                                  : 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800'
                              }`}
                            >
                              {cita.modalidad === 'Presencial' ? (
                                <MapPin className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                              ) : (
                                <Video className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400" />
                              )}
                              {cita.modalidad}
                            </span>
                          </div>

                          {/* Fila 3: Actividad Concreta (Tema específico destacado) */}
                          <p className={`text-xs font-bold leading-snug line-clamp-2 ${isCancelada ? 'line-through text-slate-400 dark:text-slate-500 italic' : 'text-slate-900 dark:text-slate-100'}`}>
                            {cita.observaciones ? cita.observaciones : `${cita.tipo_servicio} Programado`}
                          </p>

                          {/* Fila 4: Cliente / Empresa */}
                          <div className="flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-400 font-medium truncate pt-1 border-t border-slate-100 dark:border-slate-700/60">
                            <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate text-slate-700 dark:text-slate-300 font-medium" title={cita.cliente_nombre}>
                              {cita.cliente_nombre}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {/* Botón ver todas cuando hay más de 2 citas */}
                    {dayCitas.length > 2 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDayDetails({
                            dateString: dayObj.dateString,
                            dayNumber: dayObj.dayNumber,
                            date: dayObj.date
                          });
                        }}
                        className="w-full mt-1 py-1.5 px-2 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-slate-700 dark:hover:to-slate-700 text-blue-700 dark:text-blue-300 border border-blue-200/90 dark:border-blue-800 font-bold text-[11px] flex items-center justify-between transition-all duration-150 shadow-2xs hover:shadow-xs cursor-pointer group/more"
                      >
                        <span className="flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded bg-blue-600 dark:bg-blue-500 text-white text-[9px] font-black flex items-center justify-center shadow-2xs">
                            +{dayCitas.length - 2}
                          </span>
                          <span>más citas</span>
                        </span>
                        <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-0.5 group-hover/more:translate-x-0.5 transition-transform">
                          Ver todas ({dayCitas.length})
                          <ChevronRight className="w-3 h-3" />
                        </span>
                      </button>
                    )}
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
          <div className="glass-panel rounded-3xl border border-white/80 dark:border-white/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-glass backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-lg shadow-blue-500/30 shrink-0 border border-white/20">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Agenda Diaria de Turnos en Paralelo</span>
                  <span className="text-[10px] bg-blue-500/15 dark:bg-blue-400/15 text-blue-700 dark:text-blue-300 font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-blue-300/40 dark:border-blue-500/20 backdrop-blur-xs">
                    {displayedCapacitadores.length} Capacitadores
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {dayAppointments.length} actividad(es) agendada(s) hoy · Total de {dayAppointments.reduce((acc, c) => acc + (parseFloat(c.horas) || 0), 0)} hrs asignadas
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-slate-800/70 border border-white/80 dark:border-white/10 px-3 py-1.5 rounded-xl shadow-glass-sm flex items-center gap-1.5 backdrop-blur-xs">
                💡 <span className="hidden md:inline">Haz clic en cualquier espacio libre para agendar a esa hora</span>
                <span className="md:hidden">Toca un espacio libre para agendar</span>
              </span>
            </div>
          </div>

          {/* Cuadrícula de Turnos Horarios */}
          <div className="glass-panel rounded-3xl border border-white/80 dark:border-white/10 shadow-glass overflow-hidden overflow-x-auto transition-all">
            <div className="min-w-[820px]">
              
              {/* Encabezado de Columnas por Capacitador */}
              <div className="grid grid-cols-[88px_repeat(auto-fit,minmax(180px,1fr))] border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/90 sticky top-0 z-10">
                <div className="p-3 text-center text-xs font-bold text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800 uppercase tracking-wider flex items-center justify-center">
                  Horario
                </div>

                {displayedCapacitadores.map((cap) => {
                  const capCitasToday = dayAppointments.filter(c => String(c.capacitador_id) === String(cap.id));
                  const capHoursToday = capCitasToday.reduce((acc, c) => acc + (parseFloat(c.horas) || 0), 0);
                  const isFree = capHoursToday === 0;

                  return (
                    <div
                      key={cap.id}
                      className="p-3 border-r border-slate-200 dark:border-slate-800 last:border-r-0 flex flex-col justify-between gap-1.5 bg-slate-50/90 dark:bg-slate-800/90"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white shrink-0 shadow-xs"
                            style={{ backgroundColor: cap.color }}
                          >
                            {cap.iniciales}
                          </span>
                          <span className="font-extrabold text-xs text-slate-900 dark:text-white truncate" title={cap.nombre_completo}>
                            {cap.nombre_completo}
                          </span>
                        </div>

                        {onOpenWhatsApp && (
                          <button
                            type="button"
                            onClick={() => onOpenWhatsApp({ date: currentDateStr, capacitadorId: cap.id })}
                            title={`Enviar agenda de hoy a ${cap.nombre_completo.split(' ')[0]} por WhatsApp`}
                            className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors shrink-0"
                          >
                            <MessageSquare className="w-3.5 h-3.5 fill-emerald-600/20" />
                          </button>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        {isFree ? (
                          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                            ✨ Totalmente Libre
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800 px-2 py-0.5 rounded-full">
                            🕒 {capHoursToday}h ({capCitasToday.length} citas)
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                          {cap.iniciales}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Filas de Horas */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {HOURS_OF_DAY.map((hStr) => {
                  const hourNum = parseInt(hStr.split(':')[0], 10);

                  return (
                    <div
                      key={hStr}
                      className="grid grid-cols-[88px_repeat(auto-fit,minmax(180px,1fr))] min-h-[76px]"
                    >
                      {/* Celda de Hora (Eje Izquierdo) */}
                      <div className="p-2 border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex flex-col items-center justify-center font-mono text-xs font-bold text-slate-600 dark:text-slate-400">
                        <span>{hStr}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">{hourNum >= 12 ? 'PM' : 'AM'}</span>
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
                            className="border-r border-slate-100 dark:border-slate-800 last:border-r-0 p-1.5 flex flex-col justify-center relative group"
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
                                        ? 'bg-slate-50/90 dark:bg-slate-800/60 border-dashed border-rose-300 dark:border-rose-900 opacity-70 hover:opacity-100'
                                        : 'bg-white dark:bg-slate-800 border-blue-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500'
                                    }`}
                                    style={{ borderLeftColor: isCanc ? '#F43F5E' : cap.color, borderLeftWidth: '4px' }}
                                  >
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="text-[11px] font-mono font-black text-slate-900 dark:text-white flex items-center gap-1">
                                        <Clock className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                                        <span className={isCanc ? 'line-through text-slate-400 dark:text-slate-500' : ''}>
                                          {citaIniciando.hora_inicio} - {citaIniciando.hora_fin}
                                        </span>
                                      </span>
                                      <div className="flex items-center gap-1">
                                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded font-mono ${
                                          isCanc ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 line-through' : 'text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600'
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
                                            className="opacity-0 group-hover/card:opacity-100 p-0.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded transition-opacity"
                                          >
                                            <MessageSquare className="w-3.5 h-3.5 fill-emerald-600/20" />
                                          </button>
                                        )}
                                      </div>
                                    </div>

                                    <p className={`font-extrabold text-xs leading-snug line-clamp-2 ${isCanc ? 'line-through text-slate-400 dark:text-slate-500 italic' : 'text-slate-900 dark:text-white'}`}>
                                      {citaIniciando.observaciones || `${citaIniciando.tipo_servicio} Programado`}
                                    </p>

                                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 dark:border-slate-700 gap-1">
                                      <span className="text-slate-600 dark:text-slate-400 font-medium truncate flex items-center gap-1" title={citaIniciando.cliente_nombre}>
                                        <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                                        <strong className="truncate text-slate-800 dark:text-slate-200">{citaIniciando.cliente_nombre}</strong>
                                      </span>
                                      <div className="flex items-center gap-1 shrink-0">
                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${estCfg.badge}`}>
                                          {estCfg.emoji} {estCfg.label}
                                        </span>
                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                                          citaIniciando.modalidad === 'Presencial' ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300' : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
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
                                className="w-full h-full bg-blue-50/50 dark:bg-blue-950/40 border-l-4 border-dashed border-blue-300 dark:border-blue-700 rounded-lg p-2 text-[11px] text-blue-800/80 dark:text-blue-300 font-medium flex items-center justify-between hover:bg-blue-100/50 dark:hover:bg-blue-900/40 transition-colors cursor-pointer"
                              >
                                <span className="truncate flex items-center gap-1">
                                  <span>↳</span>
                                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{citaEnCurso.cliente_nombre}</span>
                                  <span className="text-slate-500 dark:text-slate-400 text-[10px]">({citaEnCurso.hora_inicio}-{citaEnCurso.hora_fin})</span>
                                </span>
                                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold bg-white/70 dark:bg-slate-800 px-1.5 py-0.5 rounded shrink-0">
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
                                className="w-full h-full min-h-[60px] rounded-xl border border-transparent hover:border-emerald-300 hover:border-dashed hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition-all flex items-center justify-center group/slot cursor-pointer"
                                title={`Agendar a ${cap.nombre_completo.split(' ')[0]} el ${currentDateStr} a las ${hStr}`}
                              >
                                <div className="opacity-0 group-hover/slot:opacity-100 flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 px-2.5 py-1 rounded-lg text-emerald-700 dark:text-emerald-300 text-xs font-bold shadow-xs transition-opacity transform group-hover/slot:scale-105">
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
        <div className="glass-panel rounded-3xl border border-white/80 dark:border-white/10 shadow-glass overflow-hidden transition-all duration-200">
          <div className="p-4 sm:p-5 border-b border-slate-200/60 dark:border-white/10 bg-white/40 dark:bg-slate-800/40 backdrop-blur-md flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
              Listado de Citas Agendadas ({filteredCitas.length})
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Ordenadas por fecha ascendente
            </span>
          </div>

          {filteredCitas.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500">
              <CalendarIcon className="w-12 h-12 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
              <p className="font-medium text-slate-600 dark:text-slate-400">No hay citas registradas para este periodo o filtro.</p>
              <button
                onClick={() => onAddCitaDate(new Date().toISOString().split('T')[0])}
                className="mt-3 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline"
              >
                + Registrar la primera cita
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold border-b border-slate-200 dark:border-slate-800">
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
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredCitas.map((cita) => {
                    const color = cita.capacitador_color || '#3B82F6';
                    const estKey = cita.estado || 'Programada';
                    const estCfg = STATUS_CONFIG[estKey] || STATUS_CONFIG['Programada'];
                    const isCancelada = estKey === 'Cancelada';

                    return (
                      <tr
                        key={cita.id}
                        onClick={() => onSelectCita(cita)}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors ${
                          isCancelada ? 'bg-slate-50/60 dark:bg-slate-900/40 opacity-75' : ''
                        }`}
                      >
                        <td className="py-3 px-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">
                          {cita.fecha}
                        </td>
                        <td className={`py-3 px-4 font-mono text-xs whitespace-nowrap ${isCancelada ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-600 dark:text-slate-300'}`}>
                          {cita.hora_inicio} - {cita.hora_fin}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`font-bold px-2 py-0.5 rounded-md ${
                            isCancelada ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 line-through' : 'text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800'
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
                            <span className="font-medium text-slate-800 dark:text-slate-200 text-xs">
                              {cita.capacitador_nombre}
                            </span>
                          </div>
                        </td>
                        <td className={`py-3 px-4 font-medium text-slate-900 dark:text-white ${isCancelada ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
                          {cita.cliente_nombre}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                              cita.modalidad === 'Presencial'
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
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
                          <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md text-xs font-medium">
                            {cita.tipo_servicio}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${estCfg.badge}`}>
                            <span>{estCfg.emoji}</span>
                            <span>{estCfg.label}</span>
                          </span>
                        </td>
                        <td className={`py-3 px-4 text-xs max-w-xs truncate ${isCancelada ? 'line-through text-slate-400 dark:text-slate-500 italic' : 'text-slate-500 dark:text-slate-400'}`}>
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
                                className="p-1 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-lg transition-colors"
                              >
                                <MessageSquare className="w-4 h-4 fill-emerald-600/20" />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectCita(cita);
                              }}
                              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
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

      {/* MODAL DE DETALLE COMPLETO DEL DÍA (Renderizado con Portal al body para cobertura 100% de pantalla sin recortes) */}
      {selectedDayDetails && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[9999] w-screen h-screen bg-slate-950/60 dark:bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
        >
          <div 
            className="glass-panel rounded-3xl shadow-2xl border border-white/80 dark:border-white/15 w-full max-w-2xl sm:max-w-[700px] max-h-[88vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera del Modal Concisa y Moderna con Flechita Volver Atrás */}
            <div className="px-4 sm:px-5 py-3.5 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border-b border-slate-200/60 dark:border-white/10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => setSelectedDayDetails(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-200/70 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors group flex items-center gap-1 shrink-0 mr-0.5"
                  title="Volver al calendario"
                >
                  <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-0.5 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-bold hidden sm:inline text-slate-600 dark:text-slate-300">Volver</span>
                </button>
                <div className="w-9 h-9 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate leading-tight">
                    {formatLongDate(selectedDayDetails.dateString)}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {modalDayCitas.length} {modalDayCitas.length === 1 ? 'cita' : 'citas'}
                    </span>
                    <span>•</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      {modalDayTotalHoras}h total
                    </span>
                  </div>
                </div>
              </div>

              {/* Acciones directas integradas en la cabecera */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const dateStr = selectedDayDetails.dateString;
                    onAddCitaDate(dateStr, null, selectedDayDetails);
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span className="hidden sm:inline">Nueva Cita</span>
                </button>

                {onOpenWhatsApp && modalDayCitas.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenWhatsApp({ 
                        date: selectedDayDetails.dateString, 
                        capacitadorId: selectedCapacitadorId !== 'ALL' ? selectedCapacitadorId : null,
                        fromDayDetails: selectedDayDetails
                      });
                    }}
                    title="Enviar itinerario por WhatsApp"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 text-xs font-semibold transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5 fill-emerald-600/20" />
                    <span className="hidden sm:inline">WhatsApp</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    const [y, m, d] = selectedDayDetails.dateString.split('-').map(Number);
                    setCurrentDate(new Date(y, m - 1, d));
                    setCalendarMode('day');
                    setSelectedDayDetails(null);
                  }}
                  title="Ver en vista detallada de turnos"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-medium border border-slate-200 dark:border-slate-600 transition-colors"
                >
                  <span className="hidden sm:inline">Turnos</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedDayDetails(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-200/70 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors ml-0.5"
                  title="Cerrar (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Lista Scrollable de Citas del Día */}
            <div className="p-3.5 sm:p-4 overflow-y-auto max-h-[62vh] space-y-2.5 scrollbar-thin">
              {modalDayCitas.length === 0 ? (
                <div className="py-10 text-center text-slate-500 dark:text-slate-400 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center mx-auto text-slate-400 dark:text-slate-500">
                    <CalendarIcon className="w-6 h-6" />
                  </div>
                  <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm">No hay citas registradas en este día</p>
                  <button
                    type="button"
                    onClick={() => {
                      const dateStr = selectedDayDetails.dateString;
                      onAddCitaDate(dateStr, null, selectedDayDetails);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Agendar Primera Cita</span>
                  </button>
                </div>
              ) : (
                modalDayCitas.map((cita) => {
                  const color = cita.capacitador_color || '#3B82F6';
                  const estadoKey = cita.estado || 'Programada';
                  const estadoCfg = STATUS_CONFIG[estadoKey] || STATUS_CONFIG['Programada'];
                  const isCancelada = estadoKey === 'Cancelada';
                  const isImpartida = estadoKey === 'Impartida';

                  return (
                    <div
                      key={cita.id}
                      className={`p-3 sm:p-3.5 rounded-2xl border transition-all duration-200 backdrop-blur-md ${
                        isCancelada
                          ? 'bg-rose-50/50 dark:bg-rose-950/30 border-dashed border-rose-200 dark:border-rose-900/60 opacity-80 hover:opacity-100'
                          : isImpartida
                          ? 'glass-card border-emerald-300/40 dark:border-emerald-700/50 shadow-glass-sm'
                          : 'glass-card border-white/80 dark:border-white/10 shadow-glass-sm hover:shadow-glass-hover'
                      }`}
                      style={{
                        borderLeftWidth: '4px',
                        borderLeftColor: isCancelada ? '#F43F5E' : color
                      }}
                    >
                      {/* Fila 1: Horario, Insignias y Acciones */}
                      <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                          {/* Horario y Duración */}
                          <div className="flex items-center gap-1.5 font-mono text-xs">
                            <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                            <span className={`font-bold ${isCancelada ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-slate-100'}`}>
                              {cita.hora_inicio} - {cita.hora_fin}
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                              {cita.horas}h
                            </span>
                          </div>

                          {/* Insignias de Estado, Modalidad y Tipo */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${estadoCfg.badge}`}>
                              <span>{estadoCfg.emoji}</span>
                              <span>{estadoCfg.label}</span>
                            </span>

                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                              cita.modalidad === 'Presencial'
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/70 dark:border-emerald-800/70'
                                : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200/70 dark:border-blue-800/70'
                            }`}>
                              {cita.modalidad === 'Presencial' ? (
                                <MapPin className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              ) : (
                                <Video className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                              )}
                              <span>{cita.modalidad}</span>
                            </span>

                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-600 uppercase tracking-wider">
                              {cita.tipo_servicio}
                            </span>
                          </div>
                        </div>

                        {/* Botones de acción directos */}
                        <div className="flex items-center gap-1 shrink-0 ml-auto">
                          {onOpenWhatsApp && (
                            <button
                              type="button"
                              onClick={() => onOpenWhatsApp({ cita, fromDayDetails: selectedDayDetails })}
                              title="Enviar por WhatsApp"
                              className="p-1 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-lg transition-colors"
                            >
                              <MessageSquare className="w-4 h-4 fill-emerald-600/20" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              onSelectCita(cita, selectedDayDetails);
                            }}
                            className="px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg transition-colors border border-blue-200/60 dark:border-blue-800/70"
                          >
                            Editar
                          </button>
                        </div>
                      </div>

                      {/* Fila 2: Actividad / Tema destacado (Elegante y conciso, sin cajones pesados) */}
                      <p className={`text-xs sm:text-sm font-semibold leading-relaxed mt-2 ${
                        isCancelada ? 'line-through text-slate-400 dark:text-slate-500 italic' : 'text-slate-800 dark:text-slate-100'
                      }`}>
                        {cita.observaciones || `${cita.tipo_servicio} Programado`}
                      </p>

                      {/* Fila 3: Metadatos en 1 sola barra (Cliente y Capacitador) */}
                      <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs gap-3">
                        <div className="flex items-center gap-1.5 min-w-0 font-medium text-slate-600 dark:text-slate-400">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="text-slate-400 dark:text-slate-500">Cliente:</span>
                          <span className="truncate text-slate-800 dark:text-slate-200 font-semibold" title={cita.cliente_nombre}>
                            {cita.cliente_nombre}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0" title={`Capacitador: ${cita.capacitador_nombre}`}>
                          <span
                            className="w-5 h-5 rounded-md text-[10px] font-black text-white flex items-center justify-center shrink-0 shadow-2xs leading-none"
                            style={{ backgroundColor: color }}
                          >
                            {cita.capacitador_iniciales}
                          </span>
                          <span className="text-slate-700 dark:text-slate-300 font-medium truncate max-w-[140px]">
                            {cita.capacitador_nombre}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pie del Modal Conciso */}
            <div className="px-5 py-2.5 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Total: <span className="font-bold text-slate-800 dark:text-slate-200">{modalDayCitas.length}</span> {modalDayCitas.length === 1 ? 'cita' : 'citas'}
              </div>
              <button
                type="button"
                onClick={() => setSelectedDayDetails(null)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-200/80 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
