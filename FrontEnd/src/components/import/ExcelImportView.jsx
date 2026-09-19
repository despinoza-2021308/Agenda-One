import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  FileSpreadsheet, Upload, CheckCircle2, AlertCircle, 
  ArrowLeft, Filter, Calendar, Clock, UserCheck, 
  Building2, Sparkles, RefreshCw, Eye, EyeOff, ShieldAlert,
  ChevronRight, Info, Layers
} from 'lucide-react';
import { 
  readWorkbookFromFile, 
  parseMonthSheet, 
  parseSheetMonthInfo 
} from '../../utils/excelParser';

export default function ExcelImportView({
  capacitadores = [],
  clientes = [],
  isAdmin = false,
  onOpenAdminLogin,
  onBackToCalendar,
  onImportSuccess,
  onShowToast
}) {
  // Estado del archivo
  const [file, setFile] = useState(null);
  const [workbook, setWorkbook] = useState(null);
  const [monthSheets, setMonthSheets] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState('');
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Opciones de importación
  const [excludeZeroHours, setExcludeZeroHours] = useState(true);
  const [defaultState, setDefaultState] = useState('Programada'); // 'Programada' o 'Impartida'
  const [replaceExistingMonth, setReplaceExistingMonth] = useState(true);
  const [createMissingClients, setCreateMissingClients] = useState(true);

  // Mapeo dinámico de capacitadores { 'OQ': 2, 'LT': 7, ... }
  const [trainerMapping, setTrainerMapping] = useState(() => {
    return {
      'MO': 1,
      'OQ': 2,
      'PF': 3,
      'ZG': 4,
      'JB': 5,
      'JA': 6,
      'LT': 7,
      'BJ': 8,
      'LM': 2 // Mapeo de respaldo si aplica
    };
  });

  // Filtros de visualización en la tabla de previsualización
  const [searchTerm, setSearchTerm] = useState('');
  const [activeViewTab, setActiveViewTab] = useState('valid'); // 'valid' | 'excluded'
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const fileInputRef = useRef(null);

  // Cuando cambian los capacitadores del catálogo, sincronizar IDs conocidos
  useEffect(() => {
    if (capacitadores && capacitadores.length > 0) {
      setTrainerMapping(prev => {
        const next = { ...prev };
        capacitadores.forEach(c => {
          if (c.iniciales) {
            next[c.iniciales.toUpperCase()] = c.id;
          }
        });
        return next;
      });
    }
  }, [capacitadores]);

  // Manejador de carga de archivo
  const handleProcessFile = async (selectedFile) => {
    if (!selectedFile) return;
    if (!selectedFile.name.match(/\.(xlsx|xls|xlsm)$/i)) {
      onShowToast?.('Por favor selecciona un archivo de Excel válido (.xlsx, .xls).', 'error');
      return;
    }

    setIsReadingFile(true);
    setImportResult(null);

    try {
      const result = await readWorkbookFromFile(selectedFile);
      setFile(selectedFile);
      setWorkbook(result.workbook);
      setMonthSheets(result.monthSheets);

      // Seleccionar automáticamente la hoja más relevante (ej. JUN 2026 o la última)
      if (result.monthSheets.length > 0) {
        // Intentar seleccionar una de 2026
        const sheet2026 = result.monthSheets.find(s => s.name.includes('JUN 2026')) || 
                          result.monthSheets.find(s => s.name.includes('MAY 2026')) || 
                          result.monthSheets[result.monthSheets.length - 1];
        setSelectedSheet(sheet2026 ? sheet2026.name : result.monthSheets[0].name);
      } else if (result.allSheets.length > 0) {
        setSelectedSheet(result.allSheets[0]);
      }

      onShowToast?.(`Archivo "${selectedFile.name}" cargado exitosamente.`, 'success');
    } catch (err) {
      console.error('Error al procesar archivo Excel:', err);
      onShowToast?.(err.message || 'Error al procesar el archivo Excel', 'error');
    } finally {
      setIsReadingFile(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  // Parsea la hoja seleccionada con las opciones actuales
  const parsedData = useMemo(() => {
    if (!workbook || !selectedSheet) return null;
    try {
      return parseMonthSheet(workbook, selectedSheet, clientes, {
        excludeZeroHours,
        trainerMapping,
        defaultState
      });
    } catch (err) {
      console.error('Error parseando hoja:', err);
      return null;
    }
  }, [workbook, selectedSheet, clientes, excludeZeroHours, trainerMapping, defaultState]);

  // Actualizar mapeo de capacitador
  const handleTrainerChange = (code, trainerId) => {
    setTrainerMapping(prev => ({
      ...prev,
      [code]: parseInt(trainerId, 10)
    }));
  };

  // Filtrado de la tabla de previsualización
  const displayCitas = useMemo(() => {
    if (!parsedData) return [];
    const list = activeViewTab === 'valid' ? parsedData.validCitas : parsedData.excludedCitas;
    if (!searchTerm.trim()) return list;

    const lower = searchTerm.toLowerCase();
    return list.filter(c => 
      (c.cliente_nombre && c.cliente_nombre.toLowerCase().includes(lower)) ||
      (c.observaciones && c.observaciones.toLowerCase().includes(lower)) ||
      (c.capacitador_iniciales && c.capacitador_iniciales.toLowerCase().includes(lower)) ||
      (c.tipo_servicio && c.tipo_servicio.toLowerCase().includes(lower)) ||
      (c.fecha && c.fecha.includes(lower))
    );
  }, [parsedData, activeViewTab, searchTerm]);

  // Ejecutar importación a la base de datos
  const handleConfirmImport = async () => {
    if (!isAdmin) {
      if (onOpenAdminLogin) {
        onOpenAdminLogin();
      } else {
        onShowToast?.('Se requiere PIN de Administrador para importar citas.', 'error');
      }
      return;
    }

    if (!parsedData || parsedData.validCitas.length === 0) {
      onShowToast?.('No hay citas válidas para importar en la hoja seleccionada.', 'error');
      return;
    }

    setIsImporting(true);
    try {
      const payload = {
        mes: parsedData.monthInfo ? parsedData.monthInfo.key : null,
        replaceExistingMonth,
        createMissingClients,
        citas: parsedData.validCitas.map(c => ({
          cliente_id: c.cliente_id,
          cliente_nombre: c.cliente_nombre,
          capacitador_id: c.capacitador_id,
          capacitador_iniciales: c.capacitador_iniciales,
          fecha: c.fecha,
          hora_inicio: c.hora_inicio,
          hora_fin: c.hora_fin,
          horas: c.horas,
          modalidad: c.modalidad,
          tipo_servicio: c.tipo_servicio,
          estado: c.estado,
          observaciones: c.observaciones,
          bitacora: c.bitacora
        }))
      };

      const result = await onImportSuccess(payload);
      setImportResult({
        success: true,
        count: result?.count || parsedData.validCitas.length,
        totalHoras: result?.totalHoras || parsedData.stats.totalHours,
        mes: parsedData.monthInfo ? parsedData.monthInfo.label : selectedSheet
      });

      onShowToast?.(`¡Importación exitosa! Se guardaron ${parsedData.validCitas.length} citas (${parsedData.stats.totalHours} hrs).`, 'success');
    } catch (err) {
      console.error('Error al importar:', err);
      onShowToast?.(err.message || 'Error al ejecutar la importación', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      
      {/* HEADER SUPERIOR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/75 dark:bg-slate-900/80 backdrop-blur-xl p-4 sm:p-6 rounded-3xl border border-white/60 dark:border-slate-800/80 shadow-glass">
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={onBackToCalendar}
            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-2xs group"
            title="Volver al Calendario"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-blue-700 via-indigo-700 to-cyan-600 dark:from-blue-400 dark:via-indigo-300 dark:to-cyan-400 bg-clip-text text-transparent">
                Importador de Excel AD-RE-11
              </h1>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-500/10 dark:bg-blue-400/10 text-blue-700 dark:text-blue-300 border border-blue-400/30">
                Oficial
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
              Carga automática de meses, descarte de 0 horas y sincronización con base de datos
            </p>
          </div>
        </div>

        {/* Estado Administrador */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isAdmin ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-400/30 text-xs font-bold shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Modo Administrador Activo
            </span>
          ) : (
            <button
              type="button"
              onClick={onOpenAdminLogin}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-200 border border-amber-400/30 text-xs font-bold transition-all cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              PIN Requerido para Guardar
            </button>
          )}
        </div>
      </div>

      {/* RESULTADO DE IMPORTACIÓN EXITOSA (MODAL / BANNER) */}
      {importResult && (
        <div className="bg-gradient-to-r from-emerald-500/20 via-teal-500/15 to-blue-500/20 dark:from-emerald-950/60 dark:via-teal-950/50 dark:to-blue-950/60 p-6 rounded-3xl border border-emerald-400/40 dark:border-emerald-700/60 shadow-glass animate-in zoom-in-95 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 shrink-0">
                <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  ¡Citas de {importResult.mes} importadas con éxito!
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  Se registraron <strong>{importResult.count} citas</strong> con un total de <strong>{importResult.totalHoras} horas</strong>. La agenda y los honorarios están actualizados.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onBackToCalendar}
                className="liquid-btn-primary px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <span>Ver en el Calendario</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECCIÓN 1: ZONA DE ARRASTRAR ARCHIVO Y SELECCIÓN DE HOJA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Card Drag & Drop */}
        <div className="lg:col-span-2 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 rounded-3xl border border-white/60 dark:border-slate-800/80 shadow-glass flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-xs">
                  1
                </div>
                <h2 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Archivo Excel AD-RE-11
                </h2>
              </div>
              {file && (
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setWorkbook(null);
                    setMonthSheets([]);
                    setSelectedSheet('');
                    setImportResult(null);
                  }}
                  className="text-xs text-rose-600 dark:text-rose-400 hover:underline font-semibold cursor-pointer"
                >
                  Cambiar archivo
                </button>
              )}
            </div>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-blue-500 bg-blue-500/10 scale-[1.01]'
                  : file
                  ? 'border-emerald-400/60 bg-emerald-500/5 dark:bg-emerald-950/20'
                  : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 hover:bg-slate-50/50 dark:hover:bg-slate-800/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.xlsm"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleProcessFile(e.target.files[0]);
                  }
                }}
              />

              {isReadingFile ? (
                <div className="py-4 flex flex-col items-center justify-center gap-3">
                  <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Leyendo y analizando archivo Excel...</p>
                </div>
              ) : file ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <FileSpreadsheet className="w-7 h-7" />
                  </div>
                  <p className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white mt-1">
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {(file.size / 1024).toFixed(1)} KB • {monthSheets.length} hojas de meses detectadas
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-glass-sm">
                    <Upload className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                      Arrastra y suelta tu archivo Excel aquí
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      o haz clic para explorar en tu computadora (<code className="text-blue-600 dark:text-blue-400">AD-RE-11 AGENDA.xlsx</code>)
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Selector de Hoja / Mes */}
          {monthSheets.length > 0 && (
            <div className="mt-5 pt-4 border-t border-slate-200/60 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Mes a importar (Hoja del libro):</span>
              </label>
              <select
                value={selectedSheet}
                onChange={(e) => setSelectedSheet(e.target.value)}
                className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white shadow-2xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                {monthSheets.map((s) => (
                  <option key={s.name} value={s.name}>
                    📅 {s.info ? s.info.label : s.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Card Opciones de Importación y Filtros */}
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 rounded-3xl border border-white/60 dark:border-slate-800/80 shadow-glass flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-xs">
                2
              </div>
              <h2 className="font-extrabold text-base text-slate-900 dark:text-white">
                Filtros y Opciones
              </h2>
            </div>

            <div className="space-y-4">
              
              {/* Checkbox 0 Horas */}
              <label className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 cursor-pointer transition-all hover:bg-slate-100/70 dark:hover:bg-slate-800">
                <input
                  type="checkbox"
                  checked={excludeZeroHours}
                  onChange={(e) => setExcludeZeroHours(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-blue-600 rounded-sm focus:ring-blue-500 border-slate-300 dark:border-slate-600 cursor-pointer"
                />
                <div>
                  <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white block">
                    Excluir citas de 0 horas y bloqueos
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    Filtra automáticamente reuniones virtuales de 0h y bloques no computables.
                  </span>
                </div>
              </label>

              {/* Estado de las citas */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
                <span className="font-bold text-xs text-slate-700 dark:text-slate-300 block mb-2">
                  Estado inicial de las citas:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDefaultState('Programada')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      defaultState === 'Programada'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    🕒 Programada
                  </button>
                  <button
                    type="button"
                    onClick={() => setDefaultState('Impartida')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      defaultState === 'Impartida'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    ✅ Impartida
                  </button>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-2">
                  {defaultState === 'Impartida'
                    ? 'Genera bitácora automática para meses transcurridos (suma en Honorarios devengados).'
                    : 'Ideal para meses futuros o en curso que aún no se han impartido.'}
                </span>
              </div>

              {/* Reemplazar mes existente */}
              <label className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 cursor-pointer transition-all hover:bg-slate-100/70 dark:hover:bg-slate-800">
                <input
                  type="checkbox"
                  checked={replaceExistingMonth}
                  onChange={(e) => setReplaceExistingMonth(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-blue-600 rounded-sm focus:ring-blue-500 border-slate-300 dark:border-slate-600 cursor-pointer"
                />
                <div>
                  <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white block">
                    Reemplazar citas previas de este mes
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    Previene duplicados si vuelves a importar el mismo mes actualizado.
                  </span>
                </div>
              </label>

            </div>
          </div>

          {/* Botón de importación */}
          <div className="mt-5 pt-4 border-t border-slate-200/60 dark:border-slate-800">
            <button
              type="button"
              disabled={!parsedData || parsedData.validCitas.length === 0 || isImporting}
              onClick={handleConfirmImport}
              className={`w-full py-3 px-4 rounded-2xl font-black text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                !parsedData || parsedData.validCitas.length === 0 || isImporting
                  ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'liquid-btn-primary hover:scale-[1.02] active:scale-95'
              }`}
            >
              {isImporting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Importando a la Base de Datos...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 stroke-[2.5]" />
                  <span>
                    Importar {parsedData ? parsedData.validCitas.length : 0} Citas
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: MAPEO INTELIGENTE DE CAPACITADORES (SI HAY DETECTADOS) */}
      {parsedData && parsedData.detectedTrainerCodes.length > 0 && (
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-5 rounded-3xl border border-white/60 dark:border-slate-800/80 shadow-glass">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Mapeo de Iniciales de Capacitadores Detectadas en Excel
              </h3>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Verifica que cada código de capacitador corresponda a la persona correcta
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {parsedData.detectedTrainerCodes.map((code) => {
              const assignedId = trainerMapping[code] || 2;
              const assignedTrainer = capacitadores.find(c => c.id === assignedId);
              const hoursInSheet = parsedData.stats.trainerHours[code] || 0;

              return (
                <div 
                  key={code} 
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm px-2.5 py-1 rounded-xl bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-400/30">
                      [{code}]
                    </span>
                    <span className="text-xs font-extrabold text-slate-600 dark:text-slate-300">
                      {hoursInSheet.toFixed(1)} hrs
                    </span>
                  </div>

                  <select
                    value={assignedId}
                    onChange={(e) => handleTrainerChange(code, e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white shadow-2xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    {capacitadores.map((cap) => (
                      <option key={cap.id} value={cap.id}>
                        {cap.nombre_completo} ({cap.iniciales})
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECCIÓN 3: RESUMEN Y TARJETAS DE MÉTRICAS */}
      {parsedData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          
          {/* Citas Válidas */}
          <div className="p-4 sm:p-5 rounded-3xl bg-emerald-500/10 dark:bg-emerald-950/30 border border-emerald-400/30 dark:border-emerald-700/50 shadow-glass">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
              Citas Válidas
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl sm:text-3xl font-black text-emerald-800 dark:text-emerald-300">
                {parsedData.stats.totalValid}
              </span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">citas</span>
            </div>
            <span className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 block mt-1">
              Listas para base de datos
            </span>
          </div>

          {/* Total Horas */}
          <div className="p-4 sm:p-5 rounded-3xl bg-blue-500/10 dark:bg-blue-950/30 border border-blue-400/30 dark:border-blue-700/50 shadow-glass">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 block">
              Total Horas
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl sm:text-3xl font-black text-blue-800 dark:text-blue-300">
                {parsedData.stats.totalHours}
              </span>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">hrs</span>
            </div>
            <span className="text-[11px] text-blue-700/80 dark:text-blue-400/80 block mt-1">
              Cómputo AD-RE-11
            </span>
          </div>

          {/* Excluidas */}
          <div className="p-4 sm:p-5 rounded-3xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-400/30 dark:border-amber-700/50 shadow-glass">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
              Excluidas (0h/Bloqueos)
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl sm:text-3xl font-black text-amber-800 dark:text-amber-300">
                {parsedData.stats.totalExcluded}
              </span>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">citas</span>
            </div>
            <span className="text-[11px] text-amber-700/80 dark:text-amber-400/80 block mt-1">
              Sin honorarios / no computables
            </span>
          </div>

          {/* Nuevos Clientes */}
          <div className="p-4 sm:p-5 rounded-3xl bg-purple-500/10 dark:bg-purple-950/30 border border-purple-400/30 dark:border-purple-700/50 shadow-glass">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 block">
              Clientes Nuevos
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl sm:text-3xl font-black text-purple-800 dark:text-purple-300">
                {parsedData.newClients.length}
              </span>
              <span className="text-xs font-bold text-purple-600 dark:text-purple-400">empresas</span>
            </div>
            <span className="text-[11px] text-purple-700/80 dark:text-purple-400/80 block mt-1">
              Auto-registro garantizado
            </span>
          </div>

        </div>
      )}

      {/* SECCIÓN 4: TABLA INTERACTIVA DE PREVISUALIZACIÓN */}
      {parsedData && (
        <div className="bg-white/75 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-white/60 dark:border-slate-800/80 shadow-glass overflow-hidden">
          
          {/* Header de la Tabla con Buscador y Tabs */}
          <div className="p-4 sm:p-5 border-b border-slate-200/60 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveViewTab('valid')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeViewTab === 'valid'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Citas Válidas ({parsedData.validCitas.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveViewTab('excluded')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeViewTab === 'excluded'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Excluidas ({parsedData.excludedCitas.length})
              </button>
            </div>

            {/* Input Buscador */}
            <div className="relative">
              <input
                type="text"
                placeholder="Filtrar por cliente, fecha o texto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 pl-3.5 pr-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Tabla Responsive */}
          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-md z-10 text-slate-600 dark:text-slate-300 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-3">Horario</th>
                  <th className="py-3 px-3">Horas</th>
                  <th className="py-3 px-4">Cliente / Empresa</th>
                  <th className="py-3 px-3">Capacitador</th>
                  <th className="py-3 px-3">Modalidad</th>
                  <th className="py-3 px-3">Tipo</th>
                  <th className="py-3 px-4">Observaciones en Excel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {displayCitas.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No se encontraron citas que coincidan con el filtro.
                    </td>
                  </tr>
                ) : (
                  displayCitas.map((c, idx) => {
                    const assignedTrainer = capacitadores.find(cp => cp.id === c.capacitador_id);
                    return (
                      <tr 
                        key={idx} 
                        className="hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors"
                      >
                        <td className="py-2.5 px-4 whitespace-nowrap font-bold text-slate-900 dark:text-white">
                          {c.fecha}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap text-slate-600 dark:text-slate-300">
                          {c.hora_inicio} - {c.hora_fin}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap font-black">
                          <span className={`px-2 py-0.5 rounded-md text-[11px] ${
                            c.horas > 0 
                              ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300 font-extrabold' 
                              : 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                          }`}>
                            {c.horas.toFixed(1)}h
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-1.5">
                            <span>{c.cliente_nombre}</span>
                            {c.is_new_client && (
                              <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-sm bg-purple-500/20 text-purple-700 dark:text-purple-300">
                                Nuevo
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span 
                            className="text-[10px] font-black px-2 py-0.5 rounded-md text-white shadow-2xs"
                            style={{ backgroundColor: assignedTrainer?.color || '#3B82F6' }}
                          >
                            {assignedTrainer?.iniciales || c.capacitador_iniciales}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            c.modalidad === 'Virtual'
                              ? 'bg-sky-500/15 text-sky-700 dark:text-sky-300'
                              : c.modalidad === 'Híbrida'
                              ? 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300'
                              : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                          }`}>
                            {c.modalidad}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap text-slate-600 dark:text-slate-300">
                          {c.tipo_servicio}
                        </td>
                        <td className="py-2.5 px-4 text-slate-500 dark:text-slate-400 max-w-xs truncate" title={c.observaciones}>
                          {c.observaciones}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
