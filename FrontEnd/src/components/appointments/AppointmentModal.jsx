import React, { useState, useEffect } from 'react';
import { 
  X, 
  Clock, 
  Calendar as CalendarIcon, 
  Building2, 
  User, 
  MapPin, 
  Video, 
  FileText, 
  Trash2, 
  Check, 
  AlertCircle,
  Calculator,
  AlignLeft
} from 'lucide-react';

const TIPOS_SERVICIO = ['Curso', 'Asesoría', 'Auditoría', 'Reunión', 'Seguimiento'];
const MODALIDADES = ['Presencial', 'Virtual', 'Híbrida'];

export default function AppointmentModal({
  isOpen,
  onClose,
  appointment, // null si es nueva, o objeto cita si es edición
  initialDate,
  capacitadores = [],
  onSave,
  onDelete
}) {
  const [formData, setFormData] = useState({
    cliente_nombre: '',
    capacitador_id: '',
    fecha: '',
    hora_inicio: '08:00',
    hora_fin: '12:00',
    horas: '4',
    modalidad: 'Presencial',
    tipo_servicio: 'Curso',
    descripcion: '',
    observaciones: ''
  });

  const [isManualHours, setIsManualHours] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Función interna para calcular horas decimales
  const calcHours = (inicio, fin) => {
    if (!inicio || !fin) return 0;
    const [h1, m1] = inicio.split(':').map(Number);
    const [h2, m2] = fin.split(':').map(Number);
    let minDiff = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (minDiff < 0) minDiff += 24 * 60;
    return Math.round((minDiff / 60) * 100) / 100;
  };

  useEffect(() => {
    if (appointment) {
      setFormData({
        cliente_nombre: appointment.cliente_nombre || '',
        capacitador_id: appointment.capacitador_id || '',
        fecha: appointment.fecha || '',
        hora_inicio: appointment.hora_inicio || '08:00',
        hora_fin: appointment.hora_fin || '12:00',
        horas: appointment.horas ? String(appointment.horas) : '4',
        modalidad: appointment.modalidad || 'Presencial',
        tipo_servicio: appointment.tipo_servicio || 'Curso',
        descripcion: appointment.observaciones || '',
        observaciones: appointment.observaciones || ''
      });
      setIsManualHours(false);
    } else {
      const defaultDate = initialDate || new Date().toISOString().split('T')[0];
      const initialHoras = calcHours('08:00', '12:00');
      setFormData({
        cliente_nombre: '',
        capacitador_id: capacitadores.length > 0 ? capacitadores[0].id : '',
        fecha: defaultDate,
        hora_inicio: '08:00',
        hora_fin: '12:00',
        horas: String(initialHoras),
        modalidad: 'Presencial',
        tipo_servicio: 'Curso',
        descripcion: '',
        observaciones: ''
      });
      setIsManualHours(false);
    }
    setError(null);
  }, [appointment, initialDate, isOpen, capacitadores]);

  // Recalcular automáticamente cuando cambian los horarios (si no está en modo manual)
  const handleTimeChange = (field, value) => {
    const updated = { ...formData, [field]: value };
    if (!isManualHours) {
      const hCalculadas = calcHours(
        field === 'hora_inicio' ? value : formData.hora_inicio,
        field === 'hora_fin' ? value : formData.hora_fin
      );
      updated.horas = String(hCalculadas);
    }
    setFormData(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.cliente_nombre.trim()) {
      setError('Por favor escribe el nombre del cliente o empresa.');
      return;
    }

    if (!formData.capacitador_id || !formData.fecha) {
      setError('Por favor selecciona el capacitador y la fecha.');
      return;
    }

    const numHoras = parseFloat(formData.horas);
    if (isNaN(numHoras) || numHoras <= 0) {
      setError('Las horas deben ser un número mayor a 0 (ej: 4, 2.5).');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        ...formData,
        cliente_nombre: formData.cliente_nombre.trim(),
        capacitador_id: parseInt(formData.capacitador_id, 10),
        horas: numHoras,
        observaciones: formData.descripcion || formData.observaciones
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Error al guardar la cita.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!appointment?.id) return;
    if (window.confirm('¿Estás seguro de eliminar esta cita agendada?')) {
      setLoading(true);
      try {
        await onDelete(appointment.id);
        onClose();
      } catch (err) {
        setError(err.message || 'Error al eliminar la cita.');
      } finally {
        setLoading(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-150">
        
        {/* Cabecera del modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm shadow-blue-500/30">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {appointment ? 'Editar Cita Agendada' : 'Agendar Nueva Cita'}
              </h3>
              <p className="text-xs text-slate-500">Agenda Digital y Control de Horas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mensaje de error si ocurre */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Nombre del Cliente / Empresa (Texto libre) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-blue-600" />
              Cliente o Empresa <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Industrias Alimentarias del Norte, Distribuidora Central..."
              value={formData.cliente_nombre}
              onChange={(e) => setFormData({ ...formData, cliente_nombre: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Selección de Capacitador (con iniciales y color distintivo) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <User className="w-4 h-4 text-blue-600" />
              Capacitador Asignado <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {capacitadores.map((cap) => {
                const isSelected = String(cap.id) === String(formData.capacitador_id);
                return (
                  <button
                    key={cap.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, capacitador_id: cap.id })}
                    className={`p-2.5 rounded-xl text-left border text-xs font-semibold flex items-center gap-2.5 transition-all ${
                      isSelected
                        ? 'ring-2 ring-blue-500 border-transparent shadow-sm bg-blue-50/60'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <span
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white shrink-0 shadow-xs"
                      style={{ backgroundColor: cap.color }}
                    >
                      {cap.iniciales}
                    </span>
                    <span className="truncate text-slate-800 font-bold">{cap.nombre_completo.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fecha, Horarios y Cálculo de Horas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Fecha <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={formData.fecha}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Hora Inicio
              </label>
              <input
                type="time"
                value={formData.hora_inicio}
                onChange={(e) => handleTimeChange('hora_inicio', e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Hora Fin
              </label>
              <input
                type="time"
                value={formData.hora_fin}
                onChange={(e) => handleTimeChange('hora_fin', e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Control de Horas Calculadas (H) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Calculator className="w-5 h-5 text-blue-600" />
              <div>
                <span className="text-xs font-bold text-slate-900">Horas Totales (H)</span>
                <p className="text-[11px] text-slate-500">
                  {isManualHours ? 'Ajuste manual habilitado' : 'Calculado automáticamente de los horarios'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.25"
                min="0.25"
                max="24"
                value={formData.horas}
                readOnly={!isManualHours}
                onChange={(e) => setFormData({ ...formData, horas: e.target.value })}
                className={`w-24 px-3 py-1.5 rounded-xl text-base font-extrabold text-center border transition-all ${
                  isManualHours
                    ? 'bg-white border-blue-500 text-blue-700 ring-2 ring-blue-500/20 shadow-xs'
                    : 'bg-slate-200/80 border-slate-300 text-slate-900'
                }`}
              />
              <button
                type="button"
                onClick={() => {
                  if (isManualHours) {
                    const auto = calcHours(formData.hora_inicio, formData.hora_fin);
                    setFormData({ ...formData, horas: String(auto) });
                  }
                  setIsManualHours(!isManualHours);
                }}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 px-2.5 py-1.5 rounded-lg hover:bg-blue-50 border border-blue-200"
              >
                {isManualHours ? 'Auto' : 'Ajustar'}
              </button>
            </div>
          </div>

          {/* Modalidad y Tipo de Servicio */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Modalidad
              </label>
              <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
                {MODALIDADES.map((m) => {
                  const active = formData.modalidad === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setFormData({ ...formData, modalidad: m })}
                      className={`py-2 text-xs font-bold rounded-lg transition-all ${
                        active ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Tipo de Servicio
              </label>
              <select
                value={formData.tipo_servicio}
                onChange={(e) => setFormData({ ...formData, tipo_servicio: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {TIPOS_SERVICIO.map((ts) => (
                  <option key={ts} value={ts}>{ts}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Descripción / Observaciones de la cita */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <AlignLeft className="w-4 h-4 text-slate-500" />
              Descripción / Observaciones de la Cita
            </label>
            <textarea
              rows={3}
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value, observaciones: e.target.value })}
              placeholder="Escribe la descripción de los temas a tratar, sala, detalles o notas..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-normal text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
            />
          </div>

          {/* Botones de acción */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
            {appointment ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar Cita
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-blue-500/25 transition-all transform active:scale-95 disabled:opacity-50"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                {loading ? 'Guardando...' : appointment ? 'Guardar Cambios' : 'Registrar Cita'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
