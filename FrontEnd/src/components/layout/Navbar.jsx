import React from 'react';
import { Calendar, BarChart3, Users, Building2, Plus } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onNewAppointment, capacitadores = [] }) {
  const tabs = [
    { id: 'calendar', label: 'Calendario', icon: Calendar },
    { id: 'reports', label: 'Reporte de Horas', icon: BarChart3 },
    { id: 'trainers', label: 'Capacitadores', icon: Users },
    { id: 'clients', label: 'Clientes', icon: Building2 },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Marca */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">Agenda One</span>
                <span className="text-[10px] font-semibold tracking-wider bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200 uppercase">
                  AD-RE-11
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Control Centralizado de Horas y Capacitaciones</p>
            </div>
          </div>

          {/* Navegación por pestañas */}
          <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-white text-blue-700 shadow-sm font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
                  <span className="hidden md:inline">{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Acciones principales */}
          <div className="flex items-center gap-3">
            <button
              onClick={onNewAppointment}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-md shadow-blue-500/25 transition-all transform active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Nueva Cita</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
