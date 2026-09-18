import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  Users, 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  X, 
  AlertCircle, 
  Palette, 
  Phone, 
  Banknote, 
  ArrowLeft,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Sparkles
} from 'lucide-react';
import ConfirmModal from '../common/ConfirmModal';

const COLOR_PALETTES = [
  '#2563EB', // Azul Royal
  '#7C3AED', // Violeta
  '#059669', // Esmeralda
  '#D97706', // Ámbar
  '#DC2626', // Carmesí
  '#0891B2', // Cyan
  '#DB2777', // Rosa
  '#4F46E5', // Índigo
  '#475569', // Pizarra
];

// Generador de PIN seguro de alta entropía (no secuencial)
function generateRandomSecurePin() {
  const weakPins = new Set(['1234', '4321', '0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999', '1122', '1212', '2026', '2025']);
  for (let i = 0; i < 50; i++) {
    const num = Math.floor(1000 + Math.random() * 9000);
    const str = String(num);
    if (!weakPins.has(str) && !/(.)\1{2}/.test(str)) {
      return str;
    }
  }
  return '8492';
}

export default function CapacitadoresView({ capacitadores = [], citas = [], onSaveCapacitador, onDeleteCapacitador, onBackToCalendar }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCap, setEditingCap] = useState(null);
  const [formData, setFormData] = useState({
    nombre_completo: '',
    iniciales: '',
    color: '#2563EB',
    telefono: '',
    tarifa_hora: 150.00,
    pin: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Estados para visualización y copia rápida de PINs en tarjetas
  const [revealedPins, setRevealedPins] = useState({});
  const [copiedPinId, setCopiedPinId] = useState(null);

  const toggleRevealPin = (id) => {
    setRevealedPins(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyPin = (id, pinVal) => {
    if (!pinVal) return;
    navigator.clipboard.writeText(String(pinVal));
    setCopiedPinId(id);
    setTimeout(() => setCopiedPinId(null), 2000);
  };

  const openNewModal = () => {
    setEditingCap(null);
    setFormData({
      nombre_completo: '',
      iniciales: '',
      color: '#2563EB',
      telefono: '',
      tarifa_hora: 150.00,
      pin: generateRandomSecurePin()
    });
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (cap) => {
    setEditingCap(cap);
    setFormData({
      nombre_completo: cap.nombre_completo,
      iniciales: cap.iniciales,
      color: cap.color || '#2563EB',
      telefono: cap.telefono || '',
      tarifa_hora: cap.tarifa_hora !== undefined ? cap.tarifa_hora : 150.00,
      pin: cap.pin || ''
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleNameChange = (name) => {
    setFormData(prev => {
      let initials = prev.iniciales;
      // Sugerir iniciales automáticamente si está creando y no las ha escrito
      if (!editingCap && (!initials || initials.length <= 2)) {
        const parts = name.trim().split(/\s+/);
        if (parts.length >= 2 && parts[0] && parts[1]) {
          initials = (parts[0][0] + parts[1][0]).toUpperCase();
        } else if (parts.length === 1 && parts[0].length >= 2) {
          initials = parts[0].substring(0, 2).toUpperCase();
        }
      }
      return { ...prev, nombre_completo: name, iniciales };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const cleanNombre = formData.nombre_completo.trim();
    if (!cleanNombre) {
      setError('El nombre completo es requerido.');
      return;
    }

    if (cleanNombre.length < 3 || cleanNombre.length > 100) {
      setError('El nombre del capacitador debe tener entre 3 y 100 caracteres.');
      return;
    }

    const cleanInitials = formData.iniciales.trim().toUpperCase();
    if (!cleanInitials) {
      setError('Las iniciales son requeridas.');
      return;
    }

    if (!/^[A-Z0-9]{2,4}$/.test(cleanInitials)) {
      setError('Las iniciales deben contener de 2 a 4 letras o números (ej: DE, CP1).');
      return;
    }

    // Verificar iniciales duplicadas
    const isDuplicate = capacitadores.some(
      c => c.iniciales === cleanInitials && (!editingCap || Number(c.id) !== Number(editingCap.id))
    );
    if (isDuplicate) {
      setError(`Las iniciales '${cleanInitials}' ya están asignadas a otro capacitador.`);
      return;
    }

    // Validar color hexadecimal
    const cleanColor = formData.color.trim();
    if (!/^#[0-9A-Fa-f]{6}$/.test(cleanColor)) {
      setError('El color debe ser un código hexadecimal válido de 6 caracteres (ej: #3B82F6).');
      return;
    }

    // Validar teléfono si fue ingresado
    if (formData.telefono && formData.telefono.trim()) {
      const digits = formData.telefono.replace(/\D/g, '');
      if (digits.length < 8) {
        setError('El teléfono debe contener al menos 8 dígitos numéricos.');
        return;
      }
    }

    // Validar tarifa por hora
    const cleanTarifa = Number(formData.tarifa_hora);
    if (isNaN(cleanTarifa) || cleanTarifa < 0) {
      setError('La tarifa por hora debe ser un número válido mayor o igual a 0.');
      return;
    }

    // Validar PIN de 4 dígitos
    let cleanPin = formData.pin ? String(formData.pin).trim() : '';
    if (cleanPin) {
      if (!/^\d{4}$/.test(cleanPin)) {
        setError('El PIN debe contener exactamente 4 dígitos numéricos (ej: 8492).');
        return;
      }
    } else if (!editingCap) {
      cleanPin = generateRandomSecurePin();
    }

    setLoading(true);
    try {
      await onSaveCapacitador({
        ...formData,
        nombre_completo: cleanNombre,
        iniciales: cleanInitials,
        color: cleanColor,
        telefono: formData.telefono ? formData.telefono.trim() : '',
        tarifa_hora: cleanTarifa,
        pin: cleanPin
      }, editingCap?.id);
      setIsModalOpen(false);
    } catch (err) {
      setError(err.message || 'Error al guardar el capacitador.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    const cap = capacitadores.find(c => c.id === id);
    if (!cap) return;
    const citasCount = (citas || []).filter(ci => Number(ci.capacitador_id) === Number(id)).length;
    setDeleteTarget({ ...cap, citasCount });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget?.id) return;
    setDeleteLoading(true);
    try {
      await onDeleteCapacitador(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      alert(err.message || 'Error al eliminar capacitador');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Barra superior de catálogo */}
      <div className="glass-panel rounded-3xl p-5 border border-white/80 dark:border-white/10 shadow-glass flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-200">
        <div className="flex items-center gap-3">
          {onBackToCalendar && (
            <button
              type="button"
              onClick={onBackToCalendar}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white glass-pill hover:bg-white dark:hover:bg-slate-800 transition-colors shrink-0 group flex items-center gap-1.5 shadow-glass-sm cursor-pointer"
              title="Volver al calendario"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-bold hidden sm:inline">Volver</span>
            </button>
          )}
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Catálogo de Capacitadores ({capacitadores.length})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Personal docente con iniciales, color y PIN privado para acceso al portal móvil
            </p>
          </div>
        </div>

        <button
          onClick={openNewModal}
          className="inline-flex items-center gap-1.5 liquid-btn-primary px-4 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all self-start sm:self-auto cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Nuevo Capacitador</span>
        </button>
      </div>

      {/* Grid de Capacitadores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {capacitadores.map((cap) => (
          <div
            key={cap.id}
            className="glass-card glass-card-hover rounded-3xl p-5 border border-white/80 dark:border-white/10 shadow-glass-sm hover:shadow-glass-hover transition-all duration-200 flex items-center justify-between group"
          >
            <div className="flex items-center gap-3.5">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-base font-extrabold text-white shadow-sm"
                style={{ backgroundColor: cap.color }}
              >
                {cap.iniciales}
              </div>

              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  {cap.nombre_completo}
                </h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                    Código: {cap.iniciales}
                  </span>
                  {cap.pin && (
                    <span className="text-[11px] font-mono font-bold bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full inline-flex items-center gap-1.5 shadow-2xs">
                      <KeyRound className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>PIN: {revealedPins[cap.id] ? cap.pin : '••••'}</span>
                      <button
                        type="button"
                        onClick={() => toggleRevealPin(cap.id)}
                        className="text-amber-600 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-100 p-0.5 cursor-pointer"
                        title={revealedPins[cap.id] ? "Ocultar PIN" : "Ver PIN"}
                      >
                        {revealedPins[cap.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => copyPin(cap.id, cap.pin)}
                        className="text-amber-600 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-100 p-0.5 cursor-pointer"
                        title="Copiar PIN"
                      >
                        {copiedPinId === cap.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </span>
                  )}
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block"
                    style={{ backgroundColor: cap.color }}
                    title={`Color: ${cap.color}`}
                  />
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                    <Banknote className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    Q {Number(cap.tarifa_hora || 150).toFixed(2)}/hr
                  </span>
                  {cap.telefono && (
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono">
                      <Phone className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      {cap.telefono}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => openEditModal(cap)}
                title="Editar"
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(cap.id)}
                title="Eliminar"
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Crear / Editar montado en Portal (z-[9999]) para que nunca quede tapado por el navbar ni se corte */}
      {isModalOpen && createPortal(
        <div 
          className="fixed inset-0 z-[9999] w-full h-full min-h-[100dvh] bg-slate-950/70 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden animate-in fade-in duration-200"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="glass-panel w-full max-w-lg max-h-[92dvh] rounded-3xl shadow-2xl border border-white/80 dark:border-white/15 overflow-hidden flex flex-col my-auto relative animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Encabezado Fijo (shrink-0) */}
            <div className="shrink-0 flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  title="Volver"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-tight">
                    {editingCap ? 'Editar Capacitador' : 'Registrar Nuevo Capacitador'}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Control Centralizado de Equipo AD-RE-11
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 shrink-0">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Formulario Scrolleable (flex-1 overflow-y-auto) */}
            <form id="capacitador-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              <div>
                <label 
                  htmlFor="cap-nombre-completo"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1"
                >
                  Nombre Completo <span className="text-rose-500">*</span>
                </label>
                <input
                  id="cap-nombre-completo"
                  type="text"
                  required
                  autoFocus
                  placeholder="Ej: Mauricio Orozco"
                  value={formData.nombre_completo}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              <div>
                <label 
                  htmlFor="cap-iniciales"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1"
                >
                  Iniciales / Código de Agenda <span className="text-rose-500">*</span>
                </label>
                <input
                  id="cap-iniciales"
                  type="text"
                  required
                  maxLength={5}
                  placeholder="Ej: MO, OQ, PF"
                  value={formData.iniciales}
                  onChange={(e) => setFormData(prev => ({ ...prev, iniciales: e.target.value.toUpperCase() }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-mono font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Código de 2 a 4 letras que aparecerá en los bloques de la agenda.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label 
                    htmlFor="cap-pin"
                    className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>PIN de Seguridad (4 dígitos) <span className="text-rose-500">*</span></span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, pin: generateRandomSecurePin() }))}
                    className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                    title="Generar combinación de PIN segura y no secuencial"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Generar PIN Seguro</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="cap-pin"
                    type="text"
                    maxLength={4}
                    inputMode="numeric"
                    placeholder="Ej: 8492"
                    value={formData.pin}
                    onChange={(e) => setFormData(prev => ({ ...prev, pin: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-mono font-bold tracking-widest text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                  PIN privado que el capacitador usará para acceder a su portal móvil. Se prohíben claves obvias como 1234.
                </p>
              </div>

              <div>
                <label 
                  htmlFor="cap-telefono"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Teléfono / WhatsApp</span>
                </label>
                <input
                  id="cap-telefono"
                  type="text"
                  placeholder="Ej: +502 5555-1234"
                  value={formData.telefono}
                  onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                  Incluye código de país (ej. +502 para Guatemala) para el envío directo por WhatsApp.
                </p>
              </div>

              <div>
                <label 
                  htmlFor="cap-tarifa"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5"
                >
                  <Banknote className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Honorarios por Hora (Quetzales) <span className="text-rose-500">*</span></span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 dark:text-slate-400 font-bold text-xs">
                    Q
                  </div>
                  <input
                    id="cap-tarifa"
                    type="number"
                    step="0.50"
                    min="0"
                    required
                    placeholder="150.00"
                    value={formData.tarifa_hora}
                    onChange={(e) => setFormData(prev => ({ ...prev, tarifa_hora: e.target.value }))}
                    className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                  Tarifa por hora utilizada para computar los honorarios devengados y proyectados en tiempo real.
                </p>
              </div>

              {/* Selector de color */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Color Distintivo</span>
                </label>
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  {COLOR_PALETTES.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, color }))}
                      className={`w-7 h-7 rounded-xl transition-all cursor-pointer ${
                        formData.color === color ? 'ring-2 ring-offset-2 ring-slate-800 dark:ring-slate-300 scale-110' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 dark:border-slate-700 p-0"
                  />
                  <span className="text-xs font-mono text-slate-600 dark:text-slate-300 uppercase font-semibold">
                    {formData.color}
                  </span>
                </div>
              </div>

              {/* Previsualización del Badge */}
              <div className="bg-slate-50 dark:bg-slate-800/70 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Vista previa en calendario:</span>
                <div
                  className="px-2.5 py-1 rounded-md text-xs font-extrabold text-white flex items-center gap-1 shadow-2xs"
                  style={{ backgroundColor: formData.color }}
                >
                  <span>{formData.iniciales || '??'}</span>
                </div>
              </div>
            </form>

            {/* Pie de Página Fijo (shrink-0) - Siempre visible */}
            <div className="shrink-0 px-6 py-3.5 border-t border-slate-200/60 dark:border-white/10 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="capacitador-form"
                disabled={loading}
                className="inline-flex items-center gap-2 liquid-btn-primary px-5 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-md cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>{loading ? 'Guardando...' : (editingCap ? 'Guardar Cambios' : 'Guardar Capacitador')}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal de confirmación elegante para eliminar / desactivar capacitador */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => !deleteLoading && setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
        title={deleteTarget?.citasCount > 0 ? `¿Desactivar a ${deleteTarget.nombre_completo}?` : `¿Eliminar a ${deleteTarget?.nombre_completo}?`}
        message={`¿Estás seguro de que deseas proceder con el capacitador "${deleteTarget?.nombre_completo}" [${deleteTarget?.iniciales}]?`}
        detail={
          deleteTarget?.citasCount > 0 ? (
            <div>
              <p className="font-bold text-amber-800">⚠️ Este capacitador cuenta con {deleteTarget.citasCount} {deleteTarget.citasCount === 1 ? 'cita asignada' : 'citas asignadas'}.</p>
              <p className="text-slate-600 mt-1">Para no comprometer la agenda ni los reportes mensuales de capacitación, el capacitador pasará a estado <strong>Inactivo</strong> y no se perderá su historial.</p>
            </div>
          ) : (
            <div>
              <p className="font-semibold text-slate-700">Este capacitador no tiene ninguna cita asignada en el sistema.</p>
              <p className="text-slate-500 mt-0.5">Se eliminará completamente del catálogo de capacitadores.</p>
            </div>
          )
        }
        confirmText={deleteTarget?.citasCount > 0 ? 'Sí, Desactivar Capacitador' : 'Sí, Eliminar Capacitador'}
        cancelText="Cancelar"
        variant={deleteTarget?.citasCount > 0 ? 'warning' : 'danger'}
      />
    </div>
  );
}
