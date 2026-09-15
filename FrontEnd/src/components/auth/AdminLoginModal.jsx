import React, { useState } from 'react';
import { Shield, KeyRound, Eye, EyeOff, X, Loader2, AlertCircle } from 'lucide-react';
import { api, authStorage } from '../../services/api';

export default function AdminLoginModal({ isOpen, onClose, onSuccess, onShowToast }) {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pin.trim()) {
      setError('Por favor ingresa el PIN de administrador.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.loginAdmin(pin.trim());
      if (response && response.token) {
        authStorage.setToken(response.token);
        if (onShowToast) {
          onShowToast('Modo Administrador activado temporalmente 🛡️', 'success');
        }
        setPin('');
        onClose();
        if (onSuccess) onSuccess();
      } else {
        throw new Error('No se recibió token de autorización.');
      }
    } catch (err) {
      setError(err.message || 'PIN de administrador incorrecto.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/65 dark:bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        className="glass-panel rounded-3xl shadow-2xl border border-white/80 dark:border-white/15 w-full max-w-md p-6 space-y-5 animate-in zoom-in-95 duration-200 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón cerrar */}
        <button
          type="button"
          disabled={loading}
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Encabezado */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/30 border border-white/25">
            <Shield className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div className="min-w-0 pr-6">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white leading-snug">
              Acceso Administrativo
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Ingresa el PIN de seguridad para habilitar las acciones de agendar, editar y eliminar. Por seguridad, <strong>la sesión expira automáticamente al salir de la agenda</strong>.
            </p>
          </div>
        </div>

        {/* Mensaje de error si falla la autenticación */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-50/80 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {/* Formulario de PIN */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              PIN de Administrador
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPin ? 'text' : 'password'}
                autoFocus
                required
                placeholder="Ingresa el PIN..."
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  if (error) setError(null);
                }}
                className="w-full pl-10 pr-11 py-2.5 glass-input rounded-xl text-sm font-bold text-slate-900 dark:text-white tracking-wider placeholder:tracking-normal placeholder:font-normal placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none shadow-glass-sm transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
                title={showPin ? 'Ocultar PIN' : 'Mostrar PIN'}
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200/60 dark:border-white/10">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="px-4 py-2 rounded-xl glass-pill text-slate-600 dark:text-slate-400 text-xs font-bold hover:bg-white dark:hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !pin.trim()}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl liquid-btn-primary text-xs font-bold shadow-md transition-all disabled:opacity-50 cursor-pointer active:scale-95"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verificando...</span>
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  <span>Iniciar Sesión</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
