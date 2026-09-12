import React, { useState, useMemo } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  MessageSquare, 
  Calendar as CalendarIcon, 
  Clock, 
  Building2, 
  ExternalLink,
  Phone,
  Sparkles,
  Share2
} from 'lucide-react';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DAY_NAMES = [
  'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
];

export default function WhatsAppModal({
  isOpen,
  onClose,
  capacitadores = [],
  citas = [],
  initialCapacitadorId = null,
  initialDate = null,
  targetCita = null,
  onUpdateCapacitadorPhone,
  onShowToast
}) {
  if (!isOpen) return null;

  // Capacitador seleccionado
  const [selectedTrainerId, setSelectedTrainerId] = useState(
    targetCita?.capacitador_id || initialCapacitadorId || (capacitadores[0]?.id || '')
  );

  // Modo: 'day' | 'week' | 'single'
  const [mode, setMode] = useState(targetCita ? 'single' : 'day');

  // Fecha seleccionada (YYYY-MM-DD)
  const defaultDateStr = useMemo(() => {
    if (targetCita?.fecha) return String(targetCita.fecha).split('T')[0];
    if (initialDate instanceof Date) {
      return initialDate.toISOString().split('T')[0];
    }
    if (typeof initialDate === 'string' && initialDate) {
      return initialDate.split('T')[0];
    }
    return new Date().toISOString().split('T')[0];
  }, [targetCita, initialDate]);

  const [selectedDate, setSelectedDate] = useState(defaultDateStr);

  // Teléfono editable
  const currentTrainer = useMemo(() => {
    return capacitadores.find(cp => String(cp.id) === String(selectedTrainerId));
  }, [capacitadores, selectedTrainerId]);

  const [customPhone, setCustomPhone] = useState(currentTrainer?.telefono || '');
  const [copied, setCopied] = useState(false);
  const [savingPhone, setSavingPhone] = useState(false);

  // Sincronizar teléfono cuando cambia de capacitador
  React.useEffect(() => {
    if (currentTrainer) {
      setCustomPhone(currentTrainer.telefono || '');
    }
  }, [currentTrainer]);

  // Formato legible de fecha: "Lunes, 07 de Septiembre 2026"
  const formatFriendlyDate = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const dayName = DAY_NAMES[dateObj.getDay()];
    const monthName = MONTH_NAMES[dateObj.getMonth()];
    return `${dayName}, ${String(d).padStart(2, '0')} de ${monthName} ${y}`;
  };

  // Citas relevantes según el modo y capacitador seleccionado
  const relevantCitas = useMemo(() => {
    if (mode === 'single' && targetCita) {
      return [targetCita];
    }

    if (!selectedTrainerId) return [];

    if (mode === 'day') {
      return citas.filter(c => {
        const sameCap = String(c.capacitador_id) === String(selectedTrainerId);
        const cDate = String(c.fecha).split('T')[0];
        return sameCap && cDate === selectedDate;
      }).sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
    }

    if (mode === 'week') {
      // Calcular rango Lunes - Domingo de la fecha seleccionada
      const [y, m, d] = selectedDate.split('-').map(Number);
      const curr = new Date(y, m - 1, d);
      const dayOfWeek = curr.getDay() === 0 ? 6 : curr.getDay() - 1; // 0 = Lunes
      
      const monday = new Date(curr);
      monday.setDate(curr.getDate() - dayOfWeek);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      const monStr = monday.toISOString().split('T')[0];
      const sunStr = sunday.toISOString().split('T')[0];

      return citas.filter(c => {
        const sameCap = String(c.capacitador_id) === String(selectedTrainerId);
        const cDate = String(c.fecha).split('T')[0];
        return sameCap && cDate >= monStr && cDate <= sunStr;
      }).sort((a, b) => (a.fecha + a.hora_inicio).localeCompare(b.fecha + b.hora_inicio));
    }

    return [];
  }, [mode, targetCita, selectedTrainerId, selectedDate, citas]);

  // Horas totales
  const totalHoras = useMemo(() => {
    return relevantCitas.reduce((acc, c) => acc + (parseFloat(c.horas) || 0), 0);
  }, [relevantCitas]);

  // Generador del mensaje de WhatsApp
  const generatedMessage = useMemo(() => {
    const trainerName = currentTrainer ? currentTrainer.nombre_completo : 'Capacitador';
    const trainerFirst = trainerName.split(' ')[0];

    if (mode === 'single' && targetCita) {
      return (
`👋 *Hola ${trainerFirst}*, te comparto los detalles de tu capacitación asignada:

🏢 *Empresa:* ${targetCita.cliente_nombre || 'Cliente asignado'}
📅 *Fecha:* ${formatFriendlyDate(String(targetCita.fecha).split('T')[0])}
⏰ *Horario:* ${targetCita.hora_inicio} - ${targetCita.hora_fin} (${targetCita.horas} hrs)
📌 *Servicio:* ${targetCita.tipo_servicio}
📍 *Modalidad:* ${targetCita.modalidad}${targetCita.observaciones ? `\n📝 *Observaciones:* ${targetCita.observaciones}` : ''}

━━━━━━━━━━━━━━━━━━━
✨ *Agenda One - One Consulting*`
      );
    }

    if (mode === 'day') {
      const friendlyDate = formatFriendlyDate(selectedDate);
      if (relevantCitas.length === 0) {
        return (
`👋 *Hola ${trainerFirst}*, te informamos que no tienes actividades programadas para el *${friendlyDate}*.

━━━━━━━━━━━━━━━━━━━
✨ *Agenda One - One Consulting*`
        );
      }

      let text = `👋 *Hola ${trainerFirst}*, te comparto tu agenda oficial para el *${friendlyDate}*:\n\n`;

      relevantCitas.forEach((c, idx) => {
        const num = relevantCitas.length > 1 ? `${idx + 1}️⃣ ` : '';
        text += `${num}🏢 *${c.cliente_nombre}*\n`;
        text += `   ⏰ *${c.hora_inicio} - ${c.hora_fin}* (${c.horas} hrs)\n`;
        text += `   📌 *${c.tipo_servicio}*${c.observaciones ? `: ${c.observaciones}` : ''}\n`;
        text += `   📍 Modalidad: ${c.modalidad}\n\n`;
      });

      text += `━━━━━━━━━━━━━━━━━━━\n`;
      text += `📊 *Total asignado:* ${relevantCitas.length} actividad(es) | *${totalHoras} hrs*\n`;
      text += `✨ *Agenda One - One Consulting*`;
      return text;
    }

    if (mode === 'week') {
      if (relevantCitas.length === 0) {
        return (
`👋 *Hola ${trainerFirst}*, no tienes capacitaciones agendadas para esta semana.

━━━━━━━━━━━━━━━━━━━
✨ *Agenda One - One Consulting*`
        );
      }

      let text = `👋 *Hola ${trainerFirst}*, te comparto el resumen de tu agenda semanal en *One Consulting*:\n\n`;

      // Agrupar por fecha
      const groups = {};
      relevantCitas.forEach(c => {
        const dateKey = String(c.fecha).split('T')[0];
        if (!groups[dateKey]) groups[dateKey] = [];
        groups[dateKey].push(c);
      });

      Object.entries(groups).forEach(([dateKey, list]) => {
        text += `📅 *${formatFriendlyDate(dateKey)}:*\n`;
        list.forEach(c => {
          text += `  • *${c.hora_inicio} - ${c.hora_fin}* (${c.horas}h) | ${c.cliente_nombre} (${c.tipo_servicio} - ${c.modalidad})\n`;
        });
        text += `\n`;
      });

      text += `━━━━━━━━━━━━━━━━━━━\n`;
      text += `📊 *Total semanal:* ${relevantCitas.length} actividad(es) | *${totalHoras} horas*\n`;
      text += `✨ *Agenda One - One Consulting*`;
      return text;
    }

    return '';
  }, [mode, targetCita, currentTrainer, selectedDate, relevantCitas, totalHoras]);

  // Copiar al portapapeles
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedMessage);
      setCopied(true);
      if (onShowToast) onShowToast('¡Mensaje copiado al portapapeles!');
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  // Abrir en WhatsApp Web / App
  const handleOpenWhatsApp = () => {
    const cleanPhone = (customPhone || '').replace(/[^0-9]/g, '');
    const encoded = encodeURIComponent(generatedMessage);
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Guardar teléfono rápido en el perfil del capacitador
  const handleSavePhone = async () => {
    if (!currentTrainer || !onUpdateCapacitadorPhone) return;
    setSavingPhone(true);
    try {
      await onUpdateCapacitadorPhone(currentTrainer.id, { telefono: customPhone.trim() });
      if (onShowToast) onShowToast(`Teléfono guardado para ${currentTrainer.nombre_completo}.`);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingPhone(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Encabezado Verde WhatsApp */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white border border-white/30 shadow-xs">
              <MessageSquare className="w-5 h-5 fill-white/20" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight">Notificar Agenda por WhatsApp</h3>
                <span className="text-[10px] bg-white/20 text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-white/30">
                  1-Clic
                </span>
              </div>
              <p className="text-xs text-emerald-100 font-medium">Envío oficial de compromisos a capacitadores</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo del Modal con Scroll */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-slate-800">
          
          {/* Selector de Capacitador (Pestañas visuales con iniciales) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Capacitador Destinatario:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {capacitadores.map((cap) => {
                const isSelected = String(cap.id) === String(selectedTrainerId);
                return (
                  <button
                    key={cap.id}
                    type="button"
                    onClick={() => {
                      setSelectedTrainerId(cap.id);
                      if (mode === 'single') setMode('day');
                    }}
                    className={`p-2 rounded-xl text-left border text-xs font-bold flex items-center gap-2 transition-all ${
                      isSelected
                        ? 'ring-2 ring-emerald-500 border-transparent bg-emerald-50 text-emerald-950 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <span
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black text-white shrink-0 shadow-2xs"
                      style={{ backgroundColor: cap.color }}
                    >
                      {cap.iniciales}
                    </span>
                    <span className="truncate text-[11px] font-bold">{cap.nombre_completo.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Opciones de Modo y Fecha */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Tipo de Mensaje:
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setMode('day')}
                  className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                    mode === 'day'
                      ? 'bg-white text-emerald-700 shadow-xs border border-emerald-300'
                      : 'text-slate-600 hover:bg-slate-200/60'
                  }`}
                >
                  📅 Día Completo
                </button>
                <button
                  type="button"
                  onClick={() => setMode('week')}
                  className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                    mode === 'week'
                      ? 'bg-white text-emerald-700 shadow-xs border border-emerald-300'
                      : 'text-slate-600 hover:bg-slate-200/60'
                  }`}
                >
                  🗓️ Toda la Semana
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Fecha del Itinerario:
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Teléfono / WhatsApp del Capacitador */}
          <div className="bg-emerald-50/60 border border-emerald-200/70 p-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-900">
                  Teléfono de WhatsApp ({currentTrainer ? currentTrainer.nombre_completo : 'Capacitador'}):
                </p>
                <p className="text-[10px] text-slate-500">Para abrir el chat privado directamente</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Ej: +502 5555-1234"
                value={customPhone}
                onChange={(e) => setCustomPhone(e.target.value)}
                className="px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-36 sm:w-40"
              />
              {onUpdateCapacitadorPhone && customPhone !== (currentTrainer?.telefono || '') && (
                <button
                  type="button"
                  onClick={handleSavePhone}
                  disabled={savingPhone}
                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition-colors shadow-2xs"
                  title="Guardar este teléfono en el perfil"
                >
                  {savingPhone ? '...' : 'Guardar'}
                </button>
              )}
            </div>
          </div>

          {/* Vista Previa de Burbuja de WhatsApp */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Vista Previa del Mensaje:
              </span>
              <span className="text-[11px] text-slate-500 font-semibold">
                {relevantCitas.length} actividad(es) · {totalHoras} hrs
              </span>
            </div>

            <div className="bg-[#EFEAE2] p-4 rounded-2xl border border-slate-200 shadow-inner">
              <div className="max-w-lg bg-[#E7FFDB] text-slate-900 p-4 rounded-2xl rounded-tr-xs shadow-xs border border-emerald-200/50 space-y-2 text-xs font-sans whitespace-pre-wrap leading-relaxed">
                {generatedMessage}
                <div className="flex items-center justify-end gap-1 text-[10px] text-slate-500 pt-1 border-t border-emerald-200/40 font-mono">
                  <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="text-blue-600 font-bold">✓✓</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Barra de Botones Inferior */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 rounded-xl transition-colors"
          >
            Cerrar
          </button>

          <div className="flex items-center gap-2.5">
            {/* Copiar al Portapapeles */}
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold shadow-2xs transition-all active:scale-95"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600 stroke-[3]" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? '¡Copiado!' : 'Copiar Texto'}</span>
            </button>

            {/* Abrir en WhatsApp */}
            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md shadow-emerald-600/25 transition-all transform active:scale-95"
            >
              <MessageSquare className="w-4 h-4 fill-white/30" />
              <span>Abrir en WhatsApp</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
