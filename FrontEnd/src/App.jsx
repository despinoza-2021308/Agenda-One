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
import { api, authStorage } from './services/api';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  // Detección inicial de acceso directo por URL (ej. ?portal=MO)
  const initialPortalParam = (() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const p = params.get('portal');
      if (p) return p.trim().toUpperCase();
      if (window.location.hash && window.location.hash.toLowerCase().includes('portal')) {
        const parts = window.location.hash.split(/[-/=]/);
        return parts[parts.length - 1] ? parts[parts.length - 1].trim().toUpperCase() : null;
      }
    } catch (_) {}
    return null;
  })();

  const [activeTab, setActiveTab] = useState(() => initialPortalParam ? 'portal' : 'calendar'); // 'calendar' | 'reports' | 'fees' | 'portal' | 'trainers' | 'clients'
  const [urlPortalCode, setUrlPortalCode] = useState(initialPortalParam);
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

  // Verificar validez del token en backend al cargar la app
  useEffect(() => {
    const token = authStorage.getToken();
    if (token) {
      api.verifyAdmin()
        .then(() => setIsAdmin(true))
        .catch(() => {
          authStorage.clearToken();
          setIsAdmin(false);
        });
    }
  }, []);

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
  const handleOpenNewAppointment = (dateString = null, prefill = null) => {
    if (!isAdmin) {
      setPendingAdminAction(() => () => handleOpenNewAppointment(dateString, prefill));
      setIsAdminLoginModalOpen(true);
      return;
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

  const handleSelectAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setModalInitialDate(appointment.fecha);
    setIsAppointmentModalOpen(true);
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
      await loadCitas();
      await loadClientes();
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white transition-colors duration-200">
      
      {/* Toast flotante */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold transition-all animate-in slide-in-from-bottom-5 duration-200 ${
            toast.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/80 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200'
              : 'bg-slate-900 dark:bg-slate-800 border-slate-800 dark:border-slate-700 text-white shadow-slate-950/20'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-500" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Navbar Superior */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNewAppointment={() => handleOpenNewAppointment()}
        onOpenSearch={() => setIsCommandPaletteOpen(true)}
        capacitadores={capacitadores}
        isAdmin={isAdmin}
        onOpenAdminLogin={() => setIsAdminLoginModalOpen(true)}
        onLogoutAdmin={handleLogoutAdmin}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Contenido Dinámico por Pestaña */}
      <main className="flex-1 w-full px-3 sm:px-6 lg:px-8 xl:px-10 py-4 sm:py-6 flex flex-col">
        {activeTab === 'calendar' && (
          <CalendarView
            citas={citas}
            capacitadores={capacitadores}
            currentDate={currentDate}
            setCurrentDate={setCurrentDate}
            onSelectCita={handleSelectAppointment}
            onAddCitaDate={handleOpenNewAppointment}
            onOpenWhatsApp={handleOpenWhatsApp}
          />
        )}

        {activeTab === 'reports' && (
          <MonthlyReportView
            initialDate={currentDate}
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
          />
        )}

        {activeTab === 'portal' && (
          <TrainerPortalView
            initialTrainerCode={urlPortalCode}
            availableTrainers={capacitadores}
            onBackToAdmin={() => setActiveTab('calendar')}
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
          />
        )}

        {activeTab === 'clients' && (
          <ClientesView
            clientes={clientes}
            citas={citas}
            onSaveCliente={handleSaveCliente}
            onDeleteCliente={handleDeleteCliente}
          />
        )}
      </main>

      {/* Modal de Agendamiento / Edición de Cita */}
      <AppointmentModal
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
        appointment={selectedAppointment}
        initialDate={modalInitialDate}
        capacitadores={capacitadores}
        clientes={clientes}
        onQuickCreateCliente={handleSaveCliente}
        allCitas={citas}
        onSave={handleSaveAppointment}
        onDelete={handleDeleteAppointment}
      />

      {/* Modal de Notificaciones WhatsApp */}
      <WhatsAppModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
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
    </div>
  );
}
