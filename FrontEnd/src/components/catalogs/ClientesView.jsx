import React, { useState } from 'react';
import { Building2, Plus, Search, Phone, Mail, User, Edit2, Trash2, Check, X, AlertCircle, ArrowLeft } from 'lucide-react';
import ConfirmModal from '../common/ConfirmModal';

export default function ClientesView({ clientes = [], citas = [], onSaveCliente, onDeleteCliente, onBackToCalendar }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [formData, setFormData] = useState({
    nombre_empresa: '',
    contacto: '',
    telefono: '',
    correo: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const filteredClientes = clientes.filter(c =>
    c.nombre_empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.contacto && c.contacto.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const openNewModal = () => {
    setEditingCliente(null);
    setFormData({ nombre_empresa: '', contacto: '', telefono: '', correo: '' });
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (cliente) => {
    setEditingCliente(cliente);
    setFormData({
      nombre_empresa: cliente.nombre_empresa,
      contacto: cliente.contacto || '',
      telefono: cliente.telefono || '',
      correo: cliente.correo || ''
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

    if (cleanNombre.length < 2 || cleanNombre.length > 120) {
      setError('El nombre de la empresa debe tener entre 2 y 120 caracteres.');
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

    // Validar correo si fue ingresado
    if (formData.correo && formData.correo.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.correo.trim())) {
        setError('El correo electrónico no tiene un formato válido (ej: contacto@empresa.com).');
        return;
      }
    }

    // Validar teléfono si fue ingresado
    if (formData.telefono && formData.telefono.trim()) {
      const digits = formData.telefono.replace(/\D/g, '');
      if (digits.length < 8) {
        setError('El número de teléfono debe tener al menos 8 dígitos numéricos.');
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
        correo: formData.correo.trim()
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
      {/* Barra superior de catálogo */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3">
          {onBackToCalendar && (
            <button
              type="button"
              onClick={onBackToCalendar}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors shrink-0 group flex items-center gap-1.5"
              title="Volver al calendario"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-bold hidden sm:inline">Volver</span>
            </button>
          )}
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Catálogo de Clientes y Empresas ({clientes.length})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
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
              className="pl-9 pr-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={openNewModal}
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Cliente</span>
          </button>
        </div>
      </div>

      {/* Grid de Clientes */}
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
              className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
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
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{cliente.correo}</span>
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

      {/* Modal para Crear / Editar Cliente */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div 
            className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                  title="Volver"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {editingCliente ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Nombre de la Empresa <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Logística Central S.A."
                  value={formData.nombre_empresa}
                  onChange={(e) => setFormData({ ...formData, nombre_empresa: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Persona de Contacto
                </label>
                <input
                  type="text"
                  placeholder="Ej: Lic. Carlos Alvarado"
                  value={formData.contacto}
                  onChange={(e) => setFormData({ ...formData, contacto: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    placeholder="+506 2200-0000"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    placeholder="contacto@empresa.com"
                    value={formData.correo}
                    onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
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
