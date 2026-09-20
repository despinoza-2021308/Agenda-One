import React, { useState, useEffect } from 'react';
import { 
  Trash2, 
  RotateCcw, 
  Search, 
  Calendar, 
  Clock, 
  Building2, 
  User, 
  X, 
  RefreshCw, 
  AlertCircle,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import { api } from '../../services/api';

export default function DeletedAppointmentsModal({ isOpen, onClose, onRestored, showToast }) {
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [restoringId, setRestoringId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  const fetchDeleted = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getCitasEliminadas();
      setCitas(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al obtener citas de la papelera:', err);
      setError(err.message || 'Error al consultar citas eliminadas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDeleted();
    }
  }, [isOpen]);

  const handleRestore = async (id, clienteNombre) => {
    try {
      setRestoringId(id);
      const res = await api.restoreCita(id);
      
      // Remover de la lista local
      setCitas(prev => prev.filter(c => c.id !== id));
      
      if (showToast) {
        showToast(res.message || `Cita de "${clienteNombre}" restaurada exitosamente`, 'success');
      }
      if (onRestored) {
        onRestored(id);
      }
    } catch (err) {
      console.error('Error al restaurar cita:', err);
      if (showToast) {
        showToast(err.message || 'No se pudo restaurar la cita', 'error');
      }
    } finally {
      setRestoringId(null);
    }
  };

  if (!isOpen) return null;

  const filteredCitas = citas.filter(c => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (c.cliente_nombre || '').toLowerCase().includes(term) ||
      (c.capacitador_nombre || '').toLowerCase().includes(term) ||
      (c.tipo_servicio || '').toLowerCase().includes(term) ||
      (c.fecha || '').includes(term)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-3xl glass-panel bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-800 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Papelera de Citas Eliminadas
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                  {citas.length} {citas.length === 1 ? 'cita' : 'citas'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Protección contra borrado accidental. Puedes restaurar cualquier cita con un solo clic.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de búsqueda y acciones */}
        <div className="p-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por cliente, capacitador o fecha (YYYY-MM-DD)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all"
            />
          </div>
          <button
            onClick={fetchDeleted}
            disabled={loading}
            className="p-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Actualizar lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Contenido de la lista */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2.5">
          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading && citas.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
              <span>Cargando papelera de citas...</span>
            </div>
          ) : filteredCitas.length === 0 ? (
            <div className="py-14 text-center text-slate-400 dark:text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <p className="font-bold text-sm text-slate-700 dark:text-slate-300 mt-1">
                La papelera está vacía
              </p>
              <p className="text-[11px] max-w-sm">
                No hay citas borradas recientemente. Si la coordinadora elimina una cita por error en el calendario, aparecerá aquí inmediatamente.
              </p>
            </div>
          ) : (
            filteredCitas.map(cita => {
              const isRestoring = restoringId === cita.id;
              return (
                <div
                  key={cita.id}
                  className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/5 bg-white dark:bg-slate-800/40 hover:border-amber-300 dark:hover:border-amber-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {cita.cliente_nombre || 'Cliente General'}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300">
                        {cita.tipo_servicio || 'Capacitación'}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                        {cita.modalidad || 'Presencial'} ({cita.horas || 1}h)
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-amber-500" />
                        <strong>{cita.fecha}</strong> ({cita.hora_inicio} - {cita.hora_fin})
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-indigo-500" />
                        <span 
                          className="w-2 h-2 rounded-full inline-block mr-0.5" 
                          style={{ backgroundColor: cita.capacitador_color || '#7C3AED' }} 
                        />
                        {cita.capacitador_nombre} ({cita.capacitador_iniciales})
                      </span>
                    </div>

                    {cita.deleted_at && (
                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Eliminada el: {cita.deleted_at}</span>
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <button
                      onClick={() => handleRestore(cita.id, cita.cliente_nombre)}
                      disabled={isRestoring}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                      title="Restaurar cita al calendario activo"
                    >
                      {isRestoring ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Restaurando...
                        </>
                      ) : (
                        <>
                          <RotateCcw className="w-3.5 h-3.5" />
                          Restaurar Cita
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pie de modal */}
        <div className="p-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 text-xs">
          <span className="text-slate-500 dark:text-slate-400 text-[11px]">
            Las citas restauradas reaparecerán de inmediato en la vista del calendario.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
