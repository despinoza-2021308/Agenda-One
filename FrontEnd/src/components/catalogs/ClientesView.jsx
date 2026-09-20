import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Building2, Plus, Search, Phone, Mail, User, MapPin, Edit2, Trash2, Check, X, AlertCircle, ArrowLeft } from 'lucide-react';
import ConfirmModal from '../common/ConfirmModal';

export default function ClientesView({ clientes = [], citas = [], onSaveCliente, onDeleteCliente, onBackToCalendar, isLoading = false, isSyncing = false }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [formData, setFormData] = useState({
    nombre_empresa: '',
    contacto: '',
    telefono: '',
    correo: '',
    direccion: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const term = searchTerm.toLowerCase();
  const filteredClientes = clientes.filter(c =>
    c.nombre_empresa.toLowerCase().includes(term) ||
    (c.contacto && c.contacto.toLowerCase().includes(term)) ||
    (c.direccion && c.direccion.toLowerCase().includes(term)) ||
    (c.telefono && c.telefono.toLowerCase().includes(term))
  );

  const openNewModal = () => {
    setEditingCliente(null);
    setFormData({ nombre_empresa: '', contacto: '', telefono: '', correo: '', direccion: '' });
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (cliente) => {
    setEditingCliente(cliente);
    setFormData({
      nombre_empresa: cliente.nombre_empresa,
      contacto: cliente.contacto || '',
      telefono: cliente.telefono || '',
      correo: cliente.correo || '',
      direccion: cliente.direccion || ''
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const cleanNombre = formData.nombre_empresa.trim();
    if (!cleanNombre) {
      setError('El nombre de la empresa es requerido.');
      return;
    }

    if (cleanNombre.length < 2 || cleanNombre.length > 200) {
      setError('El nombre de la empresa debe tener entre 2 y 200 caracteres.');
      return;
    }

    // Comprobar duplicados
    const isDuplicate = clientes.some(
      c => c.nombre_empresa.toLowerCase() === cleanNombre.toLowerCase() &&
           (!editingCliente || Number(c.id) !== Number(editingCliente.id))
    );
    if (isDuplicate) {
      setError('Ya existe otra empresa registrada con este mismo nombre.');
      return;
    }

    // Validar correo si fue ingresado (soporta correos múltiples separados por coma o punto y coma)
    if (formData.correo && formData.correo.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const emails = formData.correo.split(/[,;]/).map(e => e.trim()).filter(Boolean);
      if (!emails.every(e => emailRegex.test(e))) {
        setError('Uno o más correos electrónicos no tienen un formato válido (ej: contacto@empresa.com).');
        return;
      }
    }

    // Validar teléfono si fue ingresado
    if (formData.telefono && formData.telefono.trim()) {
      const digits = formData.telefono.replace(/\D/g, '');
      if (digits.length < 7) {
        setError('El número de teléfono debe tener al menos 7 dígitos numéricos.');
        return;
      }
    }

    setLoading(true);
    try {
      await onSaveCliente({
        ...formData,
        nombre_empresa: cleanNombre,
        contacto: formData.contacto.trim(),
        telefono: formData.telefono.trim(),
        correo: formData.correo.trim(),
        direccion: (formData.direccion || '').trim()
      }, editingCliente?.id);
      setIsModalOpen(false);
    } catch (err) {
      setError(err.message || 'Error al guardar el cliente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    const cliente = clientes.find(c => c.id === id);
    if (!cliente) return;
    const citasCount = (citas || []).filter(ci => Number(ci.cliente_id) === Number(id)).length;
    setDeleteTarget({ ...cliente, citasCount });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget?.id) return;
    setDeleteLoading(true);
    try {
      await onDeleteCliente(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      alert(err.message || 'Error al eliminar cliente');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Barra superior de catálogo y buscador */}
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
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Catálogo de Clientes y Empresas ({clientes.length})
              </h2>
              {isSyncing && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 animate-pulse border border-blue-200 dark:border-blue-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></span>
                  Sincronizando nube
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Empresas a las que se les imparten cursos, auditorías y asesorías
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3.5 py-2 glass-input rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none shadow-glass-sm"
            >
            </input>
          </div>

          <button
            onClick={openNewModal}
            className="inline-flex items-center gap-1.5 liquid-btn-primary px-4 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nuevo Cliente</span>
          </button>
        </div>
      </div>

      {/* Grid de Clientes o Skeletons */}
      {isLoading && clientes.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div
              key={`skeleton-${i}`}
              className="glass-card rounded-3xl p-5 border border-white/60 dark:border-white/10 shadow-glass-sm animate-pulse flex flex-col justify-between h-52 bg-white/40 dark:bg-slate-800/40"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700/60"></div>
                  <div className="w-12 h-5 rounded-lg bg-slate-200 dark:bg-slate-700/60"></div>
                </div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700/60 rounded w-3/4 mb-3"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-slate-200 dark:bg-slate-700/60 rounded w-1/2"></div>
                  <div className="h-3 bg-slate-200 dark:bg-slate-700/60 rounded w-2/3"></div>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                <div className="h-3 bg-slate-200 dark:bg-slate-700/60 rounded w-16"></div>
                <div className="h-3 bg-slate-200 dark:bg-slate-700/60 rounded w-12"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredClientes.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center border border-white/80 dark:border-white/10 shadow-glass-sm">
          <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
            {searchTerm ? 'No se encontraron clientes coincidentes' : 'No hay clientes registrados'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
            {searchTerm
              ? `No hay empresas que coincidan con "${searchTerm}". Intenta con otro término.`
              : 'Agrega tu primera empresa o cliente usando el botón "Nuevo Cliente".'}
          </p>
          {!searchTerm && (
            <button
              onClick={openNewModal}
              className="inline-flex items-center gap-1.5 liquid-btn-primary px-4 py-2 rounded-xl text-xs font-bold shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Nuevo Cliente</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {filteredClientes.map((cliente) => {
            const clientCitas = citas.filter(c =>
              Number(c.cliente_id) === Number(cliente.id) ||
              (c.cliente_nombre && c.cliente_nombre.trim().toLowerCase() === cliente.nombre_empresa.trim().toLowerCase())
            );
            const totalHoras = clientCitas.reduce((sum, c) => sum + (parseFloat(c.horas) || 0), 0);

            return (
              <div
                key={cliente.id}
                className="glass-card glass-card-hover rounded-3xl p-5 border border-white/80 dark:border-white/10 shadow-glass-sm hover:shadow-glass-hover transition-all duration-200 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditModal(cliente)}
                        title="Editar"
                        className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(cliente.id)}
                        title="Eliminar"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-2 line-clamp-2">
                    {cliente.nombre_empresa}
                  </h3>

                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    {cliente.contacto && (
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{cliente.contacto}</span>
                      </div>
                    )}
                    {cliente.telefono && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{cliente.telefono}</span>
                      </div>
                    )}
                    {cliente.correo && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{cliente.correo}</span>
                      </div>
                    )}
                    {cliente.direccion && (
                      <div className="flex items-start gap-2 pt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2 text-[11px] text-slate-500 dark:text-slate-400 leading-snug">{cliente.direccion}</span>
                      </div>
                    )}
                  </div>

                  {/* Métricas de horas de capacitación */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Actividad:</span>
                    <span className={`font-bold px-2 py-0.5 rounded-full ${clientCitas.length > 0 ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                      {clientCitas.length} {clientCitas.length === 1 ? 'cita' : 'citas'} ({totalHoras}h)
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
                  <span>ID #{cliente.id}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    ● Activo
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal para Crear / Editar Cliente montado en Portal (z-[9999]) */}
      {isModalOpen && createPortal(
        <div 
          className="fixed inset-0 z-[9999] w-full h-full min-h-[100dvh] bg-slate-950/70 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden animate-in fade-in duration-200"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="glass-panel w-full max-w-lg max-h-[92dvh] rounded-3xl shadow-2xl border border-white/80 dark:border-white/15 overflow-hidden flex flex-col my-auto relative animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Fijo */}
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
                    {editingCliente ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Catálogo Oficial de Empresas AD-RE-11
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 shrink-0">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Formulario Scrolleable */}
            <form id="cliente-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              <div>
                <label 
                  htmlFor="cli-nombre-empresa"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1"
                >
                  Nombre de la Empresa <span className="text-rose-500">*</span>
                </label>
                <input
                  id="cli-nombre-empresa"
                  type="text"
                  required
                  autoFocus
                  placeholder="Ej: Logística Central S.A."
                  value={formData.nombre_empresa}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombre_empresa: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              <div>
                <label 
                  htmlFor="cli-contacto"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1"
                >
                  Persona de Contacto
                </label>
                <input
                  id="cli-contacto"
                  type="text"
                  placeholder="Ej: Lic. Carlos Alvarado"
                  value={formData.contacto}
                  onChange={(e) => setFormData(prev => ({ ...prev, contacto: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label 
                    htmlFor="cli-telefono"
                    className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1"
                  >
                    Teléfono
                  </label>
                  <input
                    id="cli-telefono"
                    type="text"
                    placeholder="Ej: 2200-0000"
                    value={formData.telefono}
                    onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label 
                    htmlFor="cli-correo"
                    className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1"
                  >
                    Correo Electrónico
                  </label>
                  <input
                    id="cli-correo"
                    type="text"
                    placeholder="contacto@empresa.com"
                    value={formData.correo}
                    onChange={(e) => setFormData(prev => ({ ...prev, correo: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label 
                  htmlFor="cli-direccion"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1"
                >
                  Dirección Física / Ubicación
                </label>
                <input
                  id="cli-direccion"
                  type="text"
                  placeholder="Ej: Km. 14.5 Carretera Roosevelt..."
                  value={formData.direccion}
                  onChange={(e) => setFormData(prev => ({ ...prev, direccion: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </form>

            {/* Footer Fijo */}
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
                form="cliente-form"
                disabled={loading}
                className="inline-flex items-center gap-2 liquid-btn-primary px-5 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-md cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>{loading ? 'Guardando...' : (editingCliente ? 'Guardar Cambios' : 'Guardar Cliente')}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal de confirmación elegante para eliminar / desactivar cliente */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => !deleteLoading && setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
        title={deleteTarget?.citasCount > 0 ? `¿Desactivar ${deleteTarget.nombre_empresa}?` : `¿Eliminar ${deleteTarget?.nombre_empresa}?`}
        message={`¿Estás seguro de que deseas proceder con la empresa "${deleteTarget?.nombre_empresa}"?`}
        detail={
          deleteTarget?.citasCount > 0 ? (
            <div>
              <p className="font-bold text-amber-800">⚠️ Esta empresa cuenta con {deleteTarget.citasCount} {deleteTarget.citasCount === 1 ? 'cita registrada' : 'citas registradas'}.</p>
              <p className="text-slate-600 mt-1">Para conservar la integridad de tus reportes de horas e historial de capacitación, la empresa pasará a estado <strong>Inactivo</strong> y no se borrará ninguna cita histórica.</p>
            </div>
          ) : (
            <div>
              <p className="font-semibold text-slate-700">Esta empresa no tiene citas asociadas en el sistema.</p>
              <p className="text-slate-500 mt-0.5">Se eliminará completamente del catálogo de clientes.</p>
            </div>
          )
        }
        confirmText={deleteTarget?.citasCount > 0 ? 'Sí, Desactivar Empresa' : 'Sí, Eliminar Empresa'}
        cancelText="Cancelar"
        variant={deleteTarget?.citasCount > 0 ? 'warning' : 'danger'}
      />
    </div>
  );
}
