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
  Users
} from 'lucide-react';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DAYS_OF_WEEK = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export default function CalendarView({ 
  citas = [], 
  capacitadores = [], 
  onSelectCita, 
  onAddCitaDate,
  currentDate,
  setCurrentDate 
}) {
  const [selectedCapacitadorId, setSelectedCapacitadorId] = useState('ALL');
  const [calendarMode, setCalendarMode] = useState('month'); // 'month' | 'week' | 'list'

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  // Navegación de mes/semana
  const handlePrev = () => {
    if (calendarMode === 'week') {
      const prevWeek = new Date(currentDate);
      prevWeek.setDate(prevWeek.getDate() - 7);
      setCurrentDate(prevWeek);
    } else {
      setCurrentDate(new Date(year, month - 1, 1));
    }
  };

  const handleNext = () => {
    if (calendarMode === 'week') {
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

  // Filtrado de citas por capacitador
  const filteredCitas = useMemo(() => {
    if (selectedCapacitadorId === 'ALL') return citas;
    return citas.filter(c => c.capacitador_id === parseInt(selectedCapacitadorId, 10));
  }, [citas, selectedCapacitadorId]);

  // Horas acumuladas según filtro actual en el mes
  const totalHorasFiltradas = useMemo(() => {
    return filteredCitas.reduce((acc, c) => acc + (parseFloat(c.horas) || 0), 0);
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
    <div className="space-y-5">
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

            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight capitalize">
              {MONTH_NAMES[month]} <span className="text-slate-400 font-normal">{year}</span>
            </h2>
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

            {/* Selector de modo: Mes / Lista */}
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
      </div>

      {/* VISTA DE CUADRÍCULA MENSUAL */}
      {calendarMode === 'month' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
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
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100">
            {calendarDays.map((dayObj, index) => {
              const dayCitas = filteredCitas.filter(c => c.fecha === dayObj.dateString);
              const dayTotalHoras = dayCitas.reduce((acc, c) => acc + (parseFloat(c.horas) || 0), 0);

              return (
                <div
                  key={index}
                  className={`min-h-[140px] sm:min-h-[165px] p-1.5 sm:p-2 flex flex-col transition-colors group relative ${
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
                      <button
                        onClick={() => onAddCitaDate(dayObj.dateString)}
                        title={`Agendar cita el ${dayObj.dateString}`}
                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-blue-50 text-blue-600 rounded transition-opacity"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                    </div>
                  </div>

                  {/* Lista de citas en el día (Diseño limpio, legible y sin sobredimensionar) */}
                  <div className="flex-1 space-y-1.5 overflow-y-auto max-h-[220px] pr-0.5 scrollbar-thin">
                    {dayCitas.map((cita) => {
                      const color = cita.capacitador_color || '#3B82F6';
                      const fullTooltip = `${cita.cliente_nombre}\nCapacitador: ${cita.capacitador_nombre} [${cita.capacitador_iniciales}]\nHorario: ${cita.hora_inicio} - ${cita.hora_fin} (${cita.horas}h)\nModalidad: ${cita.modalidad} | Tipo: ${cita.tipo_servicio}${cita.observaciones ? `\nNota: ${cita.observaciones}` : ''}`;

                      return (
                        <div
                          key={cita.id}
                          onClick={() => onSelectCita(cita)}
                          role="button"
                          title={fullTooltip}
                          className="w-full text-left p-1.5 sm:p-2 rounded-lg border border-slate-200/80 shadow-2xs hover:shadow-sm transition-all duration-150 bg-white space-y-1 cursor-pointer select-none group/card hover:border-slate-300"
                          style={{
                            borderLeftWidth: '3.5px',
                            borderLeftColor: color
                          }}
                        >
                          {/* Fila 1: Iniciales del Capacitador, Nombre de Empresa y Horas */}
                          <div className="flex items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                              <span
                                className="w-5 h-5 rounded text-[10px] font-black text-white flex items-center justify-center shrink-0 shadow-2xs leading-none"
                                style={{ backgroundColor: color }}
                                title={`Capacitador: ${cita.capacitador_nombre}`}
                              >
                                {cita.capacitador_iniciales}
                              </span>
                              <span className="font-semibold text-slate-900 text-xs truncate leading-tight">
                                {cita.cliente_nombre}
                              </span>
                            </div>
                            <span 
                              className="text-[10px] font-bold px-1.5 py-0.5 rounded font-mono text-slate-700 bg-slate-100 border border-slate-200/60 shrink-0"
                            >
                              {cita.horas}h
                            </span>
                          </div>

                          {/* Fila 2: Horario, Modalidad y Tipo de Servicio */}
                          <div className="flex items-center justify-between gap-1 text-[10px] text-slate-600">
                            <span className="flex items-center gap-1 font-mono font-medium text-slate-700 shrink-0">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {cita.hora_inicio}-{cita.hora_fin}
                            </span>

                            <div className="flex items-center gap-1 shrink-0">
                              <span
                                className={`inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[10px] font-semibold ${
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

                              <span className="bg-slate-50 text-slate-600 px-1 py-0.2 rounded text-[10px] font-medium border border-slate-100 truncate max-w-[65px]">
                                {cita.tipo_servicio}
                              </span>
                            </div>
                          </div>

                          {/* Fila 3: Observaciones discretas de 1 línea si existen */}
                          {cita.observaciones && (
                            <p className="text-[10px] text-slate-500 truncate italic leading-none pt-0.5 font-normal">
                              "{cita.observaciones}"
                            </p>
                          )}
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
                    <th className="py-3 px-4">Observaciones</th>
                    <th className="py-3 px-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCitas.map((cita) => {
                    const color = cita.capacitador_color || '#3B82F6';
                    return (
                      <tr
                        key={cita.id}
                        onClick={() => onSelectCita(cita)}
                        className="hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4 font-medium text-slate-900 whitespace-nowrap">
                          {cita.fecha}
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-mono text-xs whitespace-nowrap">
                          {cita.hora_inicio} - {cita.hora_fin}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                            {cita.horas} hrs
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-extrabold text-white shrink-0"
                              style={{ backgroundColor: color }}
                            >
                              {cita.capacitador_iniciales}
                            </span>
                            <span className="font-medium text-slate-800 text-xs">
                              {cita.capacitador_nombre}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-900">
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
                        <td className="py-3 px-4 text-slate-500 text-xs max-w-xs truncate">
                          {cita.observaciones || '-'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectCita(cita);
                            }}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                          >
                            Editar
                          </button>
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
