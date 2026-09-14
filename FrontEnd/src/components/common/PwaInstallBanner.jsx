import React, { useState, useEffect } from 'react';
import { Download, WifiOff, X, Smartphone, Check, Sparkles } from 'lucide-react';

export default function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem('agenda_pwa_banner_dismissed') === 'true';
  });
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isInstalledSuccess, setIsInstalledSuccess] = useState(false);

  useEffect(() => {
    // Detectar si ya está ejecutándose en modo app instalada (standalone)
    const checkStandalone = () => {
      const isStandaloneMode = 
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandalone(isStandaloneMode);
    };
    checkStandalone();

    // Evento de instalación PWA (Android / Chrome / Edge)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    // Evento tras instalación completada
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
      setIsInstalledSuccess(true);
      setTimeout(() => setIsInstalledSuccess(false), 4000);
    };

    // Eventos de conexión de red
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('agenda_pwa_banner_dismissed', 'true');
  };

  return (
    <div className="w-full space-y-2 mb-3">
      {/* 1. Alerta de Estado Offline si no hay señal de red */}
      {isOffline && (
        <div className="w-full p-3 rounded-2xl bg-amber-500/15 dark:bg-amber-950/60 border border-amber-400 dark:border-amber-700/80 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between gap-2.5 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="font-semibold">
              <strong>Modo Sin Conexión:</strong> Estás viendo tu itinerario guardado en la memoria de este celular.
            </span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-200 shrink-0">
            Caché Local
          </span>
        </div>
      )}

      {/* 2. Éxito de Instalación */}
      {isInstalledSuccess && (
        <div className="w-full p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in duration-200">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-bold">¡Agenda-One instalada exitosamente en tu pantalla de inicio! 🎉</span>
        </div>
      )}

      {/* 3. Banner para Instalar PWA si el navegador lo soporta y no está instalada */}
      {deferredPrompt && !isStandalone && !isDismissed && (
        <div className="w-full p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 flex items-center justify-between gap-3 animate-in slide-in-from-top-3 duration-200">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black tracking-tight leading-tight flex items-center gap-1.5">
                <span>Instalar Agenda-One en tu Celular</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              </p>
              <p className="text-[11px] text-blue-100 truncate mt-0.5">
                Acceso directo desde pantalla de inicio y consulta offline.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleInstallClick}
              className="px-3.5 py-1.5 rounded-xl bg-white text-blue-700 hover:bg-blue-50 text-xs font-black shadow-sm transition-all transform active:scale-95 cursor-pointer flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Instalar</span>
            </button>
            <button
              onClick={handleDismiss}
              title="Cerrar aviso"
              className="p-1.5 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
