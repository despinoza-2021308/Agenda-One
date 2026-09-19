import React from 'react';
import { Database, CheckCircle2, AlertTriangle, ShieldCheck, Server, RefreshCw, X, HardDrive, Lock } from 'lucide-react';

export default function DbStatusModal({ isOpen, onClose, dbStatus, onRefresh }) {
  if (!isOpen) return null;

  const isConnected = !!dbStatus?.database?.connected;
  const diagnostics = dbStatus?.database?.diagnostics || {};
  const errorMsg = dbStatus?.database?.error;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg glass-panel bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
              isConnected 
                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800' 
                : 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-800'
            }`}>
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Estado de la Base de Datos
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Seguridad y persistencia de datos en la nube
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

        {/* Contenido principal */}
        <div className="p-6 space-y-5 text-xs sm:text-sm">
          {/* Banner de Estado */}
          <div className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
            isConnected
              ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-200'
              : 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-950 dark:text-amber-200'
          }`}>
            {isConnected ? (
              <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            )}
            <div>
              <h4 className="font-black text-sm sm:text-base">
                {isConnected ? 'Almacenamiento Cloud Activo y Seguro' : 'Modo Memoria Temporal (mockStore)'}
              </h4>
              <p className="mt-1 leading-relaxed text-xs">
                {isConnected
                  ? 'Todos los datos (citas, capacitadores, clientes, bitácoras y firmas) se guardan directamente en tu base de datos PostgreSQL de Supabase. Nada se borrará ni se perderá al reiniciar o refrescar la aplicación.'
                  : 'La conexión a la nube no está activa en este momento. La aplicación funciona en memoria temporal local. Los datos nuevos podrían perderse al reciclar la instancia de Vercel.'}
              </p>
            </div>
          </div>

          {/* Ficha técnica */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200/60 dark:border-white/5 space-y-2.5 font-mono text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-200/40 dark:border-white/5">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5" /> Proveedor:
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {diagnostics.provider || 'PostgreSQL / Supabase'}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-200/40 dark:border-white/5">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5" /> Servidor / Host:
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[220px]">
                {diagnostics.host || 'aws-0-ca-central-1.pooler.supabase.com'}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-200/40 dark:border-white/5">
              <span className="text-slate-500 dark:text-slate-400">Puerto Activo:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {diagnostics.port || '6543 (Transaction Mode Pooler)'}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-200/40 dark:border-white/5">
              <span className="text-slate-500 dark:text-slate-400">Persistencia:</span>
              <span className="font-black text-emerald-600 dark:text-emerald-400">
                {isConnected ? '100% Permanente (Cloud)' : 'Temporal (RAM)'}
              </span>
            </div>

            {errorMsg && (
              <div className="pt-2 text-rose-600 dark:text-rose-400 text-[11px] leading-relaxed break-all">
                <strong>Detalle técnico:</strong> {errorMsg}
              </div>
            )}
          </div>

          {/* Tips de seguridad */}
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-500 shrink-0" />
            <span>Tus credenciales y contraseñas viajan cifradas con SSL/TLS de grado bancario.</span>
          </div>
        </div>

        {/* Pie de modal */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-3">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Verificar Conexión</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="ml-auto px-4 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs font-bold rounded-xl hover:opacity-90 transition-opacity cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
