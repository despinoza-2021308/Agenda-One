import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/layout/Navbar';
import CalendarView from './components/calendar/CalendarView';
import MonthlyReportView from './components/reports/MonthlyReportView';
import HonorariosView from './components/fees/HonorariosView';
import CapacitadoresView from './components/catalogs/CapacitadoresView';
import ClientesView from './components/catalogs/ClientesView';
import AppointmentModal from './components/appointments/AppointmentModal';
import WhatsAppModal from './components/whatsapp/WhatsAppModal';
import CommandPalette from './components/search/CommandPalette';
import AdminLoginModal from './components/auth/AdminLoginModal';
import TrainerPortalView from './components/portal/TrainerPortalView';
import MobileQrModal from './components/common/MobileQrModal';
import ExcelImportView from './components/import/ExcelImportView';
import DbStatusModal from './components/common/DbStatusModal';
import { getLocalDateString } from './utils/dateUtils';
import { getCachedData, setCachedData, hasCachedData } from './utils/cacheUtils';
import { api, authStorage } from './services/api';
import { loadMonthUpdates, recordMonthUpdate } from './utils/monthAuditUtils';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  // Detección si se accedió explícitamente vía código QR / enlace directo al Portal (?portal o ?portal=MO)
  const isDirectPortalAccess = (() => {
    try {
      if (typeof window === 'undefined') return false;
      const search = window.location.search || '';
      const hash = window.location.hash || '';
      if (search.includes('portal') || hash.toLowerCase().includes('portal')) return true;
    } catch (_) {}
    return false;
  })();

  const initialPortalParam = (() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const p = params.get('portal');
      if (p && p.trim()) return p.trim().toUpperCase();
      if (window.location.hash && window.location.hash.toLowerCase().includes('portal')) {
        const parts = window.location.hash.split(/[-/=]/);
        const last = parts[parts.length - 1];
        if (last && last.trim() && last.toLowerCase() !== 'portal') {
          return last.trim().toUpperCase();
        }
      }
    } catch (_) {}
    return null;
  })();

  // Detección de dispositivos móviles (teléfonos Android, iOS/iPhone/iPad, móviles)
  const isMobileDevice = (() => {
    if (typeof window === 'undefined') return false;
    const ua = (navigator.userAgent || navigator.vendor || window.opera || '').toLowerCase();
    const isMobileUA = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i.test(ua);
    const isTouchPhone = window.innerWidth < 768 && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
    return isMobileUA || isTouchPhone;
  })();

  // Si se abre desde teléfono celular (Android / iOS) o QR (?portal), mostrar exclusivamente el Portal Móvil
  const [activeTab, setActiveTab] = useState(() => {
    if (isDirectPortalAccess || isMobileDevice) return 'portal';
    return 'calendar';
  }); // 'calendar' | 'reports' | 'fees' | 'portal' | 'trainers' | 'clients'

  // Mapa de fechas de última actualización por mes para el Cajetín Oficial AD-RE-11
  const [monthUpdatesMap, setMonthUpdatesMap] = useState(() => loadMonthUpdates());

  const [urlPortalCode, setUrlPortalCode] = useState(initialPortalParam);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  // Fecha actual de la agenda con persistencia en sessionStorage (por defecto ciclo oficial 2026 AD-RE-11)
  const [currentDate, setCurrentDate] = useState(() => {
    try {
      const saved = sessionStorage.getItem('agenda_current_date');
      if (saved) {
        const d = new Date(saved);
        if (!isNaN(d.getTime())) {
          if (d.getFullYear() === 2026) return d;
        }
      }
    } catch (_) {}
    return new Date(2026, 3, 6); // Por defecto Abril 2026 (mes central oficial con citas AD-RE-11)
  });

  const handleSetCurrentDate = useCallback((newDate) => {
    setCurrentDate(newDate);
    try {
      if (newDate instanceof Date) {
        sessionStorage.setItem('agenda_current_date', newDate.toISOString());
      }
    } catch (_) {}
  }, []);

  // Control de Tema (Modo Oscuro / Claro)
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('agenda_theme');
    if (saved) return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('agenda_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Control de Sesión y Autenticación Administrativa
  const [isAdmin, setIsAdmin] = useState(() => !!authStorage.getToken());
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);
  const [pendingAdminAction, setPendingAdminAction] = useState(null);

  // Catálogos y Citas con persistencia local instantánea (Stale-While-Revalidate: 0ms de espera)
  const [capacitadores, setCapacitadores] = useState(() => getCachedData('agenda_capacitadores_cache', []));
  const [clientes, setClientes] = useState(() => getCachedData('agenda_clientes_cache', []));
  const [citas, setCitas] = useState(() => getCachedData('agenda_citas_cache', []));
  const [isSyncingData, setIsSyncingData] = useState(() => !hasCachedData('agenda_citas_cache'));

  // Estado del Modal de Cita
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [modalInitialDate, setModalInitialDate] = useState(null);

  // Estado para persistencia y retorno de Citas del Día (flecha volver atrás)
  const [selectedDayDetails, setSelectedDayDetails] = useState(null);
  const [lastDayDetails, setLastDayDetails] = useState(null);
  const [lastAppointmentModal, setLastAppointmentModal] = useState(null);

  // Estado del Modal de WhatsApp
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [whatsAppData, setWhatsAppData] = useState({ cita: null, date: null, capacitadorId: null });

  // Estado del Buscador Global (Command Palette)
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Estado de la Base de Datos Cloud y Modal de Estado
  const [dbStatus, setDbStatus] = useState(null);
  const [isDbStatusModalOpen, setIsDbStatusModalOpen] = useState(false);

  // Notificaciones Toast
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Verificar validez del token en backend al cargar la app (exclusivamente volátil en sessionStorage)
  useEffect(() => {
    // Purgar inmediatamente cualquier token persistente en localStorage de versiones anteriores
    try {
      localStorage.removeItem('agenda_admin_token');
    } catch (_) {}

    const token = authStorage.getToken();
    if (token) {
      api.verifyAdmin()
        .then(() => setIsAdmin(true))
        .catch(() => {
          authStorage.clearToken();
          setIsAdmin(false);
        });
    } else {
      setIsAdmin(false);
    }
  }, []);

  // La sesión administrativa se mantiene activa durante toda la jornada en sessionStorage.
  // Solo se destruye automáticamente al salir/cerrar el programa o al pulsar "Cerrar Sesión".

  // Si se accede a la vista de portal de capacitadores, revocar automáticamente la sesión administrativa
  useEffect(() => {
    if (urlPortalCode || activeTab === 'portal') {
      if (authStorage.getToken() || isAdmin) {
        authStorage.clearToken();
        setIsAdmin(false);
      }
    }
  }, [urlPortalCode, activeTab, isAdmin]);

  // Atajo de teclado global Ctrl + K / Cmd + K para abrir el Command Palette
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Cargar capacitadores con sincronización de caché local
  const loadCapacitadores = useCallback(async () => {
    try {
      const capsData = await api.getCapacitadores();
      if (Array.isArray(capsData) && capsData.length > 0) {
        setCapacitadores(capsData);
        setCachedData('agenda_capacitadores_cache', capsData);
      }
    } catch (err) {
      console.error('Error al cargar capacitadores:', err);
    }
  }, []);

  // Cargar catálogo de clientes con sincronización de caché local
  const loadClientes = useCallback(async () => {
    try {
      const clientsData = await api.getClientes();
      if (Array.isArray(clientsData) && clientsData.length > 0) {
        setClientes(clientsData);
        setCachedData('agenda_clientes_cache', clientsData);
      }
    } catch (err) {
      console.error('Error al cargar clientes:', err);
    }
  }, []);

  // Cargar citas (precarga completa en memoria para navegación instantánea 0ms y conteo exacto de horas)
  const loadCitas = useCallback(async () => {
    try {
      const citasData = await api.getCitas();
      if (Array.isArray(citasData)) {
        setCitas(citasData);
        setCachedData('agenda_citas_cache', citasData);
      }
      setIsSyncingData(false);

      // Auto-enfoque al ciclo con citas registradas si el usuario está en un mes vacío de otro año
      if (Array.isArray(citasData) && citasData.length > 0) {
        setCurrentDate(prev => {
          const y = prev.getFullYear();
          const m = prev.getMonth();
          const hasCitasInCurrentMonth = citasData.some(c => {
            if (!c.fecha) return false;
            const [cy, cm] = String(c.fecha).split('T')[0].split('-').map(Number);
            return cy === y && (cm - 1) === m;
          });

          if (!hasCitasInCurrentMonth && y !== 2026) {
            const targetDate = new Date(2026, 3, 6);
            try { sessionStorage.setItem('agenda_current_date', targetDate.toISOString()); } catch (_) {}
            return targetDate;
          }
          return prev;
        });
      }
    } catch (err) {
      console.error('Error al cargar citas:', err);
      setIsSyncingData(false);
    }
  }, []);

  // Monitorear estado de persistencia de la base de datos en la nube
  const loadDbStatus = useCallback(async () => {
    try {
      const status = await api.getHealth();
      setDbStatus(status);
    } catch (err) {
      console.error('Error al verificar estado de base de datos:', err);
    }
  }, []);

  useEffect(() => {
    loadCapacitadores();
    loadClientes();
    loadCitas();
    loadDbStatus();
  }, [loadCapacitadores, loadClientes, loadCitas, loadDbStatus]);

  // Sincronización periódica en segundo plano cada 60 segundos si la pestaña está visible
  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        loadCitas();
        loadDbStatus();
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [loadCitas, loadDbStatus]);

  // Gestor para ejecutar acciones tras autenticación exitosa
  const handleAdminLoginSuccess = async () => {
    setIsAdmin(true);
    // Sincronizar inmediatamente todos los datos con las credenciales administrativas activadas
    try {
      await Promise.all([
        loadCapacitadores(),
        loadCitas(),
        loadClientes()
      ]);
    } catch (_) {}

    if (pendingAdminAction) {
      pendingAdminAction();
      setPendingAdminAction(null);
    }
  };

  const handleLogoutAdmin = () => {
    authStorage.clearToken();
    setIsAdmin(false);
    showToast('Sesión administrativa cerrada. Modo Consulta activo 🔒', 'info');
  };

  // Handlers para Citas
  const handleOpenNewAppointment = (dateString = null, prefill = null, fromDay = null) => {
    if (!isAdmin) {
      setPendingAdminAction(() => () => handleOpenNewAppointment(dateString, prefill, fromDay));
      setIsAdminLoginModalOpen(true);
      return;
    }

    if (fromDay) {
      setLastDayDetails(fromDay);
      setSelectedDayDetails(null);
    }

    if (prefill) {
      setSelectedAppointment({
        ...prefill,
        fecha: dateString || getLocalDateString(currentDate)
      });
    } else {
      setSelectedAppointment(null);
    }
    setModalInitialDate(dateString || getLocalDateString(currentDate));
    setIsAppointmentModalOpen(true);
  };

  const handleSelectAppointment = (appointment, fromDay = null) => {
    if (fromDay) {
      setLastDayDetails(fromDay);
      setSelectedDayDetails(null);
    }
    setSelectedAppointment(appointment);
    setModalInitialDate(appointment?.fecha || getLocalDateString(currentDate));
    setIsAppointmentModalOpen(true);
  };

  const handleBackFromAppointment = () => {
    setIsAppointmentModalOpen(false);
    if (lastDayDetails) {
      setSelectedDayDetails(lastDayDetails);
      setLastDayDetails(null);
    }
  };

  const handleCloseAppointment = () => {
    setIsAppointmentModalOpen(false);
    setLastDayDetails(null);
  };

  const handleBackFromWhatsApp = () => {
    setIsWhatsAppModalOpen(false);
    if (lastAppointmentModal) {
      setSelectedAppointment(lastAppointmentModal);
      setIsAppointmentModalOpen(true);
      setLastAppointmentModal(null);
    } else if (lastDayDetails) {
      setSelectedDayDetails(lastDayDetails);
      setLastDayDetails(null);
    }
  };

  const handleCloseWhatsApp = () => {
    setIsWhatsAppModalOpen(false);
    setLastDayDetails(null);
    setLastAppointmentModal(null);
  };

  const handleSaveAppointment = async (formData) => {
    if (!isAdmin) {
      setIsAdminLoginModalOpen(true);
      throw new Error('Se requiere PIN de Administrador para registrar o modificar citas.');
    }

    try {
      if (selectedAppointment && selectedAppointment.id) {
        await api.updateCita(selectedAppointment.id, formData);
        showToast('Cita guardada permanentemente en la nube ☁️');
      } else {
        await api.createCita(formData);
        showToast(`Cita registrada y guardada permanentemente (${formData.horas} hrs) ☁️`);
      }

      // Registrar actualización en el cajetín oficial para el mes correspondiente
      if (formData.fecha) {
        const mKey = String(formData.fecha).slice(0, 7);
        recordMonthUpdate(mKey);
        // Si se cambió de mes al editar, actualizar también el mes anterior
        if (selectedAppointment && selectedAppointment.fecha) {
          const prevMKey = String(selectedAppointment.fecha).slice(0, 7);
          if (prevMKey !== mKey) {
            recordMonthUpdate(prevMKey);
          }
        }
        setMonthUpdatesMap(loadMonthUpdates());
      }

      // Si la cita creada/editada pertenece a otro mes, mover el calendario automáticamente a ese mes
      if (formData.fecha) {
        const [fYear, fMonth] = String(formData.fecha).split('-').map(Number);
        if (fYear && fMonth && (currentDate.getFullYear() !== fYear || (currentDate.getMonth() + 1) !== fMonth)) {
          handleSetCurrentDate(new Date(fYear, fMonth - 1, 1));
        }
      }
      await loadCitas();
      await loadClientes();

      // Si se editó o creó desde las Citas del Día, volver a abrir las citas del día con la información actualizada
      if (lastDayDetails) {
        setSelectedDayDetails(lastDayDetails);
        setLastDayDetails(null);
      }
    } catch (err) {
      if (err.unauthorized) {
        authStorage.clearToken();
        setIsAdmin(false);
        setIsAdminLoginModalOpen(true);
      }
      showToast(err.message || 'Error al guardar cita', 'error');
      throw err;
    }
  };

  const handleDeleteAppointment = async (id) => {
    if (!isAdmin) {
      setIsAdminLoginModalOpen(true);
      throw new Error('Se requiere PIN de Administrador para eliminar citas.');
    }

    try {
      const deletedCita = citas.find(c => c.id === id);
      await api.deleteCita(id);
      showToast('Cita eliminada permanentemente de la base de datos ☁️');

      // Registrar actualización en el cajetín oficial para el mes correspondiente al eliminar
      if (deletedCita && deletedCita.fecha) {
        recordMonthUpdate(String(deletedCita.fecha).slice(0, 7));
        setMonthUpdatesMap(loadMonthUpdates());
      }

      await loadCitas();

      // Si se eliminó desde las Citas del Día, regresar a la vista del día actualizado
      if (lastDayDetails) {
        setSelectedDayDetails(lastDayDetails);
        setLastDayDetails(null);
      }
    } catch (err) {
      if (err.unauthorized) {
        authStorage.clearToken();
        setIsAdmin(false);
        setIsAdminLoginModalOpen(true);
      }
      showToast(err.message || 'Error al eliminar cita', 'error');
      throw err;
    }
  };

  // Handlers para Capacitadores
  const handleSaveCapacitador = async (data, id) => {
    if (!isAdmin) {
      setIsAdminLoginModalOpen(true);
      throw new Error('Se requiere PIN de Administrador para registrar o modificar capacitadores.');
    }

    try {
      if (id) {
        await api.updateCapacitador(id, data);
        showToast('Capacitador guardado permanentemente en la nube ☁️');
      } else {
        await api.createCapacitador(data);
        showToast(`Capacitador [${data.iniciales}] registrado permanentemente en la nube ☁️`);
      }
      await loadCapacitadores();
      await loadCitas();
    } catch (err) {
      if (err.unauthorized) {
        authStorage.clearToken();
        setIsAdmin(false);
        setIsAdminLoginModalOpen(true);
      }
      showToast(err.message || 'Error al guardar capacitador', 'error');
      throw err;
    }
  };

  const handleDeleteCapacitador = async (id) => {
    if (!isAdmin) {
      setIsAdminLoginModalOpen(true);
      throw new Error('Se requiere PIN de Administrador para eliminar o desactivar capacitadores.');
    }

    try {
      await api.deleteCapacitador(id);
      showToast('Capacitador eliminado permanentemente de la base de datos ☁️');
      await loadCapacitadores();
      await loadCitas();
    } catch (err) {
      if (err.unauthorized) {
        authStorage.clearToken();
        setIsAdmin(false);
        setIsAdminLoginModalOpen(true);
      }
      showToast(err.message || 'Error al eliminar capacitador', 'error');
      throw err;
    }
  };

  const handleUpdateCapacitadorPhone = async (id, data) => {
    await api.updateCapacitador(id, data);
    await loadCapacitadores();
  };

  // Handler para WhatsApp
  const handleOpenWhatsApp = (params = {}) => {
    if (params.fromDayDetails) {
      setLastDayDetails(params.fromDayDetails);
      setSelectedDayDetails(null);
    }
    if (params.fromAppointmentModal) {
      setLastAppointmentModal(params.fromAppointmentModal);
      setIsAppointmentModalOpen(false);
    }
    setWhatsAppData({
      cita: params.cita || null,
      date: params.date || getLocalDateString(currentDate),
      capacitadorId: params.capacitadorId || null
    });
    setIsWhatsAppModalOpen(true);
  };

  // Handlers para Clientes
  const handleSaveCliente = async (data, id) => {
    if (!isAdmin) {
      setIsAdminLoginModalOpen(true);
      throw new Error('Se requiere PIN de Administrador para registrar o modificar clientes.');
    }

    try {
      let result;
      if (id) {
        result = await api.updateCliente(id, data);
        showToast('Cliente guardado permanentemente en la nube ☁️');
      } else {
        result = await api.createCliente(data);
        showToast(`Empresa "${data.nombre_empresa}" registrada permanentemente en la nube ☁️`);
      }
      await loadClientes();
      return result;
    } catch (err) {
      if (err.unauthorized) {
        authStorage.clearToken();
        setIsAdmin(false);
        setIsAdminLoginModalOpen(true);
      }
      showToast(err.message || 'Error al guardar cliente', 'error');
      throw err;
    }
  };

  const handleDeleteCliente = async (id) => {
    if (!isAdmin) {
      setIsAdminLoginModalOpen(true);
      throw new Error('Se requiere PIN de Administrador para eliminar o desactivar clientes.');
    }

    try {
      await api.deleteCliente(id);
      showToast('Cliente eliminado permanentemente de la base de datos ☁️');
      await loadClientes();
      await loadCitas();
    } catch (err) {
      if (err.unauthorized) {
        authStorage.clearToken();
        setIsAdmin(false);
        setIsAdminLoginModalOpen(true);
      }
      showToast(err.message || 'Error al eliminar cliente', 'error');
      throw err;
    }
  };

  // Handlers para el Buscador Global (Command Palette)
  const handleSelectCitaFromSearch = (cita) => {
    if (cita && cita.fecha) {
      const [year, month, day] = cita.fecha.split('-').map(Number);
      setCurrentDate(new Date(year, month - 1, day || 1));
    }
    setActiveTab('calendar');
    handleSelectAppointment(cita);
  };

  const handleSelectClienteFromSearch = () => {
    setActiveTab('clients');
  };

  const handleSelectCapacitadorFromSearch = () => {
    setActiveTab('trainers');
  };

  const handleExecuteActionFromSearch = (actionId) => {
    switch (actionId) {
      case 'new-appointment':
        handleOpenNewAppointment();
        break;
      case 'nav-calendar':
        setActiveTab('calendar');
        break;
      case 'nav-reports':
        setActiveTab('reports');
        break;
      case 'nav-fees':
        setActiveTab('fees');
        break;
      case 'nav-portal':
        setActiveTab('portal');
        break;
      case 'nav-trainers':
        setActiveTab('trainers');
        break;
      case 'nav-clients':
        setActiveTab('clients');
        break;
      case 'nav-import':
        setActiveTab('import');
        break;
      case 'open-whatsapp':
        handleOpenWhatsApp();
        break;
      case 'toggle-theme':
        toggleTheme();
        break;
      default:
        break;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/90 dark:bg-[#060913] text-slate-900 dark:text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white transition-colors duration-200 relative overflow-x-hidden">
      
      {/* Fondo ambiental dinámico Liquid Glass */}
      <div className="liquid-canvas" aria-hidden="true">
        <div className="liquid-orb w-[480px] sm:w-[620px] h-[480px] sm:h-[620px] -top-28 -left-24 bg-gradient-to-br from-blue-500/20 via-indigo-500/15 to-cyan-400/15 dark:from-blue-600/25 dark:via-indigo-700/20 dark:to-cyan-500/15" />
        <div className="liquid-orb-2 w-[520px] sm:w-[680px] h-[520px] sm:h-[680px] top-[28%] -right-28 bg-gradient-to-bl from-purple-500/15 via-blue-500/15 to-sky-400/15 dark:from-purple-700/20 dark:via-blue-600/15 dark:to-indigo-500/15" />
        <div className="liquid-orb-3 w-[560px] sm:w-[720px] h-[560px] sm:h-[720px] bottom-[-8%] left-[18%] bg-gradient-to-tr from-emerald-500/12 via-teal-400/10 to-indigo-500/15 dark:from-cyan-700/15 dark:via-indigo-800/15 dark:to-emerald-600/10" />
      </div>

      {/* Toast flotante de cristal líquido */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-glass-hover backdrop-blur-xl border text-xs font-bold transition-all animate-in slide-in-from-bottom-5 duration-200 ${
            toast.type === 'error'
              ? 'bg-rose-50/90 dark:bg-rose-950/80 border-rose-200 dark:border-rose-900/80 text-rose-800 dark:text-rose-200'
              : 'bg-white/85 dark:bg-slate-900/85 border-white/60 dark:border-slate-700/80 text-slate-900 dark:text-white shadow-2xl'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Navbar Superior y Dock Móvil (Oculto en teléfonos Android/iOS en modo Portal para que el capacitador acceda exclusivamente a su itinerario) */}
      {!(activeTab === 'portal' && (isDirectPortalAccess || isMobileDevice) && !isAdmin) && (
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onNewAppointment={() => handleOpenNewAppointment()}
          onOpenSearch={() => setIsCommandPaletteOpen(true)}
          onOpenQrModal={() => setIsQrModalOpen(true)}
          capacitadores={capacitadores}
          isAdmin={isAdmin}
          onOpenAdminLogin={() => setIsAdminLoginModalOpen(true)}
          onLogoutAdmin={handleLogoutAdmin}
          theme={theme}
          onToggleTheme={toggleTheme}
          dbStatus={dbStatus}
          onOpenDbStatus={() => setIsDbStatusModalOpen(true)}
        />
      )}

      {/* Banner de Aviso si la base de datos está desconectada */}
      {dbStatus && !dbStatus.database?.connected && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 text-center text-xs font-semibold text-amber-800 dark:text-amber-200 flex items-center justify-center gap-2">
          <span>⚠️ Modo de Contingencia Local: La base de datos en la nube está temporalmente inaccesible.</span>
          <button onClick={() => setIsDbStatusModalOpen(true)} className="underline hover:opacity-80 cursor-pointer font-bold">Ver detalles</button>
        </div>
      )}

      {/* Contenido Dinámico por Pestaña */}
      <main className={`flex-1 w-full max-w-[1920px] mx-auto flex flex-col relative z-10 ${
        activeTab === 'portal' && (isDirectPortalAccess || isMobileDevice) && !isAdmin
          ? 'p-2 sm:p-4 max-w-full overflow-x-hidden'
          : 'px-2.5 sm:px-4 md:px-5 lg:px-6 xl:px-8 py-2.5 sm:py-4 pb-24 md:pb-6'
      }`}>
        {activeTab === 'calendar' && (
          <CalendarView
            citas={citas}
            capacitadores={capacitadores}
            currentDate={currentDate}
            setCurrentDate={handleSetCurrentDate}
            onSelectCita={handleSelectAppointment}
            onAddCitaDate={handleOpenNewAppointment}
            onOpenWhatsApp={handleOpenWhatsApp}
            selectedDayDetails={selectedDayDetails}
            onSelectDayDetails={setSelectedDayDetails}
            monthUpdatesMap={monthUpdatesMap}
          />
        )}

        {activeTab === 'reports' && (
          <MonthlyReportView
            initialDate={currentDate}
            onBackToCalendar={() => setActiveTab('calendar')}
          />
        )}

        {activeTab === 'fees' && (
          <HonorariosView
            citas={citas}
            capacitadores={capacitadores}
            currentDate={currentDate}
            setCurrentDate={handleSetCurrentDate}
            onSaveCapacitador={handleSaveCapacitador}
            isAdmin={isAdmin}
            onOpenAdminLogin={() => setIsAdminLoginModalOpen(true)}
            onShowToast={showToast}
            onBackToCalendar={() => setActiveTab('calendar')}
            isLoading={isSyncingData && citas.length === 0}
            isSyncing={isSyncingData}
          />
        )}

        {activeTab === 'import' && (
          <ExcelImportView
            capacitadores={capacitadores}
            clientes={clientes}
            isAdmin={isAdmin}
            onOpenAdminLogin={() => setIsAdminLoginModalOpen(true)}
            onBackToCalendar={() => setActiveTab('calendar')}
            onImportSuccess={async (payload) => {
              const result = await api.importarLoteCitas(payload);
              if (payload.mes) {
                recordMonthUpdate(payload.mes);
                setMonthUpdatesMap(loadMonthUpdates());
                const [y, m] = payload.mes.split('-').map(Number);
                if (y && m) {
                  handleSetCurrentDate(new Date(y, m - 1, 1));
                }
              }
              await loadCitas();
              await loadClientes();
              showToast('Lote de citas importado y guardado permanentemente en la nube ☁️');
              return result;
            }}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'portal' && (
          <TrainerPortalView
            initialTrainerCode={urlPortalCode}
            availableTrainers={capacitadores}
            onBackToAdmin={(isDirectPortalAccess || isMobileDevice) && !isAdmin ? null : () => setActiveTab('calendar')}
            theme={theme}
            onToggleTheme={toggleTheme}
            onNotifyAdmin={() => {
              loadCitas();
              showToast('Itinerario y horas sincronizadas con la agenda central 🔄');
            }}
          />
        )}

        {activeTab === 'trainers' && (
          <CapacitadoresView
            capacitadores={capacitadores}
            citas={citas}
            onSaveCapacitador={handleSaveCapacitador}
            onDeleteCapacitador={handleDeleteCapacitador}
            onBackToCalendar={() => setActiveTab('calendar')}
            isLoading={isSyncingData && capacitadores.length === 0}
            isSyncing={isSyncingData}
          />
        )}

        {activeTab === 'clients' && (
          <ClientesView
            clientes={clientes}
            citas={citas}
            onSaveCliente={handleSaveCliente}
            onDeleteCliente={handleDeleteCliente}
            onBackToCalendar={() => setActiveTab('calendar')}
            isLoading={isSyncingData && clientes.length === 0}
            isSyncing={isSyncingData}
          />
        )}
      </main>

      {/* Modal de Agendamiento / Edición de Cita */}
      <AppointmentModal
        isOpen={isAppointmentModalOpen}
        onClose={handleCloseAppointment}
        onBack={handleBackFromAppointment}
        returnToDayDetails={lastDayDetails}
        appointment={selectedAppointment}
        initialDate={modalInitialDate}
        capacitadores={capacitadores}
        clientes={clientes}
        onQuickCreateCliente={handleSaveCliente}
        allCitas={citas}
        onSave={handleSaveAppointment}
        onDelete={handleDeleteAppointment}
        onOpenWhatsApp={handleOpenWhatsApp}
      />

      {/* Modal de Notificaciones WhatsApp */}
      <WhatsAppModal
        isOpen={isWhatsAppModalOpen}
        onClose={handleCloseWhatsApp}
        onBack={handleBackFromWhatsApp}
        returnToSource={lastAppointmentModal ? 'appointment' : (lastDayDetails ? 'day' : null)}
        returnToDayDetails={lastDayDetails}
        capacitadores={capacitadores}
        citas={citas}
        initialCapacitadorId={whatsAppData.capacitadorId}
        initialDate={whatsAppData.date}
        targetCita={whatsAppData.cita}
        onUpdateCapacitadorPhone={handleUpdateCapacitadorPhone}
        onShowToast={showToast}
      />

      {/* Buscador Global Rápido (Command Palette - Ctrl + K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        citas={citas}
        clientes={clientes}
        capacitadores={capacitadores}
        onSelectCita={handleSelectCitaFromSearch}
        onSelectCliente={handleSelectClienteFromSearch}
        onSelectCapacitador={handleSelectCapacitadorFromSearch}
        onExecuteAction={handleExecuteActionFromSearch}
      />

      {/* Modal de Acceso Administrativo (PIN) */}
      <AdminLoginModal
        isOpen={isAdminLoginModalOpen}
        onClose={() => {
          setIsAdminLoginModalOpen(false);
          setPendingAdminAction(null);
        }}
        onSuccess={handleAdminLoginSuccess}
        onShowToast={showToast}
      />

      {/* Modal de Código QR para Celular */}
      <MobileQrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        capacitadores={capacitadores}
        onShowToast={showToast}
      />

      {/* Modal de Estado y Persistencia de Base de Datos */}
      <DbStatusModal
        isOpen={isDbStatusModalOpen}
        onClose={() => setIsDbStatusModalOpen(false)}
        dbStatus={dbStatus}
        onRefresh={loadDbStatus}
      />

      {/* Notificación Flotante Toast */}
      {toast && (
        <div 
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-xl border border-white/20 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 text-xs sm:text-sm font-bold text-white ${
            toast.type === 'error'
              ? 'bg-rose-600/90 shadow-rose-600/20'
              : toast.type === 'info'
              ? 'bg-blue-600/90 shadow-blue-600/20'
              : 'bg-emerald-600/90 shadow-emerald-600/20'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-5 h-5 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
