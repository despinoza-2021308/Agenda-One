import React, { useState } from 'react';
import { Users, Plus, Edit2, Trash2, Check, X, AlertCircle, Palette, Phone } from 'lucide-react';

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

export default function CapacitadoresView({ capacitadores = [], onSaveCapacitador, onDeleteCapacitador }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCap, setEditingCap] = useState(null);
  const [formData, setFormData] = useState({
    nombre_completo: '',
    iniciales: '',
    color: '#2563EB',
    telefono: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const openNewModal = () => {
    setEditingCap(null);
    setFormData({ nombre_completo: '', iniciales: '', color: '#2563EB', telefono: '' });
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (cap) => {
    setEditingCap(cap);
    setFormData({
      nombre_completo: cap.nombre_completo,
      iniciales: cap.iniciales,
      color: cap.color || '#2563EB',
      telefono: cap.telefono || ''
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleNameChange = (name) => {
    let initials = formData.iniciales;
    // Sugerir iniciales automáticamente si está creando y no las ha escrito
    if (!editingCap && !initials) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        initials = (parts[0][0] + parts[1][0]).toUpperCase();
      } else if (parts.length === 1 && parts[0].length >= 2) {
        initials = parts[0].substring(0, 2).toUpperCase();
      }
    }
    setFormData({ ...formData, nombre_completo: name, iniciales });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre_completo.trim() || !formData.iniciales.trim()) {
      setError('Nombre e iniciales son obligatorios.');
      return;
    }

    setLoading(true);
    try {
      await onSaveCapacitador({
        ...formData,
        iniciales: formData.iniciales.trim().toUpperCase()
      }, editingCap?.id);
      setIsModalOpen(false);
    } catch (err) {
      setError(err.message || 'Error al guardar el capacitador.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Deseas eliminar o desactivar este capacitador?')) {
      try {
        await onDeleteCapacitador(id);
      } catch (err) {
        alert(err.message || 'Error al eliminar capacitador');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Barra superior de catálogo */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Catálogo de Capacitadores ({capacitadores.length})
          </h2>
          <p className="text-xs text-slate-500">
            Personal docente con iniciales y color asignado para distinción en la agenda
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Capacitador</span>
        </button>
      </div>

      {/* Grid de Capacitadores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {capacitadores.map((cap) => (
          <div
            key={cap.id}
            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3.5">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-base font-extrabold text-white shadow-sm"
                style={{ backgroundColor: cap.color }}
              >
                {cap.iniciales}
              </div>

              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {cap.nombre_completo}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                    Código: {cap.iniciales}
                  </span>
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block"
                    style={{ backgroundColor: cap.color }}
                    title={`Color: ${cap.color}`}
                  />
                  {cap.telefono && (
                    <span className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                      <Phone className="w-3 h-3 text-emerald-600" />
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
                className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(cap.id)}
                title="Eliminar"
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Crear / Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-900">
                {editingCap ? 'Editar Capacitador' : 'Registrar Nuevo Capacitador'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nombre Completo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Mauricio Orozco"
                  value={formData.nombre_completo}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Iniciales / Código de Agenda <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={5}
                  placeholder="Ej: MO, OQ, PF"
                  value={formData.iniciales}
                  onChange={(e) => setFormData({ ...formData, iniciales: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Código de 2 a 4 letras que aparecerá en los bloques de la agenda.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  Teléfono / WhatsApp
                </label>
                <input
                  type="text"
                  placeholder="Ej: +502 5555-1234"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Incluye código de país (ej. +502 para Guatemala) para el envío directo por WhatsApp.
                </p>
              </div>

              {/* Selector de color */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-blue-600" />
                  Color Distintivo
                </label>
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  {COLOR_PALETTES.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-7 h-7 rounded-xl transition-all ${
                        formData.color === color ? 'ring-2 ring-offset-2 ring-slate-800 scale-110' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 p-0"
                  />
                  <span className="text-xs font-mono text-slate-600 uppercase font-semibold">
                    {formData.color}
                  </span>
                </div>
              </div>

              {/* Previsualización del Badge */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-600">Vista previa en calendario:</span>
                <div
                  className="px-2.5 py-1 rounded-md text-xs font-extrabold text-white flex items-center gap-1 shadow-xs"
                  style={{ backgroundColor: formData.color }}
                >
                  <span>{formData.iniciales || '??'}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md shadow-blue-500/20"
                >
                  <Check className="w-4 h-4" />
                  {loading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
