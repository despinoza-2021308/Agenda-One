import React, { useState } from 'react';
import { 
  Download, 
  Upload, 
  Database, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  RefreshCw, 
  X, 
  Clock, 
  HardDrive,
  ExternalLink
} from 'lucide-react';
import { api } from '../../services/api';

export default function BackupModal({ isOpen, onClose, onRefreshData, showToast }) {
  const [downloading, setDownloading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('download'); // 'download' | 'restore' | 'supabase'

  if (!isOpen) return null;

  // 1. Descargar copia de seguridad en JSON estructurado
  const handleDownloadBackup = async () => {
    try {
      setDownloading(true);
      setErrorMessage('');
      setSuccessMessage('');

      const backupData = await api.exportBackup();
      
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      link.href = url;
      link.download = `backup_agenda_one_${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccessMessage(`¡Copia de seguridad descargada exitosamente! (${backupData.stats?.total_citas || 0} citas, ${backupData.stats?.total_clientes || 0} clientes respaldados)`);
      if (showToast) showToast('Copia de seguridad descargada exitosamente', 'success');
    } catch (err) {
      console.error('Error al exportar backup:', err);
      setErrorMessage(err.message || 'Error al exportar la copia de seguridad.');
      if (showToast) showToast('Error al descargar copia de seguridad', 'error');
    } finally {
      setDownloading(false);
    }
  };

  // 2. Manejar selección de archivo para restaurar
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    setErrorMessage('');
    setSuccessMessage('');
    if (!file) {
      setSelectedFile(null);
      setFilePreview(null);
      return;
    }

    if (!file.name.endsWith('.json')) {
      setErrorMessage('Por favor seleccione un archivo en formato .json válido.');
      setSelectedFile(null);
      setFilePreview(null);
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result);
        if (!parsed.data || !parsed.system) {
          setErrorMessage('El archivo no parece ser una copia de seguridad válida de Agenda-One.');
          setFilePreview(null);
          return;
        }
        setFilePreview(parsed);
      } catch (parseErr) {
        setErrorMessage('Error al leer el archivo JSON: formato corrupto o inválido.');
        setFilePreview(null);
      }
    };
    reader.readAsText(file);
  };

  // 3. Ejecutar restauración
  const handleRestoreBackup = async () => {
    if (!filePreview) {
      setErrorMessage('Primero debe seleccionar un archivo de respaldo válido.');
      return;
    }

    const confirmRestore = window.confirm(
      `¿Está seguro de restaurar los datos de este archivo?\n\nFecha de respaldo: ${filePreview.generated_at || 'Desconocida'}\nCitas a sincronizar: ${filePreview.stats?.total_citas || filePreview.data?.citas?.length || 0}\nClientes: ${filePreview.stats?.total_clientes || filePreview.data?.clientes?.length || 0}\n\nLos registros existentes no se eliminarán, se actualizarán o sincronizarán.`
    );

    if (!confirmRestore) return;

    try {
      setRestoring(true);
      setErrorMessage('');
      setSuccessMessage('');

      const result = await api.restoreBackup(filePreview);
      setSuccessMessage(result.message || 'Restauración completada con éxito.');
      if (showToast) showToast('Base de datos restaurada correctamente', 'success');
      if (onRefreshData) onRefreshData();
      setSelectedFile(null);
      setFilePreview(null);
    } catch (err) {
      console.error('Error al restaurar backup:', err);
      setErrorMessage(err.message || 'Ocurrió un error al restaurar la base de datos.');
      if (showToast) showToast('Error al restaurar base de datos', 'error');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl glass-panel bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-300 dark:border-indigo-800 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Copias de Seguridad y Respaldo
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Protección y recuperación integral de información
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

        {/* Tabs de navegación */}
        <div className="flex border-b border-slate-200/60 dark:border-white/5 px-6 pt-2 bg-slate-50/50 dark:bg-slate-900/40">
          <button
            onClick={() => setActiveTab('download')}
            className={`pb-3 px-3 font-semibold text-xs transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'download'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" /> Descargar Respaldo
          </button>
          <button
            onClick={() => setActiveTab('restore')}
            className={`pb-3 px-3 font-semibold text-xs transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'restore'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" /> Restaurar Archivo
          </button>
          <button
            onClick={() => setActiveTab('supabase')}
            className={`pb-3 px-3 font-semibold text-xs transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'supabase'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Backups Supabase (Cloud)
          </button>
        </div>

        {/* Mensajes de Estado */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm">
          {/* TAB 1: DESCARGAR RESPALDO */}
          {activeTab === 'download' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/40 text-indigo-950 dark:text-indigo-200 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Respaldo Completo e Independiente
                </div>
                <p className="leading-relaxed">
                  Genera una copia en archivo <strong>.json</strong> con todos los registros activos: catálogo de 109 empresas clientes, capacitadores, citas agendadas, firmas de conformidad y bitácoras de auditoría.
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Recomendado para la coordinadora: Descargar una copia periódica (semanal o mensual) y guardarla en su computadora o nube de Google Drive.
                </p>
              </div>

              <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/20 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Download className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                    Exportar Base de Datos a JSON
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mt-1">
                    Haga clic en el botón para generar y descargar inmediatamente el archivo a su dispositivo.
                  </p>
                </div>
                <button
                  onClick={handleDownloadBackup}
                  disabled={downloading}
                  className="mt-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {downloading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Generando Respaldo...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Descargar Copia de Seguridad
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: RESTAURAR ARCHIVO */}
          {activeTab === 'restore' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 text-amber-950 dark:text-amber-200 text-xs space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  Restauración de Datos Segura
                </div>
                <p className="leading-relaxed">
                  Esta acción cargará los capacitadores, clientes y citas contenidas en el archivo seleccionado. Las citas existentes se sincronizarán mediante inserción o actualización inteligente sin destruir el historial.
                </p>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Seleccionar archivo de respaldo (.json):
                </label>
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={handleFileChange}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-950 dark:file:text-indigo-300 cursor-pointer border border-slate-200 dark:border-slate-800 rounded-xl p-2 bg-slate-50/50 dark:bg-slate-900/50"
                />
              </div>

              {filePreview && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                  <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-500" />
                    Resumen del Archivo Seleccionado:
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-300 text-[11px] pt-1">
                    <div><strong>Sistema:</strong> {filePreview.system || 'Agenda-One'}</div>
                    <div><strong>Fecha:</strong> {filePreview.generated_at ? new Date(filePreview.generated_at).toLocaleString() : 'N/A'}</div>
                    <div><strong>Citas:</strong> {filePreview.stats?.total_citas ?? filePreview.data?.citas?.length ?? 0}</div>
                    <div><strong>Clientes:</strong> {filePreview.stats?.total_clientes ?? filePreview.data?.clientes?.length ?? 0}</div>
                    <div><strong>Capacitadores:</strong> {filePreview.stats?.total_capacitadores ?? filePreview.data?.capacitadores?.length ?? 0}</div>
                    <div><strong>Generado por:</strong> {filePreview.created_by || 'Admin'}</div>
                  </div>

                  <button
                    onClick={handleRestoreBackup}
                    disabled={restoring}
                    className="w-full mt-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {restoring ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Restaurando Base de Datos...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Confirmar y Restaurar Datos
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SUPABASE AUTOMATED BACKUPS */}
          {activeTab === 'supabase' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/40 text-emerald-950 dark:text-emerald-200 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Copias de Seguridad Automáticas Diarias en Supabase
                </div>
                <p className="leading-relaxed">
                  En el plan de Supabase, la base de datos PostgreSQL ejecuta respaldos automáticos cada 24 horas y los mantiene resguardados en almacenamiento redundante en la nube.
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-200/80 dark:border-white/5 space-y-3 text-xs">
                <h5 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  ¿Cómo restaurar desde Supabase en caso de emergencia?
                </h5>
                <ol className="list-decimal pl-5 space-y-2 text-slate-600 dark:text-slate-300 text-[12px] leading-relaxed">
                  <li>
                    Ingresa a tu cuenta en <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 font-semibold underline inline-flex items-center gap-0.5">Supabase Dashboard <ExternalLink className="w-3 h-3" /></a>.
                  </li>
                  <li>
                    Selecciona tu proyecto <strong>Agenda-One</strong>.
                  </li>
                  <li>
                    En el menú lateral izquierdo, haz clic en <strong>Database</strong> &gt; <strong>Backups</strong>.
                  </li>
                  <li>
                    Verás el listado de respaldos diarios con fecha y hora. Haz clic en <strong>Restore</strong> en el día deseado y confirma con 1 clic.
                  </li>
                </ol>
              </div>

              <div className="p-3 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 text-blue-950 dark:text-blue-300 text-[11px] flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-blue-500 shrink-0" />
                <span>
                  <strong>Tip Empresarial:</strong> Gracias a la nueva <em>Papelera de Citas</em>, no necesitas restaurar toda la base de datos si alguien borra una cita por error; simplemente restáurala con el botón "Deshacer" o desde la papelera.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-white/5 flex justify-end bg-slate-50/50 dark:bg-slate-900/50">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
