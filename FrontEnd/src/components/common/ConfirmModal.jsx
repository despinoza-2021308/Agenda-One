import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = '¿Confirmar acción?',
  message = '¿Estás seguro de que deseas realizar esta acción?',
  detail = null,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger', // 'danger' | 'warning' | 'info'
  loading = false
}) {
  if (!isOpen) return null;

  const isDanger = variant === 'danger';
  const isWarning = variant === 'warning';

  const iconBg = isDanger 
    ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-transparent dark:border-rose-900/60' 
    : isWarning 
    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-transparent dark:border-amber-900/60' 
    : 'bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-transparent dark:border-blue-900/60';
  const confirmBtnBg = isDanger
    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
    : isWarning
    ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20'
    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20';

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] w-full h-full min-h-[100dvh] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div
        className="glass-panel rounded-3xl shadow-2xl border border-white/80 dark:border-white/15 w-full max-w-md p-6 space-y-5 animate-in zoom-in-95 duration-150 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón cerrar */}
        <button
          type="button"
          disabled={loading}
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-white/10 transition-colors disabled:opacity-50 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cabecera con Icono y Título */}
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-2xl ${iconBg} flex items-center justify-center shrink-0 shadow-2xs`}>
            {isDanger ? <Trash2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
          </div>
          <div className="min-w-0 pr-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
              {title}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* Cuadro de detalle / advertencia adicional (opcional) */}
        {detail && (
          <div className="p-3.5 rounded-2xl glass-card border border-white/60 dark:border-white/10 text-xs text-slate-600 dark:text-slate-300 leading-relaxed space-y-1">
            {detail}
          </div>
        )}

        {/* Acciones */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-white/80 dark:border-white/15 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-white/60 dark:hover:bg-white/10 transition-colors disabled:opacity-50 glass-card shadow-2xs cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50 cursor-pointer active:scale-95 ${confirmBtnBg}`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Procesando...</span>
              </>
            ) : (
              <span>{confirmText}</span>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
