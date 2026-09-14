import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, 
  PenTool, 
  RotateCcw, 
  Check, 
  Building2, 
  Clock, 
  User, 
  Calendar, 
  FileText, 
  ShieldCheck, 
  AlertCircle 
} from 'lucide-react';

export default function DigitalSignatureModal({
  isOpen,
  onClose,
  cita,
  capacitador,
  onConfirmSignature,
  initialSignerName = '',
  initialSignerTitle = ''
}) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [signerName, setSignerName] = useState('');
  const [signerTitle, setSignerTitle] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Inicializar nombres por defecto con base en contacto de la empresa
  useEffect(() => {
    if (isOpen && cita) {
      setSignerName(initialSignerName || cita.firmante_nombre || cita.cliente_contacto || '');
      setSignerTitle(initialSignerTitle || cita.firmante_puesto || '');
      setHasDrawn(false);
      setErrorMsg(null);
      setIsSaving(false);

      // Limpiar y preparar canvas
      setTimeout(() => {
        initCanvas();
      }, 100);
    }
  }, [isOpen, cita, initialSignerName, initialSignerTitle]);

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Ajustar resolución en base al pixel ratio de pantallas móviles retina
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Fondo blanco limpio
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);
    setHasDrawn(false);
    setErrorMsg(null);
  };

  // Coordenadas relativas al canvas
  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
    setErrorMsg(null);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e) => {
    if (!isDrawing) return;
    if (e) e.preventDefault();
    setIsDrawing(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!signerName.trim()) {
      setErrorMsg('Por favor ingresa el nombre de la persona que recibe y firma.');
      return;
    }
    if (!hasDrawn) {
      setErrorMsg('Por favor solicita la firma del cliente en el recuadro digital.');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      setIsSaving(true);
      setErrorMsg(null);
      const signatureDataUrl = canvas.toDataURL('image/png');

      await onConfirmSignature({
        firma_cliente: signatureDataUrl,
        firmante_nombre: signerName.trim(),
        firmante_puesto: signerTitle.trim() || 'Representante del Cliente'
      });
      onClose();
    } catch (err) {
      console.error('Error al guardar firma:', err);
      setErrorMsg(err.message || 'Error al registrar la firma digital.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !cita) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-150">
        
        {/* Encabezado */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-white/10 backdrop-blur">
              <PenTool className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg tracking-tight leading-tight">
                Firma Digital de Conformidad
              </h3>
              <p className="text-[11px] text-blue-100 font-medium">
                Hoja de Servicio Digital • Modelo AD-RE-11
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="p-1.5 rounded-xl hover:bg-white/20 text-white/90 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido deslizable */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Resumen inmutable del servicio impartido */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
            <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <strong className="text-slate-900 dark:text-white">{cita.cliente_nombre}</strong>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-bold text-[10px]">
                {cita.tipo_servicio} • {cita.modalidad}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{cita.fecha}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{cita.hora_inicio} - {cita.hora_fin} (<strong>{cita.horas} hrs</strong>)</span>
              </div>
            </div>

            {cita.bitacora && (
              <div className="pt-1 text-[11px] text-slate-600 dark:text-slate-400 border-t border-slate-200/60 dark:border-slate-700/60">
                <span className="font-bold text-slate-700 dark:text-slate-300">Temas impartidos: </span>
                <span className="line-clamp-2">{cita.bitacora}</span>
              </div>
            )}
          </div>

          {/* Mensaje de Error */}
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Campos del firmante */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Nombre de quien recibe *
              </label>
              <input
                type="text"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="Ej. Ing. Roberto Silva"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-hidden focus:border-blue-600 focus:ring-3 focus:ring-blue-500/10"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Cargo o Puesto
              </label>
              <input
                type="text"
                value={signerTitle}
                onChange={(e) => setSignerTitle(e.target.value)}
                placeholder="Ej. Gerente de Planta / RRHH"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-hidden focus:border-blue-600 focus:ring-3 focus:ring-blue-500/10"
              />
            </div>
          </div>

          {/* Lienzo de Firma Digital */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <PenTool className="w-3.5 h-3.5 text-blue-600" />
                <span>Firma en el recuadro (Táctil o Ratón) *</span>
              </label>
              <button
                type="button"
                onClick={clearCanvas}
                className="text-[11px] font-bold text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Limpiar trazo</span>
              </button>
            </div>

            <div className="relative rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white overflow-hidden shadow-inner touch-none">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                onTouchCancel={stopDrawing}
                className="w-full h-44 cursor-crosshair block"
                style={{ touchAction: 'none' }}
              />

              {!hasDrawn && (
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-400 text-xs font-medium">
                  <PenTool className="w-6 h-6 mb-1 opacity-50 text-slate-400" />
                  <span>Dibuja aquí la firma del cliente</span>
                </div>
              )}

              <div className="absolute bottom-2 left-3 right-3 border-t border-slate-200/80 pointer-events-none flex justify-between text-[10px] text-slate-400 font-mono">
                <span>✕ Firma del receptor</span>
                <span>Lienzo digital seguro</span>
              </div>
            </div>
          </div>

          {/* Declaración de Conformidad Legal */}
          <div className="p-3 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 flex items-start gap-2.5 text-[11px] text-blue-900 dark:text-blue-200">
            <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Declaración de Conformidad:</strong> Al firmar digitalmente, el cliente declara que la capacitación o asesoría fue impartida a total satisfacción durante las <strong>{cita.horas} horas efectivas</strong> acordadas.
            </p>
          </div>
        </div>

        {/* Botones de Pie */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-lg shadow-emerald-600/25 transition-all transform active:scale-95 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
          >
            {isSaving ? (
              <span>Guardando firma...</span>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Confirmar y Guardar Firma</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
