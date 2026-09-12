import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/layout/Navbar';
import CalendarView from './components/calendar/CalendarView';
import MonthlyReportView from './components/reports/MonthlyReportView';
import CapacitadoresView from './components/catalogs/CapacitadoresView';
import ClientesView from './components/catalogs/ClientesView';
import AppointmentModal from './components/appointments/AppointmentModal';
import WhatsAppModal from './components/whatsapp/WhatsAppModal';
import { api } from './services/api';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('calendar'); // 'calendar' | 'reports' | 'trainers' | 'clients'
  const [currentDate, setCurrentDate] = useState(new Date(2026, 8, 9)); // Septiembre 2026

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

  // Notificaciones Toast
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

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

  // Handlers para Citas
  const handleOpenNewAppointment = (dateString = null) => {
    setSelectedAppointment(null);
    setModalInitialDate(dateString || currentDate.toISOString().split('T')[0]);
    setIsAppointmentModalOpen(true);
  };

  const handleSelectAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setModalInitialDate(appointment.fecha);
    setIsAppointmentModalOpen(true);
  };

  const handleSaveAppointment = async (formData) => {
    try {
      if (selectedAppointment) {
        await api.updateCita(selectedAppointment.id, formData);
        showToast('Cita actualizada correctamente.');
      } else {
        await api.createCita(formData);
        showToast(`Cita registrada con éxito (${formData.horas} hrs).`);
      }
      await loadCitas();
      // Recargar clientes por si se creó uno nuevo o cambió
      await loadClientes();
    } catch (err) {
      showToast(err.message || 'Error al guardar cita', 'error');
      throw err;
    }
  };

  const handleDeleteAppointment = async (id) => {
    try {
      await api.deleteCita(id);
      showToast('Cita eliminada de la agenda.');
      await loadCitas();
    } catch (err) {
      showToast(err.message || 'Error al eliminar cita', 'error');
      throw err;
    }
  };

  // Handlers para Capacitadores
  const handleSaveCapacitador = async (data, id) => {
    if (id) {
      await api.updateCapacitador(id, data);
      showToast('Capacitador actualizado correctamente.');
    } else {
      await api.createCapacitador(data);
      showToast(`Capacitador registrado con código [${data.iniciales}].`);
    }
    await loadCapacitadores();
    await loadCitas();
  };

  const handleDeleteCapacitador = async (id) => {
    await api.deleteCapacitador(id);
    showToast('Capacitador actualizado/eliminado.');
    await loadCapacitadores();
    await loadCitas();
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
      showToast(err.message || 'Error al guardar cliente', 'error');
      throw err;
    }
  };

  const handleDeleteCliente = async (id) => {
    try {
      await api.deleteCliente(id);
      showToast('Cliente eliminado del catálogo.');
      await loadClientes();
      await loadCitas();
    } catch (err) {
      showToast(err.message || 'Error al eliminar cliente', 'error');
      throw err;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-blue-600 selection:text-white">
      
      {/* Toast flotante */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold transition-all animate-in slide-in-from-bottom-5 duration-200 ${
            toast.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-slate-900 border-slate-800 text-white shadow-slate-950/20'
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
        capacitadores={capacitadores}
      />

      {/* Contenido Dinámico por Pestaña */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
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

        {activeTab === 'trainers' && (
          <CapacitadoresView
            capacitadores={capacitadores}
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
    </div>
  );
}
