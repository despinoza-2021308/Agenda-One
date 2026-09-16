import React from 'react';
import { Clock, FileText, ShieldCheck } from 'lucide-react';
import { getMonthCode, getMonthKey, getMonthLastUpdateDate } from '../../utils/monthAuditUtils';

export default function DocumentHeader({ 
  currentDate = new Date(), 
  citas = [], 
  monthUpdatesMap = {} 
}) {
  const monthKey = getMonthKey(currentDate);
  const monthCode = getMonthCode(currentDate);
  const lastUpdateDate = getMonthLastUpdateDate(monthKey, citas, monthUpdatesMap);

  return (
    <header className="w-full glass-panel rounded-2xl sm:rounded-3xl p-3 sm:p-4 transition-all duration-200 shadow-glass border border-white/80 dark:border-white/10 select-none print:bg-white print:border print:border-black print:rounded-none print:shadow-none print:p-2 mb-3">
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
        
        {/* ========================================================
            SECCIÓN 1 (IZQUIERDA): IDENTIDAD INSTITUCIONAL ONE
           ======================================================== */}
        <div className="flex items-center justify-between w-full md:w-auto gap-3">
          <div className="flex items-center gap-2.5">
            <div className="bg-white p-1.5 rounded-2xl shadow-xs border border-slate-200/80 dark:border-white/15 shrink-0 flex items-center justify-center transition-transform hover:scale-102">
              <img 
                src="/logo-one.png" 
                alt="ONE Consulting" 
                className="h-9 sm:h-11 w-auto object-contain"
                title="ONE Consulting - ¡Su aliado en generar valor!"
              />
            </div>
            <div>
              <span className="font-extrabold text-xs sm:text-sm tracking-tight text-slate-900 dark:text-white block">
                ONE Consulting
              </span>
              <span className="text-[10px] text-red-600 dark:text-red-400 font-bold italic tracking-wide hidden sm:block">
                ¡Su aliado en generar valor!
              </span>
            </div>
          </div>

          {/* En móviles, mostrar Código y Versión compactos a la derecha de la fila superior */}
          <div className="flex items-center gap-1.5 md:hidden">
            <span className="text-[10px] font-mono font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80 px-2 py-0.5 rounded-lg">
              AD-RE-11
            </span>
            <span className="text-[10px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80 px-1.5 py-0.5 rounded-lg">
              v4
            </span>
          </div>
        </div>

        {/* ========================================================
            SECCIÓN 2 (CENTRAL): TÍTULO DE AGENDA Y AUDITORÍA
           ======================================================== */}
        <div className="flex flex-col items-center justify-center text-center gap-1.5 flex-1 min-w-0">
          <h1 className="font-black text-base sm:text-lg md:text-xl tracking-widest uppercase bg-gradient-to-r from-slate-950 via-blue-900 to-indigo-950 dark:from-white dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent print:text-black font-sans">
            AGENDA
          </h1>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {/* Tag MES con fondo amarillo corporativo refinado */}
            <div 
              className="inline-flex items-center gap-1.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 px-2.5 sm:px-3 py-1 rounded-xl font-bold shadow-xs border border-yellow-500/40 text-xs transition-all"
              style={{
                backgroundColor: '#FACC15',
                color: '#000000',
                WebkitPrintColorAdjust: 'exact',
                printColorAdjust: 'exact'
              }}
              title={`Mes activo de la agenda: ${monthCode}`}
            >
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-900/80">MES</span>
              <span className="font-mono font-black tracking-wide lowercase">{monthCode}</span>
            </div>

            {/* Tag Última Actualización */}
            <div className="inline-flex items-center gap-1.5 bg-slate-100/90 dark:bg-slate-800/90 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 px-2.5 sm:px-3 py-1 rounded-xl text-xs font-semibold border border-slate-200/80 dark:border-white/10 shadow-2xs transition-all print:border print:border-black">
              <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 print:hidden" />
              <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Última Actualización:
              </span>
              <span className="font-mono font-black text-slate-900 dark:text-white print:text-black">
                {lastUpdateDate || '16/09/2026'}
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================
            SECCIÓN 3 (DERECHA): CÓDIGO Y VERSIÓN OFICIAL (ESCRITORIO)
           ======================================================== */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-2 bg-blue-50/80 dark:bg-blue-950/50 border border-blue-200/80 dark:border-blue-800/80 px-3 py-1.5 rounded-2xl text-xs shadow-2xs">
            <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <div className="flex flex-col text-left">
              <span className="text-[9px] font-bold text-blue-600/80 dark:text-blue-400/80 uppercase tracking-wider">Código</span>
              <span className="font-black font-mono text-blue-950 dark:text-blue-200 text-xs sm:text-sm tracking-wide">AD-RE-11</span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-indigo-50/80 dark:bg-indigo-950/50 border border-indigo-200/80 dark:border-indigo-800/80 px-3 py-1.5 rounded-2xl text-xs shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <div className="flex flex-col text-left">
              <span className="text-[9px] font-bold text-indigo-600/80 dark:text-indigo-400/80 uppercase tracking-wider">Versión</span>
              <span className="font-black font-mono text-indigo-950 dark:text-indigo-200 text-xs sm:text-sm">4</span>
            </div>
          </div>
        </div>

      </div>
    </header>
  );
}
