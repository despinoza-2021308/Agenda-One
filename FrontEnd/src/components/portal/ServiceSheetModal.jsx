import React from 'react';
import { 
  X, 
  Printer, 
  Building2, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  ShieldCheck, 
  FileText, 
  User, 
  BadgeCheck 
} from 'lucide-react';

export default function ServiceSheetModal({
  isOpen,
  onClose,
  cita,
  capacitador = null
}) {
  if (!isOpen || !cita) return null;

  const handlePrint = () => {
    window.print();
  };

  const capNombre = capacitador?.nombre_completo || cita.capacitador_nombre || 'Capacitador Asignado';
  const capInits = capacitador?.iniciales || cita.capacitador_iniciales || 'CP';
  const capColor = capacitador?.color || cita.capacitador_color || '#2563eb';

  // Formato formal de fecha y hora
  const fechaFirmado = cita.firmado_at 
    ? new Date(cita.firmado_at).toLocaleString('es-GT', { dateStyle: 'long', timeStyle: 'short' })
    : `${cita.fecha} ${cita.hora_fin || ''}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        
        {/* Cabecera modal (oculta al imprimir) */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/80 print:hidden shrink-0">
          <div className="flex items-center gap-2">
            <BadgeCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-black text-slate-900 dark:text-white">
              Hoja de Servicio Digital • Control AD-RE-11
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Guardar PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contenido imprimible de la Hoja de Servicio */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 print:p-0 print:overflow-visible print:text-black">
          <div className="border-2 border-slate-200 dark:border-slate-700 rounded-3xl p-6 sm:p-8 bg-white dark:bg-slate-900 shadow-xs relative">
            
            {/* Folio y Estado de Certificación */}
            <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900">
                    AD-RE-11 • Folio #{String(cita.id).padStart(5, '0')}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Conformidad Certificada</span>
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-2 tracking-tight">
                  Constancia de Horas Impartidas
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Agenda Digital Centralizada y Control Operativo de Capacitadores
                </p>
              </div>

              {/* Sello de iniciales del capacitador */}
              <div 
                className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center text-white font-black text-lg shadow-md shrink-0"
                style={{ backgroundColor: capColor }}
              >
                <span>{capInits}</span>
                <span className="text-[9px] font-bold tracking-tighter opacity-80 uppercase">Trainer</span>
              </div>
            </div>

            {/* Grid de Datos del Servicio */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Empresa / Cliente</p>
                <p className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{cita.cliente_nombre}</span>
                </p>
                {cita.cliente_contacto && (
                  <p className="text-slate-600 dark:text-slate-300">
                    Contacto: <strong>{cita.cliente_contacto}</strong>
                  </p>
                )}
                {cita.cliente_telefono && (
                  <p className="text-slate-600 dark:text-slate-300">
                    Tel: {cita.cliente_telefono}
                  </p>
                )}
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Capacitador y Servicio</p>
                <p className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <User className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>{capNombre}</span>
                </p>
                <p className="text-slate-600 dark:text-slate-300">
                  Tipo: <strong>{cita.tipo_servicio}</strong> • Modalidad: <strong>{cita.modalidad}</strong>
                </p>
                <p className="text-slate-600 dark:text-slate-300">
                  Fecha: <strong>{cita.fecha}</strong>
                </p>
              </div>
            </div>

            {/* Fila de Tiempos y Horas Impartidas */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-100 dark:border-blue-900 flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold">Horario Registrado</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white">
                    {cita.hora_inicio} a {cita.hora_fin} hrs
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold">Total Horas Efectivas (H)</p>
                <p className="text-xl sm:text-2xl font-black text-blue-700 dark:text-blue-400">
                  {cita.horas} hrs
                </p>
              </div>
            </div>

            {/* Bitácora de Temas Impartidos */}
            <div className="mb-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>Bitácora de Sesión / Temas Abordados</span>
              </div>
              <p className="text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                {cita.bitacora || cita.observaciones || 'Sesión de capacitación impartida según cronograma operativo acordado.'}
              </p>
            </div>

            {/* Sección de Firma Digital de Conformidad */}
            <div className="pt-4 border-t-2 border-dashed border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Recepción y Conformidad de la Empresa Capacitada
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                {/* Imagen del Trazo de la Firma */}
                <div className="bg-white border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-2.5 flex flex-col items-center justify-center min-h-28 shadow-inner">
                  {cita.firma_cliente ? (
                    <img
                      src={cita.firma_cliente}
                      alt="Firma Digital del Cliente"
                      className="max-h-24 max-w-full object-contain"
                    />
                  ) : (
                    <span className="text-xs text-slate-400 italic">Firma no disponible</span>
                  )}
                  <span className="text-[10px] text-slate-400 border-t border-slate-200 w-full text-center mt-1 pt-0.5 font-mono">
                    Firma Electrónica Simple
                  </span>
                </div>

                {/* Metadatos del Firmante */}
                <div className="text-xs space-y-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                    Firmado por
                  </p>
                  <p className="font-black text-sm text-slate-900 dark:text-white">
                    {cita.firmante_nombre || cita.cliente_contacto || 'Representante Autorizado'}
                  </p>
                  {cita.firmante_puesto && (
                    <p className="text-slate-600 dark:text-slate-300 font-semibold">
                      Cargo: {cita.firmante_puesto}
                    </p>
                  )}
                  <p className="text-[11px] text-slate-400 font-mono pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                    Fecha y Hora: {fechaFirmado}
                  </p>
                </div>
              </div>
            </div>

            {/* Pie institucional */}
            <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
              <span>Agenda-One • Sistema Digital de Control Horario AD-RE-11</span>
              <span>Constancia para efectos de auditoría y cobro de honorarios</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
