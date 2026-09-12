import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  AlertTriangle,
  Calculator,
  AlignLeft,
  Search,
  ChevronDown,
  Plus,
  CheckCircle2,
  Phone,
  Mail
} from 'lucide-react';

const TIPOS_SERVICIO = ['Curso', 'Asesoría', 'Auditoría', 'Reunión', 'Seguimiento'];
const MODALIDADES = ['Presencial', 'Virtual', 'Híbrida'];

export default function AppointmentModal({
  isOpen,
  onClose,
  appointment, // null si es nueva, o objeto cita si es edición
  initialDate,
  capacitadores = [],
  clientes = [],
  onQuickCreateCliente,
  allCitas = [],
  onSave,
  onDelete
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
    descripcion: '',
    observaciones: ''
  });

  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const [isRegisteringClient, setIsRegisteringClient] = useState(false);
  const clientInputWrapperRef = useRef(null);

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
        cliente_id: appointment.cliente_id || null,
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
        cliente_id: null,
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
  const conflictingCita = useMemo(() => {
    if (!formData.capacitador_id || !formData.fecha || !formData.hora_inicio || !formData.hora_fin) {
      return null;
    }

    const fStart = String(formData.hora_inicio).slice(0, 5);
    const fEnd = String(formData.hora_fin).slice(0, 5);

    if (fStart >= fEnd) return null; // Horario inválido

    return allCitas.find(c => {
      const sameCap = String(c.capacitador_id) === String(formData.capacitador_id);
      const sameDate = String(c.fecha).split('T')[0] === String(formData.fecha).split('T')[0];
      const notSelf = !appointment || Number(c.id) !== Number(appointment.id);
      if (!sameCap || !sameDate || !notSelf) return false;

      const cStart = String(c.hora_inicio).slice(0, 5);
      const cEnd = String(c.hora_fin).slice(0, 5);

      // Interval overlap: inicioA < finB && finA > inicioB
      return cStart < fEnd && cEnd > fStart;
    });
  }, [allCitas, formData.capacitador_id, formData.fecha, formData.hora_inicio, formData.hora_fin, appointment]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (conflictingCita) {
      setError(`Conflicto de horario: ${selectedTrainer ? selectedTrainer.nombre_completo : 'El capacitador'} ya tiene una actividad de ${conflictingCita.hora_inicio} a ${conflictingCita.hora_fin} en esta fecha.`);
      return;
    }

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
        cliente_id: matchedClient ? matchedClient.id : (formData.cliente_id || null),
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
                {appointment?.id ? 'Editar Cita Agendada' : 'Agendar Nueva Cita'}
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
          
          {/* Nombre del Cliente / Empresa con Autocompletado Inteligente */}
          <div ref={clientInputWrapperRef} className="relative">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>Cliente o Empresa <span className="text-rose-500">*</span></span>
              </label>

              {matchedClient ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Catálogo Oficial
                </span>
              ) : formData.cliente_nombre.trim() ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  Empresa Personalizada
                </span>
              ) : null}
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                className="w-full pl-10 pr-20 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />

              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {formData.cliente_nombre && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, cliente_nombre: '', cliente_id: null }));
                      setClientDropdownOpen(false);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60"
                    title="Limpiar"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setClientDropdownOpen(prev => !prev)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60"
                  title="Ver clientes del catálogo"
                >
                  <ChevronDown className={`w-4 h-4 transition-transform ${clientDropdownOpen ? 'rotate-180 text-blue-600' : ''}`} />
                </button>
              </div>
            </div>

            {/* Menú Desplegable de Sugerencias */}
            {clientDropdownOpen && (
              <div className="absolute left-0 right-0 z-40 mt-1.5 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden max-h-56 overflow-y-auto divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-150">
                <div className="p-2 bg-slate-50 text-[11px] font-bold text-slate-500 flex items-center justify-between">
                  <span>Catálogo de Clientes ({filteredClients.length})</span>
                  <span className="text-[10px] text-slate-400 font-normal">Haz clic para autocompletar</span>
                </div>

                {filteredClients.length > 0 ? (
                  filteredClients.map((client) => {
                    const isSelected = matchedClient?.id === client.id;
                    return (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() => handleSelectClient(client)}
                        className={`w-full text-left px-3.5 py-2.5 flex items-start gap-3 hover:bg-blue-50/70 transition-colors ${
                          isSelected ? 'bg-blue-50 font-bold text-blue-900' : 'text-slate-800'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold truncate">{client.nombre_empresa}</p>
                          {(client.contacto || client.telefono) && (
                            <p className="text-[11px] text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
                              {client.contacto && <span>👤 {client.contacto}</span>}
                              {client.telefono && <span>📞 {client.telefono}</span>}
                            </p>
                          )}
                        </div>
                        {isSelected && (
                          <span className="text-[10px] font-bold text-blue-600 bg-white border border-blue-200 px-1.5 py-0.5 rounded shadow-2xs">
                            ✓ Activo
                          </span>
                        )}
                      </button>
                    );
                  })
                ) : (
                  <div className="p-3 text-center text-xs text-slate-500">
                    No se encontró ninguna empresa con ese nombre en el catálogo.
                  </div>
                )}

                {/* Opción para registrar al vuelo si no existe coincidencia exacta */}
                {formData.cliente_nombre.trim() && !matchedClient && onQuickCreateCliente && (
                  <button
                    type="button"
                    onClick={handleQuickRegister}
                    disabled={isRegisteringClient}
                    className="w-full text-left px-3.5 py-2.5 bg-blue-50/60 hover:bg-blue-100/80 text-blue-700 font-semibold flex items-center justify-between transition-colors border-t border-blue-100"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Plus className="w-4 h-4 text-blue-600 shrink-0" />
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
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sugerencias:</span>
                {clientes.slice(0, 4).map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectClient(c)}
                    className="text-[11px] px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-700 font-semibold transition-all shadow-2xs"
                  >
                    {c.nombre_empresa.length > 22 ? c.nombre_empresa.slice(0, 22) + '…' : c.nombre_empresa}
                  </button>
                ))}
              </div>
            )}

            {/* Detalle verificado de la empresa seleccionada */}
            {matchedClient && (
              <div className="mt-2 p-2.5 rounded-xl bg-blue-50/50 border border-blue-100 text-xs text-slate-600 flex items-center justify-between animate-in fade-in duration-150">
                <div className="flex items-center gap-2 truncate">
                  <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <Building2 className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <p className="font-bold text-slate-900 text-xs truncate">{matchedClient.nombre_empresa}</p>
                    <p className="text-[10px] text-slate-500 truncate flex items-center gap-2">
                      {matchedClient.contacto && <span>Contacto: <strong className="text-slate-700">{matchedClient.contacto}</strong></span>}
                      {matchedClient.telefono && <span>· Tel: {matchedClient.telefono}</span>}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-full shrink-0">
                  Enlazado
                </span>
              </div>
            )}
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

          {/* ALERTA PREVENTIVA EN ROJO: Detección inteligente de traslapes/conflictos */}
          {conflictingCita && (
            <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 flex items-start gap-3.5 text-rose-950 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="w-9 h-9 rounded-xl bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                <AlertTriangle className="w-5 h-5 text-rose-600 stroke-[2.5]" />
              </div>
              <div className="text-xs space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <p className="font-black text-sm text-rose-700 flex items-center gap-1.5">
                    🚨 Conflicto de Horario Detectado
                  </p>
                  <span className="bg-rose-200 text-rose-900 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Empalme
                  </span>
                </div>
                <p className="text-slate-700 font-medium leading-relaxed">
                  <strong className="text-rose-900 font-bold">
                    {selectedTrainer ? selectedTrainer.nombre_completo : 'El capacitador'}
                  </strong> ya tiene otra actividad asignada en este mismo horario el {formData.fecha}:
                </p>
                <div className="bg-white/90 rounded-xl p-2.5 border border-rose-200 text-slate-800 space-y-1 shadow-2xs">
                  <p className="font-extrabold text-xs text-slate-900">
                    📌 {conflictingCita.observaciones || `${conflictingCita.tipo_servicio} Programado`}
                  </p>
                  <p className="text-slate-600 text-[11px] flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Empresa: <strong className="text-slate-800">{conflictingCita.cliente_nombre}</strong></span>
                  </p>
                  <p className="font-mono text-rose-700 font-bold text-[11px] flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>Horario ocupado: {conflictingCita.hora_inicio} - {conflictingCita.hora_fin} ({conflictingCita.horas}h)</span>
                  </p>
                </div>
                <p className="text-[11px] text-rose-600 font-semibold italic">
                  ⚠️ Modifica el horario o asigna a otro capacitador disponible para poder guardar.
                </p>
              </div>
            </div>
          )}

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
            {appointment?.id ? (
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
                disabled={loading || !!conflictingCita}
                title={conflictingCita ? 'Conflicto de horario: El capacitador ya está ocupado en ese rango' : ''}
                className={`inline-flex items-center gap-2 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all transform active:scale-95 ${
                  conflictingCita
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
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
    </div>
  );
}
