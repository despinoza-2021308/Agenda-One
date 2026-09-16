import React from 'react';
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
    <div className="w-full bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-600 rounded-xl overflow-hidden shadow-xs mb-3 transition-all select-none print:shadow-none print:border-2 print:border-black print:mb-4">
      <div className="grid grid-cols-12 divide-x-2 divide-slate-900 dark:divide-slate-600 print:divide-black">
        
        {/* ========================================================
            COLUMNA 1 (IZQUIERDA): LOGO CORPORATIVO ONE CONSULTING
           ======================================================== */}
        <div className="col-span-4 sm:col-span-3 lg:col-span-2.5 flex items-center justify-center p-2 sm:p-2.5 bg-white dark:bg-slate-900 print:bg-white">
          <img 
            src="/Logo One.png" 
            alt="ONE Consulting" 
            className="max-h-12 sm:max-h-14 md:max-h-16 w-auto object-contain transition-transform hover:scale-102"
            title="ONE Consulting - ¡Su aliado en generar valor!"
          />
        </div>

        {/* ========================================================
            COLUMNA 2 (CENTRAL): TÍTULO, ÚLTIMA ACTUALIZACIÓN Y MES
           ======================================================== */}
        <div className="col-span-8 sm:col-span-6 lg:col-span-7 flex flex-col divide-y-2 divide-slate-900 dark:divide-slate-600 print:divide-black">
          
          {/* Fila 1: TÍTULO INSTITUCIONAL */}
          <div className="py-1 px-2 sm:px-3 flex items-center justify-center bg-white dark:bg-slate-900 print:bg-white min-h-[30px] sm:min-h-[34px]">
            <h1 className="font-black text-sm sm:text-base md:text-lg tracking-widest text-slate-900 dark:text-white uppercase font-sans print:text-black">
              AGENDA
            </h1>
          </div>

          {/* Fila 2: ÚLTIMA ACTUALIZACIÓN POR MES */}
          <div className="grid grid-cols-12 divide-x-2 divide-slate-900 dark:divide-slate-600 print:divide-black text-xs sm:text-sm">
            <div className="col-span-6 sm:col-span-5 px-2 sm:px-3 py-1 font-medium text-slate-700 dark:text-slate-300 flex items-center print:text-black">
              <span className="truncate">Ultima Actualización</span>
            </div>
            <div className="col-span-6 sm:col-span-7 px-2 sm:px-3 py-1 font-black text-slate-950 dark:text-white text-center flex items-center justify-center font-mono tracking-wide print:text-black bg-slate-50/50 dark:bg-slate-800/30 print:bg-transparent">
              {lastUpdateDate || '16/09/2026'}
            </div>
          </div>

          {/* Fila 3: MES (CON RECUADRO AMARILLO INSTITUCIONAL) */}
          <div className="grid grid-cols-12 divide-x-2 divide-slate-900 dark:divide-slate-600 print:divide-black text-xs sm:text-sm">
            <div className="col-span-6 sm:col-span-5 px-2 sm:px-3 py-1 font-bold text-slate-800 dark:text-slate-200 flex items-center print:text-black uppercase">
              <span>MES</span>
            </div>
            <div 
              className="col-span-6 sm:col-span-7 px-2 sm:px-3 py-1 font-black text-slate-950 text-center flex items-center justify-center font-mono tracking-wider lowercase shadow-inner print:text-black"
              style={{
                backgroundColor: '#FFFF00',
                color: '#000000',
                WebkitPrintColorAdjust: 'exact',
                printColorAdjust: 'exact'
              }}
              title={`Mes activo de la agenda: ${monthCode}`}
            >
              {monthCode}
            </div>
          </div>
        </div>

        {/* ========================================================
            COLUMNA 3 (DERECHA): CÓDIGO DEL MODELO Y VERSIÓN
           ======================================================== */}
        <div className="col-span-12 sm:col-span-3 lg:col-span-2.5 flex flex-col divide-y-2 divide-slate-900 dark:divide-slate-600 print:divide-black text-xs sm:text-sm border-t-2 sm:border-t-0 border-slate-900 dark:border-slate-600">
          
          {/* Fila 1: Código oficial */}
          <div className="grid grid-cols-2 divide-x-2 divide-slate-900 dark:divide-slate-600 print:divide-black flex-1 min-h-[30px] sm:min-h-[34px]">
            <div className="px-2 py-1 font-semibold text-slate-700 dark:text-slate-300 flex items-center print:text-black">
              <span>Codigo:</span>
            </div>
            <div className="px-2 py-1 font-black text-slate-950 dark:text-white flex items-center justify-center font-mono tracking-wide print:text-black bg-slate-50/50 dark:bg-slate-800/30 print:bg-transparent">
              AD-RE-11
            </div>
          </div>

          {/* Fila 2: Versión del formato */}
          <div className="grid grid-cols-2 divide-x-2 divide-slate-900 dark:divide-slate-600 print:divide-black flex-1">
            <div className="px-2 py-1 font-semibold text-slate-700 dark:text-slate-300 flex items-center print:text-black">
              <span>Versión</span>
            </div>
            <div className="px-2 py-1 font-black text-slate-950 dark:text-white flex items-center justify-center font-mono print:text-black bg-slate-50/50 dark:bg-slate-800/30 print:bg-transparent">
              4
            </div>
          </div>

          {/* Fila 3: Cierre de cuadrícula */}
          <div className="flex-1 bg-white dark:bg-slate-900 print:bg-white min-h-[20px] hidden sm:block" />
        </div>

      </div>
    </div>
  );
}
