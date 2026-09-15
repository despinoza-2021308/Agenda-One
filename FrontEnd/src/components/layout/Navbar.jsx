import React from 'react';
import { Calendar, BarChart3, Users, Building2, Plus, Search, Shield, Lock, LogOut, Banknote, Sun, Moon, Smartphone, QrCode } from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  onNewAppointment, 
  onOpenSearch, 
  onOpenQrModal,
  capacitadores = [],
  isAdmin = false,
  onOpenAdminLogin,
  onLogoutAdmin,
  theme = 'light',
  onToggleTheme
}) {
  const tabs = [
    { id: 'calendar', label: 'Calendario', icon: Calendar },
    { id: 'reports', label: 'Reporte de Horas', icon: BarChart3 },
    { id: 'fees', label: 'Honorarios', icon: Banknote },
    { id: 'portal', label: 'Portal Móvil', icon: Smartphone },
    { id: 'trainers', label: 'Capacitadores', icon: Users },
    { id: 'clients', label: 'Clientes', icon: Building2 },
  ];

  return (
    <header className="sticky top-0 z-40 glass-nav transition-all duration-200 no-print">
      <div className="w-full px-3 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Marca */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 border border-white/30 dark:border-white/15">
              <Calendar className="w-5 h-5 drop-shadow-xs" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-900 dark:from-white dark:via-slate-100 dark:to-blue-200 bg-clip-text text-transparent tracking-tight">
                  Agenda One
                </span>
                <span className="text-[10px] font-extrabold tracking-wider bg-blue-500/10 dark:bg-blue-400/10 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full border border-blue-300/40 dark:border-blue-500/20 uppercase shadow-2xs backdrop-blur-xs">
                  AD-RE-11
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block font-medium">Control Centralizado de Horas y Capacitaciones</p>
            </div>
          </div>

          {/* Navegación por pestañas */}
          <nav className="flex items-center gap-1 bg-slate-200/50 dark:bg-slate-900/60 p-1 rounded-2xl border border-slate-200/60 dark:border-white/5 backdrop-blur-md transition-all">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-white/95 dark:bg-slate-800/90 text-blue-600 dark:text-blue-400 shadow-glass-sm font-bold border border-white/90 dark:border-white/10'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-white/40 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-transform ${isActive ? 'text-blue-600 dark:text-blue-400 scale-105' : 'text-slate-500 dark:text-slate-400'}`} />
                  <span className="hidden md:inline">{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Acciones principales */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Buscador Rápido Global (Ctrl + K) */}
            <button
              onClick={onOpenSearch}
              className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200/70 dark:border-white/10 bg-white/60 dark:bg-slate-800/60 hover:bg-white/90 dark:hover:bg-slate-800/90 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-medium transition-all shadow-glass-sm group cursor-pointer backdrop-blur-md"
              title="Abrir buscador global (Ctrl + K)"
            >
              <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
              <span className="text-slate-400 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200">Buscar...</span>
              <kbd className="inline-flex items-center gap-0.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100/90 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded-md shadow-2xs">
                <span>Ctrl</span>
                <span>K</span>
              </kbd>
            </button>

            {/* Botón de búsqueda compacto para móviles */}
            <button
              onClick={onOpenSearch}
              className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800/80 border border-slate-200/70 dark:border-white/10 shadow-glass-sm transition-all cursor-pointer backdrop-blur-md"
              title="Buscar (Ctrl + K)"
            >
              <Search className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </button>

            {/* Botón Abrir en Celular (Código QR) */}
            {onOpenQrModal && (
              <button
                type="button"
                onClick={onOpenQrModal}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200/70 dark:border-blue-800/60 bg-blue-50/70 dark:bg-blue-950/40 hover:bg-blue-100/80 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold transition-all shadow-glass-sm cursor-pointer backdrop-blur-md"
                title="Escanear código QR para abrir el portal en tu celular"
              >
                <QrCode className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span className="hidden lg:inline">Ver en Celular</span>
                <span className="lg:hidden">QR</span>
              </button>
            )}

            {/* Conmutador de Modo Oscuro / Claro */}
            <button
              type="button"
              onClick={onToggleTheme}
              className="p-2 rounded-xl border border-slate-200/70 dark:border-white/10 bg-white/60 dark:bg-slate-800/60 hover:bg-white/90 dark:hover:bg-slate-800/90 text-slate-600 dark:text-amber-400 transition-all cursor-pointer shadow-glass-sm backdrop-blur-md active:scale-95"
              title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              aria-label="Alternar modo oscuro"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400 transition-transform" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600 hover:text-indigo-600 transition-transform" />
              )}
            </button>

            {/* Control de Modo Administrador */}
            {isAdmin ? (
              <div 
                className="flex items-center gap-1.5 bg-emerald-50/80 dark:bg-emerald-950/60 border border-emerald-300/60 dark:border-emerald-700/60 px-2.5 py-1.5 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-bold shadow-glass-sm backdrop-blur-md animate-in fade-in duration-150"
                title="Modo Administrador activo: Tienes permisos completos de agendamiento y edición"
              >
                <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                <span className="hidden sm:inline">Admin</span>
                <button
                  type="button"
                  onClick={onLogoutAdmin}
                  title="Cerrar sesión de Administrador (volver a modo lectura)"
                  className="ml-0.5 p-1 hover:bg-emerald-200/70 dark:hover:bg-emerald-900/80 rounded-md text-emerald-700 dark:text-emerald-300 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenAdminLogin}
                title="Iniciar sesión como Administrador para habilitar creación y edición"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/70 dark:border-white/10 bg-white/60 dark:bg-slate-800/60 hover:bg-blue-50/80 dark:hover:bg-blue-950/50 hover:border-blue-300 dark:hover:border-blue-700 text-slate-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400 text-xs font-semibold transition-all shadow-glass-sm backdrop-blur-md cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Acceso Admin</span>
              </button>
            )}

            {/* Botón Nueva Cita */}
            <button
              onClick={onNewAppointment}
              className="inline-flex items-center gap-2 liquid-btn-primary px-3.5 sm:px-4 py-2 rounded-xl text-sm font-bold shadow-md transition-all transform active:scale-95 cursor-pointer"
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
