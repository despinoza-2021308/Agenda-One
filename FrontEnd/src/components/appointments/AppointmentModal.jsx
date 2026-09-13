import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  ArrowLeft,
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
  AlertTriangle,
  Calculator,
  AlignLeft,
  Search,
  ChevronDown,
  Plus,
  CheckCircle2,
  Phone,
  Mail,
  Car,
  MessageSquare
} from 'lucide-react';
import ConfirmModal from '../common/ConfirmModal';

const TIPOS_SERVICIO = ['Curso', 'Asesoría', 'Auditoría', 'Reunión', 'Seguimiento'];
const MODALIDADES = ['Presencial', 'Virtual', 'Híbrida'];

export const ESTADOS = [
  { id: 'Programada', label: 'Programada', emoji: '🗓️', colorClass: 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 hover:bg-blue-100/70', activeClass: 'bg-blue-600 text-white shadow-sm shadow-blue-500/30 border-blue-600' },
  { id: 'En Curso', label: 'En Curso', emoji: '⏳', colorClass: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-100/70', activeClass: 'bg-amber-500 text-white shadow-sm shadow-amber-500/30 border-amber-500' },
  { id: 'Impartida', label: 'Impartida', emoji: '✅', colorClass: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100/70', activeClass: 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/30 border-emerald-600' },
  { id: 'Cancelada', label: 'Cancelada', emoji: '❌', colorClass: 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800 hover:bg-rose-100/70', activeClass: 'bg-rose-600 text-white shadow-sm shadow-rose-500/30 border-rose-600' },
  { id: 'Reprogramada', label: 'Reprogramada', emoji: '🔄', colorClass: 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 hover:bg-purple-100/70', activeClass: 'bg-purple-600 text-white shadow-sm shadow-purple-500/30 border-purple-600' }
];

export default function AppointmentModal({
  isOpen,
  onClose,
  onBack,
  returnToDayDetails,
  appointment, // null si es nueva, o objeto cita si es edición
  initialDate,
  capacitadores = [],
  clientes = [],
  onQuickCreateCliente,
  allCitas = [],
  onSave,
  onDelete,
  onOpenWhatsApp
}) {
  const [formData, setFormData] = useState({
    cliente_nombre: '',
    cliente_id: null,
    capacitador_id: '',
    fecha: '',
    hora_inicio: '08:00',
    hora_fin: '12:00',
    horas: '4',
    modalidad: 'Presencial',
    tipo_servicio: 'Curso',
    estado: 'Programada',
    descripcion: '',
    observaciones: '',
    bitacora: ''
  });

  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const [isRegisteringClient, setIsRegisteringClient] = useState(false);
  const clientInputWrapperRef = useRef(null);

  const [isManualHours, setIsManualHours] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

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
        cliente_id: appointment.cliente_id || null,
        capacitador_id: appointment.capacitador_id || '',
        fecha: appointment.fecha || '',
        hora_inicio: appointment.hora_inicio || '08:00',
        hora_fin: appointment.hora_fin || '12:00',
        horas: appointment.horas ? String(appointment.horas) : '4',
        modalidad: appointment.modalidad || 'Presencial',
        tipo_servicio: appointment.tipo_servicio || 'Curso',
        estado: appointment.estado || 'Programada',
        descripcion: appointment.observaciones || '',
        observaciones: appointment.observaciones || '',
        bitacora: appointment.bitacora || ''
      });
      setIsManualHours(false);
    } else {
      const defaultDate = initialDate || new Date().toISOString().split('T')[0];
      const initialHoras = calcHours('08:00', '12:00');
      setFormData({
        cliente_nombre: '',
        cliente_id: null,
        capacitador_id: capacitadores.length > 0 ? capacitadores[0].id : '',
        fecha: defaultDate,
        hora_inicio: '08:00',
        hora_fin: '12:00',
        horas: String(initialHoras),
        modalidad: 'Presencial',
        tipo_servicio: 'Curso',
        estado: 'Programada',
        descripcion: '',
        observaciones: '',
        bitacora: ''
      });
      setIsManualHours(false);
    }
    setClientDropdownOpen(false);
    setError(null);
  }, [appointment, initialDate, isOpen, capacitadores]);

  // Cerrar dropdown de clientes al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (clientInputWrapperRef.current && !clientInputWrapperRef.current.contains(e.target)) {
        setClientDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Bloquear scroll de fondo y permitir cerrar con tecla Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isConfirmDeleteOpen) {
        if (onBack) onBack();
        else onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, isConfirmDeleteOpen, onBack, onClose]);

  // Cliente coincidente en catálogo
  const matchedClient = useMemo(() => {
    if (!formData.cliente_nombre.trim()) return null;
    return clientes.find(
      c => c.nombre_empresa.trim().toLowerCase() === formData.cliente_nombre.trim().toLowerCase() ||
           (formData.cliente_id && Number(c.id) === Number(formData.cliente_id))
    );
  }, [clientes, formData.cliente_nombre, formData.cliente_id]);

  // Sugerencias de clientes filtradas por búsqueda
  const filteredClients = useMemo(() => {
    const query = formData.cliente_nombre.trim().toLowerCase();
    if (!query) return clientes;
    return clientes.filter(c =>
      c.nombre_empresa.toLowerCase().includes(query) ||
      (c.contacto && c.contacto.toLowerCase().includes(query))
    );
  }, [clientes, formData.cliente_nombre]);

  const handleSelectClient = (client) => {
    setFormData(prev => ({
      ...prev,
      cliente_nombre: client.nombre_empresa,
      cliente_id: client.id
    }));
    setClientDropdownOpen(false);
  };

  const handleQuickRegister = async () => {
    const name = formData.cliente_nombre.trim();
    if (!name || !onQuickCreateCliente) return;
    setIsRegisteringClient(true);
    try {
      const created = await onQuickCreateCliente({ nombre_empresa: name });
      if (created && created.id) {
        setFormData(prev => ({
          ...prev,
          cliente_nombre: created.nombre_empresa || name,
          cliente_id: created.id
        }));
      }
      setClientDropdownOpen(false);
    } catch (err) {
      console.error('Error al registrar cliente:', err);
    } finally {
      setIsRegisteringClient(false);
    }
  };

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

  // Capacitador seleccionado actualmente
  const selectedTrainer = useMemo(() => {
    return capacitadores.find(cp => String(cp.id) === String(formData.capacitador_id));
  }, [capacitadores, formData.capacitador_id]);

  // Detección en tiempo real de traslapes de horario para el capacitador en la fecha seleccionada
  const isTimeRangeInvalid = useMemo(() => {
    if (!formData.hora_inicio || !formData.hora_fin) return false;
    const fStart = String(formData.hora_inicio).slice(0, 5);
    const fEnd = String(formData.hora_fin).slice(0, 5);
    return fStart >= fEnd;
  }, [formData.hora_inicio, formData.hora_fin]);

  const isWeekend = useMemo(() => {
    if (!formData.fecha) return false;
    const [y, m, d] = formData.fecha.split('-').map(Number);
    if (!y || !m || !d) return false;
    const dayOfWeek = new Date(y, m - 1, d).getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  }, [formData.fecha]);

  const isTrainerInactive = useMemo(() => {
    return selectedTrainer && selectedTrainer.activo === false;
  }, [selectedTrainer]);

  const conflictingCita = useMemo(() => {
    if (!formData.capacitador_id || !formData.fecha || !formData.hora_inicio || !formData.hora_fin) {
      return null;
    }

    // Si la cita que se está editando o creando es Cancelada, no genera conflicto
    if (formData.estado === 'Cancelada') return null;

    const fStart = String(formData.hora_inicio).slice(0, 5);
    const fEnd = String(formData.hora_fin).slice(0, 5);

    if (fStart >= fEnd) return null; // Horario inválido

    return allCitas.find(c => {
      const sameCap = String(c.capacitador_id) === String(formData.capacitador_id);
      const sameDate = String(c.fecha).split('T')[0] === String(formData.fecha).split('T')[0];
      const notSelf = !appointment || Number(c.id) !== Number(appointment.id);
      if (!sameCap || !sameDate || !notSelf) return false;
      if (c.estado === 'Cancelada') return false; // Citas canceladas liberan el horario

      const cStart = String(c.hora_inicio).slice(0, 5);
      const cEnd = String(c.hora_fin).slice(0, 5);

      // Interval overlap: inicioA < finB && finA > inicioB
      return cStart < fEnd && cEnd > fStart;
    });
  }, [allCitas, formData.capacitador_id, formData.fecha, formData.hora_inicio, formData.hora_fin, formData.estado, appointment]);

  // 1. Detección de Doble Agendamiento de Cliente (con otro capacitador en este mismo horario)
  const clientConflictCita = useMemo(() => {
    if (!formData.cliente_nombre?.trim() || !formData.fecha || !formData.hora_inicio || !formData.hora_fin) {
      return null;
    }
    if (formData.estado === 'Cancelada') return null;

    const fStart = String(formData.hora_inicio).slice(0, 5);
    const fEnd = String(formData.hora_fin).slice(0, 5);
    if (fStart >= fEnd) return null;

    const cName = formData.cliente_nombre.trim().toLowerCase();
    const cId = matchedClient?.id || formData.cliente_id;

    return allCitas.find(c => {
      const notSelf = !appointment || Number(c.id) !== Number(appointment.id);
      if (!notSelf || c.estado === 'Cancelada') return false;

      const sameDate = String(c.fecha).split('T')[0] === String(formData.fecha).split('T')[0];
      if (!sameDate) return false;

      const matchByName = (c.cliente_nombre || '').trim().toLowerCase() === cName;
      const matchById = cId && c.cliente_id && Number(c.cliente_id) === Number(cId);
      if (!matchByName && !matchById) return false;

      // Si es el mismo capacitador, ya lo maneja conflictingCita
      if (String(c.capacitador_id) === String(formData.capacitador_id)) return false;

      const cStart = String(c.hora_inicio).slice(0, 5);
      const cEnd = String(c.hora_fin).slice(0, 5);
      return cStart < fEnd && cEnd > fStart;
    });
  }, [allCitas, formData.cliente_nombre, formData.cliente_id, matchedClient, formData.fecha, formData.hora_inicio, formData.hora_fin, formData.estado, formData.capacitador_id, appointment]);

  // 2. Control de Jornada Diaria / Fatiga del Capacitador (+8h o +12h en el día)
  const trainerDailyStats = useMemo(() => {
    if (!formData.capacitador_id || !formData.fecha) {
      return { totalHours: 0, isOverloaded: false, isExtreme: false };
    }

    const currentAppointmentHours = parseFloat(formData.horas) || 0;
    const otherCitasHours = allCitas
      .filter(c => {
        const sameCap = String(c.capacitador_id) === String(formData.capacitador_id);
        const sameDate = String(c.fecha).split('T')[0] === String(formData.fecha).split('T')[0];
        const notSelf = !appointment || Number(c.id) !== Number(appointment.id);
        return sameCap && sameDate && notSelf && c.estado !== 'Cancelada';
      })
      .reduce((acc, c) => acc + (parseFloat(c.horas) || 0), 0);

    const totalHours = Math.round((otherCitasHours + currentAppointmentHours) * 100) / 100;
    return {
      totalHours,
      isOverloaded: totalHours > 8,
      isExtreme: totalHours > 12
    };
  }, [allCitas, formData.capacitador_id, formData.fecha, formData.horas, appointment]);

  // 3. Aviso de Traslado Presencial Inmediato (Buffer Zero entre distintas empresas)
  const transitWarning = useMemo(() => {
    if (formData.modalidad !== 'Presencial' || !formData.capacitador_id || !formData.fecha || !formData.hora_inicio || !formData.hora_fin) {
      return null;
    }
    if (formData.estado === 'Cancelada') return null;

    const fStart = String(formData.hora_inicio).slice(0, 5);
    const fEnd = String(formData.hora_fin).slice(0, 5);
    const currentClientName = (formData.cliente_nombre || '').trim().toLowerCase();

    return allCitas.find(c => {
      const sameCap = String(c.capacitador_id) === String(formData.capacitador_id);
      const sameDate = String(c.fecha).split('T')[0] === String(formData.fecha).split('T')[0];
      const notSelf = !appointment || Number(c.id) !== Number(appointment.id);
      if (!sameCap || !sameDate || !notSelf || c.estado === 'Cancelada' || c.modalidad !== 'Presencial') return false;

      const otherClientName = (c.cliente_nombre || '').trim().toLowerCase();
      if (currentClientName && otherClientName === currentClientName) return false;

      const cStart = String(c.hora_inicio).slice(0, 5);
      const cEnd = String(c.hora_fin).slice(0, 5);

      return cEnd === fStart || cStart === fEnd;
    });
  }, [allCitas, formData.modalidad, formData.capacitador_id, formData.fecha, formData.hora_inicio, formData.hora_fin, formData.cliente_nombre, formData.estado, appointment]);

  // 4. Aviso de Agendamiento en Fecha Pasada
  const isPastDateWarning = useMemo(() => {
    if (!formData.fecha || formData.estado !== 'Programada') return false;
    const todayStr = new Date().toISOString().split('T')[0];
    return formData.fecha < todayStr;
  }, [formData.fecha, formData.estado]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (isTimeRangeInvalid) {
      setError('La hora de fin debe ser posterior a la hora de inicio.');
      return;
    }

    if (isTrainerInactive) {
      setError(`El capacitador ${selectedTrainer ? selectedTrainer.nombre_completo : ''} se encuentra inactivo y no puede recibir citas.`);
      return;
    }

    if (conflictingCita) {
      setError(`Conflicto de horario: ${selectedTrainer ? selectedTrainer.nombre_completo : 'El capacitador'} ya tiene una actividad de ${conflictingCita.hora_inicio} a ${conflictingCita.hora_fin} en esta fecha.`);
      return;
    }

    if (!formData.cliente_nombre.trim()) {
      setError('Por favor escribe el nombre del cliente o empresa.');
      return;
    }

    if (formData.cliente_nombre.trim().length < 2 || formData.cliente_nombre.trim().length > 120) {
      setError('El nombre del cliente o empresa debe tener entre 2 y 120 caracteres.');
      return;
    }

    if (!formData.capacitador_id || !formData.fecha) {
      setError('Por favor selecciona el capacitador y la fecha.');
      return;
    }

    const numHoras = parseFloat(formData.horas);
    if (isNaN(numHoras) || numHoras < 0.25 || numHoras > 16) {
      setError('Las horas deben ser un número entre 0.25h (15 min) y 16.0h.');
      return;
    }

    const obsText = (formData.descripcion || formData.observaciones || '').trim();
    if (obsText.length > 500) {
      setError('Las observaciones no pueden exceder los 500 caracteres.');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        ...formData,
        cliente_nombre: formData.cliente_nombre.trim(),
        cliente_id: matchedClient ? matchedClient.id : (formData.cliente_id || null),
        capacitador_id: parseInt(formData.capacitador_id, 10),
        horas: numHoras,
        observaciones: obsText
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Error al guardar la cita.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!appointment?.id) return;
    setIsConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!appointment?.id) return;
    setLoading(true);
    try {
      await onDelete(appointment.id);
      setIsConfirmDeleteOpen(false);
      onClose();
    } catch (err) {
      setError(err.message || 'Error al eliminar la cita.');
      setIsConfirmDeleteOpen(false);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] w-screen h-screen bg-slate-950/75 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-hidden"
    >
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150 relative"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Cabecera fija del modal (shrink-0) */}
        <div className="shrink-0 flex items-center justify-between px-6 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/70 backdrop-blur-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Flechita para volver atrás */}
            <button
              type="button"
              onClick={onBack || onClose}
              className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-700/70 transition-colors flex items-center gap-1.5 group shrink-0 mr-1"
              title={returnToDayDetails ? "Volver a las citas del día" : "Volver"}
            >
              <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-0.5 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {returnToDayDetails ? "Citas del Día" : "Volver"}
              </span>
            </button>

            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm shadow-blue-500/30 shrink-0">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0 truncate">
              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight truncate">
                {appointment?.id ? 'Editar Cita Agendada' : 'Agendar Nueva Cita'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Agenda Digital y Control de Horas (AD-RE-11)</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            {onOpenWhatsApp && appointment?.id && (
              <button
                type="button"
                onClick={() => onOpenWhatsApp({ cita: appointment, fromAppointmentModal: appointment })}
                className="p-1.5 rounded-xl text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 transition-colors flex items-center gap-1.5"
                title="Notificar esta cita por WhatsApp"
              >
                <MessageSquare className="w-5 h-5 fill-emerald-600/20" />
                <span className="text-xs font-bold hidden sm:inline">WhatsApp</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Formulario con flex flex-col flex-1 min-h-0 */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          
          {/* Cuerpo del formulario con scroll vertical interno suave */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            
            {/* Mensaje de error si ocurre */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="font-medium">{error}</span>
              </div>
            )}
          
          {/* Nombre del Cliente / Empresa con Autocompletado Inteligente */}
          <div ref={clientInputWrapperRef} className="relative">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Cliente o Empresa <span className="text-rose-500">*</span></span>
              </label>

              {matchedClient ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  Catálogo Oficial
                </span>
              ) : formData.cliente_nombre.trim() ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full">
                  Empresa Personalizada
                </span>
              ) : null}
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                required
                placeholder="Buscar o escribir nombre de la empresa..."
                value={formData.cliente_nombre}
                onFocus={() => setClientDropdownOpen(true)}
                onChange={(e) => {
                  const val = e.target.value;
                  const match = clientes.find(c => c.nombre_empresa.trim().toLowerCase() === val.trim().toLowerCase());
                  setFormData(prev => ({
                    ...prev,
                    cliente_nombre: val,
                    cliente_id: match ? match.id : null
                  }));
                  setClientDropdownOpen(true);
                }}
                className="w-full pl-10 pr-20 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />

              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {formData.cliente_nombre && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, cliente_nombre: '', cliente_id: null }));
                      setClientDropdownOpen(false);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-700"
                    title="Limpiar"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setClientDropdownOpen(prev => !prev)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-700"
                  title="Ver clientes del catálogo"
                >
                  <ChevronDown className={`w-4 h-4 transition-transform ${clientDropdownOpen ? 'rotate-180 text-blue-600 dark:text-blue-400' : ''}`} />
                </button>
              </div>
            </div>

            {/* Menú Desplegable de Sugerencias */}
            {clientDropdownOpen && (
              <div className="absolute left-0 right-0 z-40 mt-1.5 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in zoom-in-95 duration-150">
                <div className="p-2 bg-slate-50 dark:bg-slate-800/80 text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>Catálogo de Clientes ({filteredClients.length})</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">Haz clic para autocompletar</span>
                </div>

                {filteredClients.length > 0 ? (
                  filteredClients.map((client) => {
                    const isSelected = matchedClient?.id === client.id;
                    return (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() => handleSelectClient(client)}
                        className={`w-full text-left px-3.5 py-2.5 flex items-start gap-3 hover:bg-blue-50/70 dark:hover:bg-slate-800/70 transition-colors ${
                          isSelected ? 'bg-blue-50 dark:bg-blue-950/40 font-bold text-blue-900 dark:text-blue-200' : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}>
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold truncate">{client.nombre_empresa}</p>
                          {(client.contacto || client.telefono) && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                              {client.contacto && <span>👤 {client.contacto}</span>}
                              {client.telefono && <span>📞 {client.telefono}</span>}
                            </p>
                          )}
                        </div>
                        {isSelected && (
                          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 px-1.5 py-0.5 rounded shadow-2xs">
                            ✓ Activo
                          </span>
                        )}
                      </button>
                    );
                  })
                ) : (
                  <div className="p-3 text-center text-xs text-slate-500 dark:text-slate-400">
                    No se encontró ninguna empresa con ese nombre en el catálogo.
                  </div>
                )}

                {/* Opción para registrar al vuelo si no existe coincidencia exacta */}
                {formData.cliente_nombre.trim() && !matchedClient && onQuickCreateCliente && (
                  <button
                    type="button"
                    onClick={handleQuickRegister}
                    disabled={isRegisteringClient}
                    className="w-full text-left px-3.5 py-2.5 bg-blue-50/60 dark:bg-blue-950/40 hover:bg-blue-100/80 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold flex items-center justify-between transition-colors border-t border-blue-100 dark:border-blue-900"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Plus className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span className="text-xs truncate">
                        Registrar <strong>"{formData.cliente_nombre.trim()}"</strong> en el catálogo
                      </span>
                    </div>
                    <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-md font-bold shrink-0 shadow-2xs">
                      {isRegisteringClient ? 'Guardando...' : '+ Guardar'}
                    </span>
                  </button>
                )}
              </div>
            )}

            {/* Chips Rápidos de Empresas Frecuentes */}
            {clientes.length > 0 && !matchedClient && (
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Sugerencias:</span>
                {clientes.slice(0, 4).map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectClient(c)}
                    className="text-[11px] px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/50 dark:hover:bg-blue-950/50 hover:text-blue-700 dark:hover:text-blue-300 font-semibold transition-all shadow-2xs"
                  >
                    {c.nombre_empresa.length > 22 ? c.nombre_empresa.slice(0, 22) + '…' : c.nombre_empresa}
                  </button>
                ))}
              </div>
            )}

            {/* Detalle verificado de la empresa seleccionada */}
            {matchedClient && (
              <div className="mt-2 p-2.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between animate-in fade-in duration-150">
                <div className="flex items-center gap-2 truncate">
                  <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <Building2 className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <p className="font-bold text-slate-900 dark:text-white text-xs truncate">{matchedClient.nombre_empresa}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-2">
                      {matchedClient.contacto && <span>Contacto: <strong className="text-slate-700 dark:text-slate-300">{matchedClient.contacto}</strong></span>}
                      {matchedClient.telefono && <span>· Tel: {matchedClient.telefono}</span>}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-300 bg-blue-100/70 dark:bg-blue-950/80 px-2 py-0.5 rounded-full shrink-0 border border-blue-200 dark:border-blue-800">
                  Enlazado
                </span>
              </div>
            )}
          </div>

          {/* Selección de Capacitador (con iniciales y color distintivo) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Capacitador Asignado <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {capacitadores.map((cap) => {
                const isSelected = String(cap.id) === String(formData.capacitador_id);
                return (
                  <button
                    key={cap.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, capacitador_id: cap.id })}
                    className={`p-2.5 rounded-xl text-left border text-xs font-semibold flex items-center gap-2.5 transition-all ${
                      isSelected
                        ? 'ring-2 ring-blue-500 border-transparent shadow-sm bg-blue-50/60 dark:bg-blue-950/50'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <span
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white shrink-0 shadow-xs"
                      style={{ backgroundColor: cap.color }}
                    >
                      {cap.iniciales}
                    </span>
                    <span className="truncate text-slate-800 dark:text-slate-200 font-bold">{cap.nombre_completo.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
            {isTrainerInactive && (
              <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-lg px-2.5 py-1 mt-1.5 flex items-center gap-1">
                ⚠️ Este capacitador se encuentra inactivo y no puede recibir nuevas citas.
              </p>
            )}
          </div>

          {/* Fecha, Horarios y Cálculo de Horas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Fecha <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={formData.fecha}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              {isWeekend && (
                <p className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded-lg px-2 py-0.5 mt-1 flex items-center gap-1">
                  🗓️ Fin de semana
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Hora Inicio
              </label>
              <input
                type="time"
                value={formData.hora_inicio}
                onChange={(e) => handleTimeChange('hora_inicio', e.target.value)}
                required
                className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 ${
                  isTimeRangeInvalid ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 dark:border-slate-700 focus:ring-blue-500/20 focus:border-blue-500'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Hora Fin
              </label>
              <input
                type="time"
                value={formData.hora_fin}
                onChange={(e) => handleTimeChange('hora_fin', e.target.value)}
                required
                className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 ${
                  isTimeRangeInvalid ? 'border-rose-400 focus:ring-rose-200 text-rose-700 dark:text-rose-400' : 'border-slate-200 dark:border-slate-700 focus:ring-blue-500/20 focus:border-blue-500'
                }`}
              />
              {isTimeRangeInvalid && (
                <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-0.5">
                  ⚠️ Fin debe ser posterior a inicio.
                </p>
              )}
            </div>
          </div>

          {/* Control de Horas Calculadas (H) */}
          <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Calculator className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white">Horas Totales (H)</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
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
                    ? 'bg-white dark:bg-slate-900 border-blue-500 text-blue-700 dark:text-blue-400 ring-2 ring-blue-500/20 shadow-xs'
                    : 'bg-slate-200/80 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white'
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
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 px-2.5 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-700 border border-blue-200 dark:border-blue-800"
              >
                {isManualHours ? 'Auto' : 'Ajustar'}
              </button>
            </div>
          </div>

          {/* ALERTA PREVENTIVA EN ROJO: Detección inteligente de traslapes/conflictos */}
          {conflictingCita && (
            <div className="bg-rose-50 dark:bg-rose-950/50 border-2 border-rose-300 dark:border-rose-900 rounded-2xl p-4 flex items-start gap-3.5 text-rose-950 dark:text-rose-200 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-900/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 stroke-[2.5]" />
              </div>
              <div className="text-xs space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <p className="font-black text-sm text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                    🚨 Conflicto de Horario Detectado
                  </p>
                  <span className="bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-200 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Empalme
                  </span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                  <strong className="text-rose-900 dark:text-rose-200 font-bold">
                    {selectedTrainer ? selectedTrainer.nombre_completo : 'El capacitador'}
                  </strong> ya tiene otra actividad asignada en este mismo horario el {formData.fecha}:
                </p>
                <div className="bg-white/90 dark:bg-slate-800 rounded-xl p-2.5 border border-rose-200 dark:border-rose-900 text-slate-800 dark:text-slate-200 space-y-1 shadow-2xs">
                  <p className="font-extrabold text-xs text-slate-900 dark:text-white">
                    📌 {conflictingCita.observaciones || `${conflictingCita.tipo_servicio} Programado`}
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px] flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Empresa: <strong className="text-slate-800 dark:text-slate-200">{conflictingCita.cliente_nombre}</strong></span>
                  </p>
                  <p className="font-mono text-rose-700 dark:text-rose-400 font-bold text-[11px] flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>Horario ocupado: {conflictingCita.hora_inicio} - {conflictingCita.hora_fin} ({conflictingCita.horas}h)</span>
                  </p>
                </div>
                <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold italic">
                  ⚠️ Modifica el horario o asigna a otro capacitador disponible para poder guardar.
                </p>
              </div>
            </div>
          )}

          {/* ALERTA PREVENTIVA: Doble Agendamiento del Cliente en el mismo horario con otro capacitador */}
          {clientConflictCita && !conflictingCita && (
            <div className="bg-amber-50/90 dark:bg-amber-950/50 border-2 border-amber-300 dark:border-amber-900 rounded-2xl p-4 flex items-start gap-3.5 text-amber-950 dark:text-amber-200 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                <Building2 className="w-5 h-5 text-amber-700 dark:text-amber-400" />
              </div>
              <div className="text-xs space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <p className="font-black text-sm text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                    🏢 Doble Agendamiento de Empresa Detectado
                  </p>
                  <span className="bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Aviso
                  </span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                  La empresa <strong className="text-amber-950 dark:text-amber-200 font-bold">{formData.cliente_nombre}</strong> ya tiene otra sesión programada en este mismo intervalo horario con otro capacitador:
                </p>
                <div className="bg-white/90 dark:bg-slate-800 rounded-xl p-2.5 border border-amber-200 dark:border-amber-900 text-slate-800 dark:text-slate-200 space-y-1 shadow-2xs">
                  <p className="font-extrabold text-xs text-slate-900 dark:text-white">
                    📌 {clientConflictCita.observaciones || `${clientConflictCita.tipo_servicio} Programado`}
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px] flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Capacitador: <strong className="text-slate-800 dark:text-slate-200">{clientConflictCita.capacitador_nombre} [{clientConflictCita.capacitador_iniciales}]</strong></span>
                  </p>
                  <p className="font-mono text-amber-800 dark:text-amber-400 font-bold text-[11px] flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Horario: {clientConflictCita.hora_inicio} - {clientConflictCita.hora_fin} ({clientConflictCita.horas}h)</span>
                  </p>
                </div>
                <p className="text-[11px] text-amber-800 dark:text-amber-400 font-medium">
                  💡 Si la empresa organizó dos capacitaciones en simultáneo para grupos separados puedes guardar; de lo contrario, coordina con la empresa para evitar empalmes.
                </p>
              </div>
            </div>
          )}

          {/* ALERTA: Sobrecarga de Horas Diarias (+8h o +12h) */}
          {trainerDailyStats.isOverloaded && !conflictingCita && (
            <div className={`border rounded-2xl p-3.5 flex items-start gap-3 shadow-2xs animate-in fade-in duration-150 ${
              trainerDailyStats.isExtreme
                ? 'bg-rose-50/80 dark:bg-rose-950/50 border-rose-300 dark:border-rose-900 text-rose-950 dark:text-rose-200'
                : 'bg-amber-50/80 dark:bg-amber-950/50 border-amber-300 dark:border-amber-900 text-amber-950 dark:text-amber-200'
            }`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                trainerDailyStats.isExtreme ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400' : 'bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400'
              }`}>
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="text-xs space-y-1 min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold">
                    {trainerDailyStats.isExtreme ? '🚨 Jornada Extrema del Capacitador' : '⚠️ Aviso de Sobrecarga de Horas Diarias'}
                  </span>
                  <span className="font-mono font-black px-2 py-0.5 rounded-full bg-white/90 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px]">
                    {trainerDailyStats.totalHours}h en el día
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Con esta cita, <strong className="text-slate-900 dark:text-white">{selectedTrainer?.nombre_completo || 'el capacitador'}</strong> sumará <strong>{trainerDailyStats.totalHours} horas</strong> de capacitación en la fecha {formData.fecha} (la jornada recomendada es de 8h).
                </p>
              </div>
            </div>
          )}

          {/* AVISO: Traslado Inmediato / Citas Presenciales Consecutivas entre Distintas Empresas */}
          {transitWarning && !conflictingCita && (
            <div className="bg-blue-50/80 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-2xl p-3.5 flex items-start gap-3 text-blue-950 dark:text-blue-200 shadow-2xs animate-in fade-in duration-150">
              <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                <Car className="w-4 h-4" />
              </div>
              <div className="text-xs space-y-1 min-w-0 flex-1">
                <p className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                  🚗 Aviso de Desplazamiento Presencial Continuo
                </p>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  El capacitador tiene otra cita presencial continua con <strong className="text-slate-900 dark:text-white">{transitWarning.cliente_nombre}</strong> ({transitWarning.hora_inicio} - {transitWarning.hora_fin}). Asegúrate de prever tiempo suficiente de traslado entre ambas empresas.
                </p>
              </div>
            </div>
          )}

          {/* SUGERENCIA: Cita en Fecha Pasada */}
          {isPastDateWarning && (
            <div className="bg-slate-100/90 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 flex items-start gap-2.5 text-slate-700 dark:text-slate-300 text-xs animate-in fade-in duration-150">
              <span className="text-sm">💡</span>
              <p className="leading-relaxed">
                Esta cita está agendada para una fecha anterior a hoy (<strong className="text-slate-900 dark:text-white">{formData.fecha}</strong>). Si la capacitación ya fue impartida con éxito, considera seleccionar el estado <strong className="text-emerald-700 dark:text-emerald-400 font-bold">Impartida ✅</strong>.
              </p>
            </div>
          )}

          {/* Estado de la Cita (Ciclo de Vida de la Capacitación) */}
          <div className="bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <span>Estado de la Cita</span>
                <span className="text-[10px] font-normal text-slate-400 dark:text-slate-500">· Ciclo AD-RE-11</span>
              </label>

              {formData.estado === 'Cancelada' && (
                <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-100/90 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-900 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span>Libera horario y no suma horas</span>
                </span>
              )}
              {formData.estado === 'Impartida' && (
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/90 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span>Computa 100% de horas</span>
                </span>
              )}
              {formData.estado === 'En Curso' && (
                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100/90 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span>En desarrollo activo</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 sm:gap-2">
              {ESTADOS.map((est) => {
                const isActive = (formData.estado || 'Programada') === est.id;
                return (
                  <button
                    key={est.id}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, estado: est.id }))}
                    className={`px-2 py-2 rounded-xl text-[11px] sm:text-xs font-bold border transition-all flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap ${
                      isActive ? est.activeClass : `${est.colorClass} border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800`
                    }`}
                  >
                    <span>{est.emoji}</span>
                    <span>{est.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Modalidad y Tipo de Servicio */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Modalidad
              </label>
              <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                {MODALIDADES.map((m) => {
                  const active = formData.modalidad === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setFormData({ ...formData, modalidad: m })}
                      className={`py-2 text-xs font-bold rounded-lg transition-all ${
                        active ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Tipo de Servicio
              </label>
              <select
                value={formData.tipo_servicio}
                onChange={(e) => setFormData({ ...formData, tipo_servicio: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {TIPOS_SERVICIO.map((ts) => (
                  <option key={ts} value={ts}>{ts}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Descripción / Observaciones de la cita */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <AlignLeft className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                Descripción / Observaciones de la Cita
              </label>
              <span className={`text-[10px] font-mono font-bold ${
                (formData.descripcion || '').length > 500 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400 dark:text-slate-500'
              }`}>
                {(formData.descripcion || '').length} / 500
              </span>
            </div>
            <textarea
              rows={3}
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value, observaciones: e.target.value })}
              placeholder="Escribe la descripción de los temas a tratar, sala, detalles o notas..."
              className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm font-normal text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 resize-none ${
                (formData.descripcion || '').length > 500
                  ? 'border-rose-400 focus:ring-rose-200'
                  : 'border-slate-200 dark:border-slate-700 focus:ring-blue-500/20 focus:border-blue-500'
              }`}
            />
            {(formData.descripcion || '').length > 500 && (
              <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 mt-1">
                ⚠️ Las observaciones no deben superar los 500 caracteres.
              </p>
            )}
          </div>

          {/* Bitácora de Sesión (Portal Móvil del Capacitador) */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black text-emerald-900 dark:text-emerald-200 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Bitácora de Sesión (Portal del Capacitador)</span>
              </label>
              {formData.bitacora ? (
                <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 px-2 py-0.5 rounded-full">
                  Registrada en campo
                </span>
              ) : (
                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                  Sin registro previo
                </span>
              )}
            </div>
            <textarea
              rows={3}
              value={formData.bitacora || ''}
              onChange={(e) => setFormData({ ...formData, bitacora: e.target.value })}
              placeholder="Notas redactadas por el capacitador sobre la sesión, temas cubiertos y compromisos..."
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800/90 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-xs sm:text-sm font-normal text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none placeholder:text-slate-400"
            />
            <p className="text-[10px] text-emerald-800/80 dark:text-emerald-400/80 mt-1">
              Esta bitácora puede ser completada tanto por la administración como por el capacitador desde su portal móvil al terminar el servicio.
            </p>
          </div>
        </div>

        {/* Pie fijo con botones de acción (shrink-0) */}
        <div className="shrink-0 px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/80 backdrop-blur-xs flex items-center justify-between gap-3">
          {appointment?.id ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Eliminar Cita</span>
                <span className="sm:hidden">Eliminar</span>
              </button>

              {onOpenWhatsApp && (
                <button
                  type="button"
                  onClick={() => onOpenWhatsApp({ cita: appointment, fromAppointmentModal: appointment })}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 transition-all shadow-2xs group"
                  title="Enviar itinerario y detalles de esta cita por WhatsApp"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400 fill-emerald-600/20 group-hover:scale-110 transition-transform" />
                  <span>Notificar WhatsApp</span>
                </button>
              )}
            </div>
          ) : <div />}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBack || onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !!conflictingCita || isTimeRangeInvalid || isTrainerInactive || (formData.descripcion || '').length > 500}
              title={
                conflictingCita
                  ? 'Conflicto de horario: El capacitador ya está ocupado en ese rango'
                  : isTimeRangeInvalid
                  ? 'Horario inválido: Hora fin debe ser mayor a hora inicio'
                  : isTrainerInactive
                  ? 'Capacitador inactivo'
                  : ''
              }
              className={`inline-flex items-center gap-2 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all transform active:scale-95 ${
                conflictingCita || isTimeRangeInvalid || isTrainerInactive || (formData.descripcion || '').length > 500
                  ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-600 cursor-not-allowed shadow-none'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/25'
              }`}
            >
              <Check className="w-4 h-4 stroke-[3]" />
              {loading ? 'Guardando...' : appointment?.id ? 'Guardar Cambios' : 'Registrar Cita'}
            </button>
          </div>
        </div>
      </form>
    </div>

    {/* Modal de confirmación elegante para eliminar cita */}
    <ConfirmModal
      isOpen={isConfirmDeleteOpen}
      onClose={() => setIsConfirmDeleteOpen(false)}
      onConfirm={handleConfirmDelete}
      loading={loading}
      title="¿Eliminar esta cita agendada?"
      message={`¿Estás seguro de que deseas eliminar la cita con ${appointment?.cliente_nombre || 'el cliente'} programada para el ${appointment?.fecha} (${appointment?.hora_inicio} - ${appointment?.hora_fin})?`}
      detail={
        <div>
          <p className="font-bold text-slate-800">📌 Actividad: {appointment?.observaciones || appointment?.tipo_servicio || 'Capacitación'}</p>
          <p className="text-slate-500 mt-1">Esta acción eliminará la cita de la agenda y liberará el horario del capacitador asignado.</p>
        </div>
      }
      confirmText="Sí, Eliminar Cita"
      cancelText="Conservar Cita"
      variant="danger"
    />
  </div>,
  document.body
);
}
