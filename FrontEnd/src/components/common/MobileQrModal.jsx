import React, { useState, useMemo } from 'react';
import { 
  X, 
  QrCode, 
  Smartphone, 
  Copy, 
  Check, 
  MessageCircle, 
  ExternalLink, 
  Sparkles, 
  Wifi, 
  Globe 
} from 'lucide-react';

export default function MobileQrModal({ 
  isOpen, 
  onClose, 
  capacitadores = [], 
  onShowToast 
}) {
  const [selectedTrainer, setSelectedTrainer] = useState('');
  const [copied, setCopied] = useState(false);

  // Determinar la URL base
  const hostInfo = useMemo(() => {
    if (typeof window === 'undefined') return { isLocal: true, baseUrl: 'http://localhost:3000' };
    const origin = window.location.origin;
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    // Si es local, sugerir la IP de la red Wi-Fi
    const localIpUrl = isLocal ? 'http://192.168.0.12:3000' : origin;
    return {
      isLocal,
      origin,
      localIpUrl
    };
  }, []);

  const [useWifiIp, setUseWifiIp] = useState(hostInfo.isLocal);

  // URL final calculada para el código QR
  const targetUrl = useMemo(() => {
    const base = (hostInfo.isLocal && useWifiIp) ? hostInfo.localIpUrl : hostInfo.origin;
    if (selectedTrainer) {
      return `${base}/?portal=${selectedTrainer}`;
    }
    return `${base}/?portal`;
  }, [hostInfo, useWifiIp, selectedTrainer]);

  // URL de la imagen QR (vía API QRServer segura y sin dependencias)
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&color=0f172a&bgcolor=ffffff&data=${encodeURIComponent(targetUrl)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(targetUrl);
      setCopied(true);
      if (onShowToast) onShowToast('¡Enlace copiado al portapapeles!');
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  const handleShareWhatsApp = () => {
    const msg = `📲 *Acceso a tu Portal Móvil en Agenda One:*\n\nAbre tu itinerario y registra tus capacitaciones aquí:\n${targetUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Modal */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Smartphone className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                Abrir Portal en tu Teléfono
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Escanea el código QR con la cámara de tu celular
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contenido Principal */}
        <div className="p-5 space-y-4 overflow-y-auto max-h-[80vh]">
          
          {/* Selector de Capacitador Opcional */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Personalizar para un Capacitador (Opcional):
            </label>
            <select
              value={selectedTrainer}
              onChange={(e) => setSelectedTrainer(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Portal General (Ingreso por código manual)</option>
              {capacitadores.map(c => (
                <option key={c.id} value={c.iniciales}>
                  [{c.iniciales}] {c.nombre_completo}
                </option>
              ))}
            </select>
          </div>

          {/* Si estamos en desarrollo local, opción de red Wi-Fi */}
          {hostInfo.isLocal && (
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold">
                  <Wifi className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Red Wi-Fi Local (192.168.0.12)</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={useWifiIp}
                    onChange={(e) => setUseWifiIp(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4.5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>
              <p className="text-[10px] text-amber-800/80 dark:text-amber-300/80 mt-1">
                Asegúrate de que tu celular esté conectado a la misma red Wi-Fi para abrir la versión local en tu teléfono.
              </p>
            </div>
          )}

          {/* Código QR Centrado */}
          <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="bg-white p-3 rounded-2xl shadow-md border border-slate-100">
              <img
                src={qrImageUrl}
                alt="Código QR para celular"
                width={200}
                height={200}
                className="w-48 h-48 sm:w-52 sm:h-52 object-contain rounded-xl"
              />
            </div>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-2.5 text-center flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              <span>Abre la cámara de tu iPhone o Android y apunta aquí</span>
            </p>
          </div>

          {/* Enlace de Texto Directo */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              O accede con este enlace:
            </label>
            <div className="flex items-center gap-1.5 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
              <input
                type="text"
                readOnly
                value={targetUrl}
                className="w-full text-[11px] font-mono text-slate-700 dark:text-slate-200 bg-transparent px-2 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
          </div>

          {/* Botón WhatsApp */}
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Enviar enlace a mi propio WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
}
