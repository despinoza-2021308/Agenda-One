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
import { api, authStorage } from './services/api';
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

  // Si se abre desde enlace directo QR (?portal), mostrar el Portal Móvil; de lo contrario, Calendario por defecto para todos los dispositivos
  const [activeTab, setActiveTab] = useState(() => {
    if (isDirectPortalAccess) return 'portal';
    return 'calendar';
  }); // 'calendar' | 'reports' | 'fees' | 'portal' | 'trainers' | 'clients'

  const [urlPortalCode, setUrlPortalCode] = useState(initialPortalParam);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date(2026, 8, 9)); // Septiembre 2026

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

  // Catálogos y Citas
  const [capacitadores, setCapacitadores] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [citas, setCitas] = useState([]);

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

  // Auto-cierre de sesión administrativa por inactividad (15 min) para evitar dejarla abierta
  useEffect(() => {
    if (!isAdmin) return;

    let timeoutId;
    const INACTIVITY_LIMIT_MS = 15 * 60 * 1000; // 15 minutos

    const resetInactivityTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        authStorage.clearToken();
        setIsAdmin(false);
        showToast('Sesión administrativa cerrada por inactividad (15 min) 🔒', 'info');
      }, INACTIVITY_LIMIT_MS);
    };

    const userActivityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    userActivityEvents.forEach((evt) => window.addEventListener(evt, resetInactivityTimer, { passive: true }));
    resetInactivityTimer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      userActivityEvents.forEach((evt) => window.removeEventListener(evt, resetInactivityTimer));
    };
  }, [isAdmin]);

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

  // Cargar capacitadores
  const loadCapacitadores = useCallback(async () => {
    try {
      const capsData = await api.getCapacitadores();
      setCapacitadores(capsData);
    } catch (err) {
      console.error('Error al cargar capacitadores:', err);
    }
  }, []);

  // Cargar catálogo de clientes
  const loadClientes = useCallback(async () => {
    try {
      const clientsData = await api.getClientes();
      setClientes(clientsData);
    } catch (err) {
      console.error('Error al cargar clientes:', err);
    }
  }, []);

  // Cargar citas del mes
  const loadCitas = useCallback(async () => {
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const citasData = await api.getCitas({ year, month });
      setCitas(citasData);
    } catch (err) {
      console.error('Error al cargar citas:', err);
    }
  }, [currentDate]);

  useEffect(() => {
    loadCapacitadores();
    loadClientes();
  }, [loadCapacitadores, loadClientes]);

  useEffect(() => {
    loadCitas();
  }, [loadCitas]);

  // Gestor para ejecutar acciones tras autenticación exitosa
  const handleAdminLoginSuccess = () => {
    setIsAdmin(true);
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
        fecha: dateString || currentDate.toISOString().split('T')[0]
      });
    } else {
      setSelectedAppointment(null);
    }
    setModalInitialDate(dateString || currentDate.toISOString().split('T')[0]);
    setIsAppointmentModalOpen(true);
  };

  const handleSelectAppointment = (appointment, fromDay = null) => {
    if (fromDay) {
      setLastDayDetails(fromDay);
      setSelectedDayDetails(null);
    }
    setSelectedAppointment(appointment);
    setModalInitialDate(appointment?.fecha || currentDate.toISOString().split('T')[0]);
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
        showToast('Cita actualizada correctamente.');
      } else {
        await api.createCita(formData);
        showToast(`Cita registrada con éxito (${formData.horas} hrs).`);
      }

      // Si la cita creada/editada pertenece a otro mes, mover el calendario automáticamente a ese mes
      if (formData.fecha) {
        const [fYear, fMonth] = String(formData.fecha).split('-').map(Number);
        if (fYear && fMonth && (currentDate.getFullYear() !== fYear || (currentDate.getMonth() + 1) !== fMonth)) {
          setCurrentDate(new Date(fYear, fMonth - 1, 1));
        } else {
          await loadCitas();
        }
      } else {
        await loadCitas();
      }
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
      await api.deleteCita(id);
      showToast('Cita eliminada de la agenda.');
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
        showToast('Capacitador actualizado correctamente.');
      } else {
        await api.createCapacitador(data);
        showToast(`Capacitador registrado con código [${data.iniciales}].`);
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
      showToast('Capacitador actualizado/eliminado.');
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
      date: params.date || currentDate.toISOString().split('T')[0],
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
        showToast('Cliente actualizado correctamente.');
      } else {
        result = await api.createCliente(data);
        showToast(`Empresa "${data.nombre_empresa}" registrada con éxito.`);
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
      showToast('Cliente actualizado/eliminado.');
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

      {/* Navbar Superior y Dock Móvil (Oculto solo si es acceso directo por QR exclusivo para capacitador) */}
      {!isDirectPortalAccess && (
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
        />
      )}

      {/* Contenido Dinámico por Pestaña */}
      <main className={`flex-1 w-full max-w-[1920px] mx-auto flex flex-col relative z-10 ${
        activeTab === 'portal' && isDirectPortalAccess
          ? 'p-2 sm:p-4 max-w-full overflow-x-hidden'
          : 'px-2.5 sm:px-4 md:px-6 lg:px-8 xl:px-10 py-3 sm:py-6 pb-24 md:pb-6'
      }`}>
        {activeTab === 'calendar' && (
          <CalendarView
            citas={citas}
            capacitadores={capacitadores}
            currentDate={currentDate}
            setCurrentDate={setCurrentDate}
            onSelectCita={handleSelectAppointment}
            onAddCitaDate={handleOpenNewAppointment}
            onOpenWhatsApp={handleOpenWhatsApp}
            selectedDayDetails={selectedDayDetails}
            onSelectDayDetails={setSelectedDayDetails}
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
            setCurrentDate={setCurrentDate}
            onSaveCapacitador={handleSaveCapacitador}
            isAdmin={isAdmin}
            onOpenAdminLogin={() => setIsAdminLoginModalOpen(true)}
            onShowToast={showToast}
            onBackToCalendar={() => setActiveTab('calendar')}
          />
        )}

        {activeTab === 'portal' && (
          <TrainerPortalView
            initialTrainerCode={urlPortalCode}
            availableTrainers={capacitadores}
            onBackToAdmin={(isDirectPortalAccess || isMobileInitial) ? null : () => setActiveTab('calendar')}
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
          />
        )}

        {activeTab === 'clients' && (
          <ClientesView
            clientes={clientes}
            citas={citas}
            onSaveCliente={handleSaveCliente}
            onDeleteCliente={handleDeleteCliente}
            onBackToCalendar={() => setActiveTab('calendar')}
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
    </div>
  );
}
