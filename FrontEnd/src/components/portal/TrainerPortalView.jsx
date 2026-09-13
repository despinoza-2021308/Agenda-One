import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  Building2, 
  User, 
  Phone, 
  MapPin, 
  Video, 
  Play, 
  CheckCircle2, 
  FileText, 
  ArrowLeft, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  LogOut, 
  Sparkles, 
  AlertCircle, 
  Check, 
  MessageCircle, 
  HelpCircle,
  Banknote,
  Send,
  X
} from 'lucide-react';
import { api } from '../../services/api';

const STORAGE_PORTAL_CODE = 'agenda_portal_trainer_code';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function TrainerPortalView({
  initialTrainerCode = null,
  availableTrainers = [],
  onBackToAdmin,
  onNotifyAdmin
}) {
  // Código activo del capacitador
  const [trainerCode, setTrainerCode] = useState(() => {
    if (initialTrainerCode) return String(initialTrainerCode).trim().toUpperCase();
    const saved = localStorage.getItem(STORAGE_PORTAL_CODE);
    return saved ? saved.trim().toUpperCase() : '';
  });

  const [inputCode, setInputCode] = useState(trainerCode || '');
  const [activeSubTab, setActiveSubTab] = useState('today'); // 'today' | 'upcoming' | 'history'
  
  // Fecha de consulta mensual
  const [queryDate, setQueryDate] = useState(new Date(2026, 8, 1)); // Septiembre 2026 por defecto
  
  // Datos del portal
  const [portalData, setPortalData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  
  // Estado del Modal de Bitácora
  const [activeLogCita, setActiveLogCita] = useState(null);
  const [logText, setLogText] = useState('');
  const [savingLog, setSavingLog] = useState(false);

  // Notificación flotante interna
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Cargar datos del capacitador desde la API
  const fetchPortalData = useCallback(async (codeToFetch) => {
    if (!codeToFetch) return;
    setLoading(true);
    setErrorMessage(null);

    try {
      const year = queryDate.getFullYear();
      const month = queryDate.getMonth() + 1;
      const todayStr = '2026-09-09'; // Fecha de contexto de la agenda o día actual

      const data = await api.getTrainerPortal(codeToFetch, { year, month, today: todayStr });
      setPortalData(data);
      localStorage.setItem(STORAGE_PORTAL_CODE, codeToFetch);
    } catch (err) {
      console.error('Error al cargar portal de capacitador:', err);
      setErrorMessage(err.message || 'No se pudo conectar con el portal del capacitador.');
      setPortalData(null);
    } finally {
      setLoading(false);
    }
  }, [queryDate]);

  // Si cambia el código activo o la fecha mensual, recargar
  useEffect(() => {
    if (trainerCode) {
      fetchPortalData(trainerCode);
    }
  }, [trainerCode, fetchPortalData]);

  // Iniciar sesión con un código
  const handleLogin = (code) => {
    const clean = String(code || inputCode).trim().toUpperCase();
    if (!clean) {
      setErrorMessage('Por favor ingresa tus iniciales registradas (ej. MO, OQ, PF).');
      return;
    }
    setTrainerCode(clean);
    setInputCode(clean);
  };

  // Cerrar sesión
  const handleLogout = () => {
    localStorage.removeItem(STORAGE_PORTAL_CODE);
    setTrainerCode('');
    setInputCode('');
    setPortalData(null);
    setErrorMessage(null);
  };

  // Navegación mensual
  const handlePrevMonth = () => {
    setQueryDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setQueryDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Actualizar estado rápido (ej. Iniciar sesión -> En Curso)
  const handleUpdateStatus = async (citaId, newStatus) => {
    if (!trainerCode) return;
    try {
      await api.updateTrainerCita(trainerCode, citaId, { estado: newStatus });
      showToast(`Cita marcada como "${newStatus}".`);
      await fetchPortalData(trainerCode);
      if (onNotifyAdmin) onNotifyAdmin();
    } catch (err) {
      showToast(err.message || 'Error al actualizar estado', 'error');
    }
  };

  // Abrir modal de bitácora
  const handleOpenLogModal = (cita, shouldComplete = false) => {
    setActiveLogCita(cita);
    setLogText(cita.bitacora || '');
  };

  // Guardar bitácora y opcionalmente completar cita
  const handleSaveLog = async (completeSession = false) => {
    if (!trainerCode || !activeLogCita) return;
    setSavingLog(true);

    try {
      const payload = {
        bitacora: logText.trim()
      };
      if (completeSession) {
        payload.estado = 'Impartida';
      }

      await api.updateTrainerCita(trainerCode, activeLogCita.id, payload);
      showToast(completeSession ? '¡Sesión finalizada con éxito y bitácora guardada! 🎉' : 'Bitácora guardada.');
      setActiveLogCita(null);
      await fetchPortalData(trainerCode);
      if (onNotifyAdmin) onNotifyAdmin();
    } catch (err) {
      showToast(err.message || 'Error al guardar bitácora', 'error');
    } finally {
      setSavingLog(false);
    }
  };

  // ==========================================
  // VISTA 1: INGRESO POR CÓDIGO (LOGIN LIGERO)
  // ==========================================
  if (!trainerCode || !portalData) {
    return (
      <div className="flex-1 flex items-center justify-center py-6 sm:py-12 px-4 animate-in fade-in duration-300">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 relative overflow-hidden">
          
          {/* Acento estético superior */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500" />

          {/* Botón Volver al Administrador si aplica */}
          {onBackToAdmin && (
            <button
              onClick={onBackToAdmin}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white mb-5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver a la Agenda Central</span>
            </button>
          )}

          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-500/25 mb-4">
              <User className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Portal del Capacitador
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5">
              Acceso móvil rápido a tu agenda, control de horas e informe de sesiones.
            </p>
          </div>

          {/* Alerta de Error */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/80 flex items-start gap-3 text-xs text-rose-800 dark:text-rose-200">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Formulario de Acceso */}
          <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 text-center">
                Ingresa tus Iniciales Oficiales
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={5}
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  placeholder="Ej: MO"
                  autoFocus
                  className="w-full text-center text-3xl font-black tracking-widest uppercase py-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-600 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"
                />
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center mt-1.5">
                Código asignado por la administración (2 a 5 letras).
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !inputCode.trim()}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-500/25 transition-all transform active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Consultando agenda...</span>
              ) : (
                <>
                  <span>Entrar a mi Itinerario</span>
                  <Check className="w-4 h-4 stroke-[3]" />
                </>
              )}
            </button>
          </form>

          {/* Chips de selección rápida si se conocen los capacitadores */}
          {availableTrainers && availableTrainers.length > 0 && (
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 text-center mb-3 uppercase tracking-wider">
                Selección de un toque para pruebas rápidas
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {availableTrainers.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleLogin(t.iniciales)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:border-blue-300 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                  >
                    <span 
                      className="w-2.5 h-2.5 rounded-full" 
                      style={{ backgroundColor: t.color || '#3B82F6' }} 
                    />
                    <span>[{t.iniciales}] {t.nombre_completo.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Tus iniciales quedan memorizadas en este teléfono</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VISTA 2: PORTAL MÓVIL ACTIVO DEL CAPACITADOR
  // ==========================================
  const { capacitador, resumen, citas_hoy = [], citas_proximas = [], citas_mes = [] } = portalData;

  // Formato de moneda Quetzales
  const formatQ = (val) => `Q ${Number(val || 0).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const currentMonthName = MONTH_NAMES[queryDate.getMonth()];
  const currentYear = queryDate.getFullYear();

  // Citas para la pestaña activa
  const displayCitas = activeSubTab === 'today' 
    ? citas_hoy 
    : activeSubTab === 'upcoming' 
      ? citas_proximas 
      : citas_mes.filter(c => c.estado === 'Impartida');

  return (
    <div className="flex-1 w-full max-w-3xl mx-auto py-3 sm:py-6 px-3 sm:px-4 flex flex-col gap-4 animate-in fade-in duration-200">
      
      {/* Toast Flotante Interno */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold transition-all animate-in slide-in-from-bottom-3 ${
          toast.type === 'error'
            ? 'bg-rose-50 dark:bg-rose-950 border-rose-200 text-rose-800 dark:text-rose-200'
            : 'bg-slate-900 dark:bg-slate-800 border-slate-700 text-white'
        }`}>
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Barra de Perfil Móvil */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar con iniciales */}
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-md shrink-0"
              style={{ backgroundColor: capacitador.color || '#3B82F6' }}
            >
              {capacitador.iniciales}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
                  {capacitador.nombre_completo}
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  [{capacitador.iniciales}]
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                <Banknote className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Tarifa: <strong>{formatQ(capacitador.tarifa_hora)}</strong> / hr</span>
              </p>
            </div>
          </div>

          {/* Acciones de Cabecera */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => fetchPortalData(trainerCode)}
              disabled={loading}
              title="Actualizar itinerario"
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-blue-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            </button>
            <button
              onClick={handleLogout}
              title="Cerrar sesión en este teléfono"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-xs font-semibold transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tarjeta de Resumen Mensual (KPIs & Honorarios en Quetzales) */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        {/* Adorno visual de fondo */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Selector de Mes */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-blue-200">Resumen del Período</span>
          </div>
          <div className="flex items-center gap-1 bg-white/10 backdrop-blur rounded-xl p-0.5">
            <button
              onClick={handlePrevMonth}
              className="p-1 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition-colors cursor-pointer"
              title="Mes anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2.5 text-xs font-black tracking-wide">
              {currentMonthName} {currentYear}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition-colors cursor-pointer"
              title="Mes siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Métricas Principales */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {/* Honorarios Impartidos */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 backdrop-blur">
            <p className="text-[11px] font-semibold text-blue-300 uppercase tracking-wider">Honorarios Ganados</p>
            <p className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">
              {formatQ(resumen.honorarios_impartidos)}
            </p>
            <p className="text-[10px] text-white/60 mt-0.5">
              Por {resumen.horas_impartidas} hrs impartidas
            </p>
          </div>

          {/* Honorarios Proyectados */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 backdrop-blur">
            <p className="text-[11px] font-semibold text-blue-300 uppercase tracking-wider">Total Proyectado</p>
            <p className="text-xl sm:text-2xl font-black text-white mt-1">
              {formatQ(resumen.honorarios_proyectados)}
            </p>
            <p className="text-[10px] text-white/60 mt-0.5">
              {resumen.horas_totales_mes} hrs programadas
            </p>
          </div>

          {/* Conteo de Citas */}
          <div className="col-span-2 sm:col-span-1 bg-white/5 border border-white/10 rounded-2xl p-3.5 backdrop-blur flex sm:flex-col justify-between items-center sm:items-start">
            <div>
              <p className="text-[11px] font-semibold text-blue-300 uppercase tracking-wider">Capacitaciones</p>
              <p className="text-xl sm:text-2xl font-black text-white mt-1">
                {resumen.citas_impartidas} <span className="text-xs font-normal text-white/60">/ {resumen.total_citas_mes}</span>
              </p>
            </div>
            <div className="flex gap-2 sm:mt-1">
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full font-bold">
                {resumen.citas_impartidas} completadas
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Pestañas de Itinerario */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-200/80 dark:bg-slate-800/80 rounded-2xl backdrop-blur">
        <button
          onClick={() => setActiveSubTab('today')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeSubTab === 'today'
              ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>Hoy</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
            citas_hoy.length > 0 
              ? 'bg-blue-600 text-white' 
              : 'bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
          }`}>
            {citas_hoy.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('upcoming')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeSubTab === 'upcoming'
              ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>Próximas</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
            {citas_proximas.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('history')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeSubTab === 'history'
              ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>Historial</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
            {resumen.citas_impartidas}
          </span>
        </button>
      </div>

      {/* Lista de Citas */}
      <div className="space-y-3 pb-8">
        {displayCitas.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 text-center text-slate-400 dark:text-slate-500">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              {activeSubTab === 'today' 
                ? 'No tienes capacitaciones programadas para hoy.'
                : activeSubTab === 'upcoming' 
                  ? 'No hay actividades próximas agendadas.' 
                  : 'Aún no has registrado capacitaciones completadas en este mes.'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Disfruta tu día o revisa las otras pestañas de tu agenda.
            </p>
          </div>
        ) : (
          displayCitas.map((cita) => {
            const isToday = activeSubTab === 'today';
            const isEnCurso = cita.estado === 'En Curso';
            const isImpartida = cita.estado === 'Impartida';
            const isCancelada = cita.estado === 'Cancelada';

            return (
              <div
                key={cita.id}
                className={`bg-white dark:bg-slate-900 rounded-3xl border transition-all p-4 sm:p-5 shadow-xs relative overflow-hidden ${
                  isEnCurso 
                    ? 'border-amber-400 dark:border-amber-500/80 ring-2 ring-amber-400/20 shadow-amber-500/10'
                    : isImpartida
                      ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/10'
                      : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* Banda de estado para En Curso */}
                {isEnCurso && (
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 to-amber-500 animate-pulse" />
                )}

                {/* Cabecera de la Cita */}
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Badge de Modalidad */}
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      cita.modalidad === 'Presencial'
                        ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                        : 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                    }`}>
                      {cita.modalidad === 'Presencial' ? <MapPin className="w-3 h-3" /> : <Video className="w-3 h-3" />}
                      <span>{cita.modalidad}</span>
                    </span>

                    {/* Badge de Tipo de Servicio */}
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {cita.tipo_servicio}
                    </span>

                    {/* Fecha de la cita (si no es la pestaña de hoy) */}
                    {!isToday && (
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 ml-1">
                        📅 {String(cita.fecha).split('T')[0]}
                      </span>
                    )}
                  </div>

                  {/* Estado Visual */}
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black shrink-0 ${
                    isEnCurso
                      ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 animate-pulse'
                      : isImpartida
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                        : isCancelada
                          ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}>
                    {cita.estado}
                  </span>
                </div>

                {/* Horario y Horas */}
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-black text-lg mb-1">
                  <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>{cita.hora_inicio} - {cita.hora_fin}</span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                    {cita.horas} hrs
                  </span>
                </div>

                {/* Cliente / Empresa */}
                <div className="mt-2 text-slate-800 dark:text-slate-200">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                      {cita.cliente_nombre}
                    </span>
                  </div>

                  {/* Contacto / Teléfono */}
                  {(cita.cliente_contacto || cita.cliente_telefono) && (
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1 pl-5.5">
                      {cita.cliente_contacto && <span>Contacto: <strong>{cita.cliente_contacto}</strong></span>}
                      {cita.cliente_telefono && (
                        <a
                          href={`tel:${cita.cliente_telefono}`}
                          className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-bold"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{cita.cliente_telefono}</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Observaciones de la Agenda Central */}
                {cita.observaciones && (
                  <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                    <span className="font-bold text-slate-700 dark:text-slate-200">Indicaciones: </span>
                    <span>{cita.observaciones}</span>
                  </div>
                )}

                {/* Bitácora Guardada si existe */}
                {cita.bitacora && (
                  <div className="mt-3 p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-xs text-emerald-900 dark:text-emerald-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-black flex items-center gap-1 text-[11px] uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                        <FileText className="w-3.5 h-3.5" />
                        <span>Bitácora de Sesión Registrada</span>
                      </span>
                      <button
                        onClick={() => handleOpenLogModal(cita)}
                        className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                      >
                        Editar
                      </button>
                    </div>
                    <p className="whitespace-pre-line text-slate-700 dark:text-slate-300 text-xs">
                      {cita.bitacora}
                    </p>
                  </div>
                )}

                {/* Botones de Acción Móvil en 1 toque */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {/* Botón Iniciar Sesión (Pasa a En Curso) */}
                    {cita.estado === 'Programada' && (
                      <button
                        onClick={() => handleUpdateStatus(cita.id, 'En Curso')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md shadow-amber-500/20 transition-all transform active:scale-95 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Iniciar Sesión</span>
                      </button>
                    )}

                    {/* Botón Finalizar Sesión (Abre Bitácora y Finaliza) */}
                    {cita.estado === 'En Curso' && (
                      <button
                        onClick={() => handleOpenLogModal(cita, true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all transform active:scale-95 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Finalizar Sesión</span>
                      </button>
                    )}

                    {/* Botón de Bitácora si no está finalizada o para redactar */}
                    <button
                      onClick={() => handleOpenLogModal(cita)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      <span>{cita.bitacora ? 'Ver / Editar Bitácora' : 'Registrar Bitácora'}</span>
                    </button>
                  </div>

                  {/* WhatsApp directo al cliente si tiene número */}
                  {cita.cliente_telefono && (
                    <a
                      href={`https://wa.me/${cita.cliente_telefono.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors"
                      title="Escribir por WhatsApp al cliente"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Chat Cliente</span>
                    </a>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ==========================================
          MODAL DE BITÁCORA DE SESIÓN
         ========================================== */}
      {activeLogCita && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header del Modal */}
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    Bitácora de Sesión
                  </h3>
                  <p className="text-[11px] text-slate-500 truncate max-w-xs">
                    {activeLogCita.cliente_nombre}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveLogCita(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Cuerpo del Modal */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div className="p-3 rounded-2xl bg-blue-50/50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 text-xs text-blue-900 dark:text-blue-200 flex items-center justify-between">
                <div>
                  <p className="font-bold">{activeLogCita.tipo_servicio} - {activeLogCita.modalidad}</p>
                  <p className="text-[11px] text-blue-700 dark:text-blue-300">
                    {activeLogCita.hora_inicio} a {activeLogCita.hora_fin} ({activeLogCita.horas} hrs)
                  </p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-200/60 dark:bg-blue-800 text-blue-900 dark:text-blue-100">
                  Estado actual: {activeLogCita.estado}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Notas de la Sesión, Temas Vistos y Acuerdos:
                </label>
                <textarea
                  rows={6}
                  value={logText}
                  onChange={(e) => setLogText(e.target.value)}
                  placeholder="Ejemplo: Se completó el Módulo 2 con 14 participantes. Se acordó enviar la tarea de control estadístico el viernes. Asistencia al 100%..."
                  className="w-full text-xs sm:text-sm p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Esta información queda visible para la administración en la agenda central.
                </p>
              </div>
            </div>

            {/* Footer con Acciones */}
            <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveLogCita(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              {/* Botón Guardar sin cambiar estado */}
              <button
                type="button"
                disabled={savingLog}
                onClick={() => handleSaveLog(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white text-xs font-bold transition-all cursor-pointer"
              >
                Solo Guardar Notas
              </button>

              {/* Botón Guardar y Marcar Impartida */}
              {activeLogCita.estado !== 'Impartida' && (
                <button
                  type="button"
                  disabled={savingLog}
                  onClick={() => handleSaveLog(true)}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all transform active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Guardar y Marcar como Impartida</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
