import React, { useState, useRef, useEffect } from 'react';
import { 
  Calendar, 
  BarChart3, 
  Users, 
  Building2, 
  Plus, 
  Search, 
  Shield, 
  Lock, 
  LogOut, 
  Banknote, 
  Sun, 
  Moon, 
  Smartphone, 
  QrCode, 
  FileSpreadsheet, 
  Database, 
  Download, 
  Trash2,
  SlidersHorizontal,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

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
  onToggleTheme,
  dbStatus = null,
  onOpenDbStatus,
  onOpenBackupModal,
  onOpenDeletedModal,
  deletedCount = 0
}) {
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const toolsRef = useRef(null);
  const navRef = useRef(null);

  // Cerrar menú de herramientas al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(e) {
      if (toolsRef.current && !toolsRef.current.contains(e.target)) {
        setIsToolsOpen(false);
      }
    }
    if (isToolsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isToolsOpen]);

  // Desplazamiento suave para pestañas si la pantalla es reducida
  const scrollNav = (direction) => {
    if (navRef.current) {
      navRef.current.scrollBy({
        left: direction === 'left' ? -180 : 180,
        behavior: 'smooth'
      });
    }
  };

  const tabs = [
    { id: 'calendar', label: 'Calendario', shortLabel: 'Agenda', mobileLabel: 'Agenda', icon: Calendar },
    { id: 'reports', label: 'Reporte Horas', shortLabel: 'Horas', mobileLabel: 'Horas', icon: BarChart3 },
    { id: 'fees', label: 'Honorarios', shortLabel: 'Honorarios', mobileLabel: 'Cobros', icon: Banknote },
    { id: 'trainers', label: 'Capacitadores', shortLabel: 'Equipo', mobileLabel: 'Equipo', icon: Users },
    { id: 'clients', label: 'Clientes', shortLabel: 'Clientes', mobileLabel: 'Clientes', icon: Building2 },
    { id: 'import', label: 'Importar Excel', shortLabel: 'Importar', mobileLabel: 'Excel', icon: FileSpreadsheet },
    { id: 'portal', label: 'Portal Móvil', shortLabel: 'Portal', mobileLabel: 'Móvil', icon: Smartphone }
  ];

  const isDbConnected = dbStatus?.database?.connected;

  return (
    <>
      {/* HEADER SUPERIOR */}
      <header className="sticky top-0 z-40 glass-nav transition-all duration-200 no-print">
        <div className="w-full max-w-[1920px] mx-auto px-2.5 sm:px-4 md:px-5 lg:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
            
            {/* 1. Logo & Identidad AD-RE-11 */}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white dark:bg-slate-800 p-0.5 flex items-center justify-center shadow-md sm:shadow-lg border border-slate-200/80 dark:border-white/15 shrink-0 overflow-hidden">
                <img 
                  src="/logo-one.png" 
                  alt="ONE Consulting" 
                  className="w-full h-full object-contain" 
                />
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="font-extrabold text-base sm:text-lg bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-900 dark:from-white dark:via-slate-100 dark:to-blue-200 bg-clip-text text-transparent tracking-tight">
                    Agenda One
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-extrabold tracking-wider bg-blue-500/10 dark:bg-blue-400/10 text-blue-700 dark:text-blue-300 px-1.5 sm:px-2 py-0.5 rounded-full border border-blue-300/40 dark:border-blue-500/20 uppercase shadow-2xs backdrop-blur-xs">
                    AD-RE-11
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Pestañas de Navegación Principal (NUNCA se cortan y caben cómodamente) */}
            <div className="hidden md:flex items-center flex-1 justify-center max-w-4xl px-2 min-w-0">
              <nav 
                ref={navRef}
                className="flex items-center gap-0.5 lg:gap-1 bg-slate-200/50 dark:bg-slate-900/60 p-1 rounded-2xl border border-slate-200/60 dark:border-white/5 backdrop-blur-md transition-all overflow-x-auto no-scrollbar scroll-smooth"
              >
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      title={tab.label}
                      className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 rounded-xl text-xs lg:text-sm font-medium transition-all duration-200 cursor-pointer shrink-0 whitespace-nowrap ${
                        isActive
                          ? 'bg-white/95 dark:bg-slate-800/90 text-blue-600 dark:text-blue-400 shadow-glass-sm font-bold border border-white/90 dark:border-white/10'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-white/40 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400 scale-105' : 'text-slate-500 dark:text-slate-400'}`} />
                      <span className="hidden xl:inline">{tab.label}</span>
                      <span className="hidden md:inline xl:hidden">{tab.shortLabel}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* 3. Botonera de Acciones (Optimizada y compacta para no saturar el espacio) */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              
              {/* Buscador Rápido Global (Ctrl + K) */}
              <button
                onClick={onOpenSearch}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200/70 dark:border-white/10 bg-white/60 dark:bg-slate-800/60 hover:bg-white/90 dark:hover:bg-slate-800/90 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-medium transition-all shadow-glass-sm cursor-pointer backdrop-blur-md"
                title="Buscador global (Ctrl + K)"
              >
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden xl:inline text-slate-400">Buscar</span>
                <kbd className="hidden 2xl:inline-flex items-center gap-0.5 text-[9px] font-bold text-slate-400 dark:text-slate-400 bg-slate-100/90 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1 py-0.5 rounded">
                  Ctrl K
                </kbd>
              </button>

              {/* Menú Desplegable de Herramientas y Seguridad (Respaldos, Papelera, DB, QR, Tema) */}
              <div className="relative" ref={toolsRef}>
                <button
                  type="button"
                  onClick={() => setIsToolsOpen(prev => !prev)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-glass-sm backdrop-blur-md cursor-pointer shrink-0 ${
                    deletedCount > 0
                      ? 'border-amber-300 dark:border-amber-700 bg-amber-50/80 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300'
                      : 'border-slate-200/70 dark:border-white/10 bg-white/60 dark:bg-slate-800/60 hover:bg-white/90 dark:hover:bg-slate-800/90 text-slate-700 dark:text-slate-200'
                  }`}
                  title="Herramientas de seguridad, respaldos y configuración"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="hidden sm:inline">Herramientas</span>
                  {deletedCount > 0 && (
                    <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px] font-black animate-pulse">
                      {deletedCount}
                    </span>
                  )}
                  <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isToolsOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Popover / Menú Desplegable Flotante */}
                {isToolsOpen && (
                  <div className="absolute right-0 mt-2 w-72 glass-panel bg-white/95 dark:bg-slate-900/95 rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl">
                    <div className="px-3 py-2 text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-white/5">
                      Herramientas del Sistema
                    </div>

                    <div className="py-1 space-y-1">
                      {/* 1. Respaldos */}
                      {onOpenBackupModal && (
                        <button
                          onClick={() => {
                            setIsToolsOpen(false);
                            onOpenBackupModal();
                          }}
                          className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                              <Download className="w-3.5 h-3.5" />
                            </div>
                            <div className="text-left">
                              <div className="font-bold">Copias de Seguridad</div>
                              <div className="text-[10px] text-slate-400 font-normal">Descargar o restaurar JSON</div>
                            </div>
                          </div>
                        </button>
                      )}

                      {/* 2. Papelera de Citas */}
                      {onOpenDeletedModal && (
                        <button
                          onClick={() => {
                            setIsToolsOpen(false);
                            onOpenDeletedModal();
                          }}
                          className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-950/50 hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                              <Trash2 className="w-3.5 h-3.5" />
                            </div>
                            <div className="text-left">
                              <div className="font-bold">Papelera de Citas</div>
                              <div className="text-[10px] text-slate-400 font-normal">Restaurar citas borradas (1-clic)</div>
                            </div>
                          </div>
                          {deletedCount > 0 && (
                            <span className="px-2 py-0.5 bg-amber-500 text-white rounded-full text-[10px] font-black">
                              {deletedCount}
                            </span>
                          )}
                        </button>
                      )}

                      {/* 3. Estado de la Base de Datos */}
                      {onOpenDbStatus && (
                        <button
                          onClick={() => {
                            setIsToolsOpen(false);
                            onOpenDbStatus();
                          }}
                          className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                              isDbConnected 
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400' 
                                : 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                            }`}>
                              <Database className="w-3.5 h-3.5" />
                            </div>
                            <div className="text-left">
                              <div className="font-bold">Base de Datos</div>
                              <div className="text-[10px] text-slate-400 font-normal">
                                {isDbConnected ? 'Conectada a Supabase' : 'Modo Contingencia'}
                              </div>
                            </div>
                          </div>
                          <span className={`w-2 h-2 rounded-full ${isDbConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        </button>
                      )}

                      {/* 4. QR Móvil */}
                      {onOpenQrModal && (
                        <button
                          onClick={() => {
                            setIsToolsOpen(false);
                            onOpenQrModal();
                          }}
                          className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                              <QrCode className="w-3.5 h-3.5" />
                            </div>
                            <div className="text-left">
                              <div className="font-bold">Portal en Celular (QR)</div>
                              <div className="text-[10px] text-slate-400 font-normal">Escanear para abrir en móvil</div>
                            </div>
                          </div>
                        </button>
                      )}

                      {/* 5. Tema Oscuro / Claro */}
                      <button
                        onClick={() => {
                          onToggleTheme();
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-amber-500 flex items-center justify-center">
                            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5 text-slate-700" />}
                          </div>
                          <div className="text-left">
                            <div className="font-bold">Modo de Pantalla</div>
                            <div className="text-[10px] text-slate-400 font-normal">
                              {theme === 'dark' ? 'Cambiar a modo Claro' : 'Cambiar a modo Oscuro'}
                            </div>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Control de Modo Administrador */}
              {isAdmin ? (
                <div 
                  className="flex items-center gap-1 sm:gap-1.5 bg-emerald-50/80 dark:bg-emerald-950/60 border border-emerald-300/60 dark:border-emerald-700/60 px-2 sm:px-2.5 py-1.5 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-bold shadow-glass-sm backdrop-blur-md animate-in fade-in duration-150 shrink-0"
                  title="Sesión de Administrador activa (30 días)"
                >
                  <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                  <span className="hidden sm:inline">Admin</span>
                  <button
                    type="button"
                    onClick={onLogoutAdmin}
                    title="Cerrar sesión de Administrador"
                    className="p-0.5 hover:bg-emerald-200/70 dark:hover:bg-emerald-900/80 rounded-md text-emerald-700 dark:text-emerald-300 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onOpenAdminLogin}
                  title="Acceso Administrador"
                  className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl border border-slate-200/70 dark:border-white/10 bg-white/60 dark:bg-slate-800/60 hover:bg-blue-50/80 dark:hover:bg-blue-950/50 text-slate-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400 text-xs font-semibold transition-all shadow-glass-sm backdrop-blur-md cursor-pointer shrink-0"
                >
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden sm:inline">Admin</span>
                </button>
              )}

              {/* Botón Nueva Cita - Prominente y Siempre Accesible */}
              <button
                onClick={onNewAppointment}
                className="inline-flex items-center gap-1.5 sm:gap-2 liquid-btn-primary px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all transform active:scale-95 cursor-pointer shrink-0 whitespace-nowrap"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span className="hidden sm:inline">Nueva Cita</span>
                <span className="sm:hidden">Cita</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* DOCK FLOTANTE DE NAVEGACIÓN MÓVIL (< md) */}
      <nav 
        aria-label="Navegación Móvil"
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden glass-nav border-t border-slate-200/80 dark:border-white/10 backdrop-blur-2xl shadow-2xl pb-safe transition-all duration-200 no-print bg-white/95 dark:bg-[#080d1a]/95"
      >
        <div className="grid grid-cols-5 items-center px-1 py-1.5 max-w-md mx-auto">
          {tabs.slice(0, 4).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center py-1 px-0.5 rounded-xl transition-all cursor-pointer relative group ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400 font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {isActive && (
                  <span className="absolute top-0 w-6 h-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full shadow-xs" />
                )}
                <div className={`p-1 rounded-lg transition-transform ${isActive ? 'scale-110 bg-blue-50 dark:bg-blue-950/60' : ''}`}>
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`} />
                </div>
                <span className="text-[9px] font-semibold tracking-tighter truncate w-full text-center leading-tight mt-0.5">
                  {tab.mobileLabel || tab.shortLabel}
                </span>
              </button>
            );
          })}

          {/* Botón Más / Herramientas en móvil */}
          <button
            onClick={() => setIsToolsOpen(prev => !prev)}
            className={`flex flex-col items-center justify-center py-1 px-0.5 rounded-xl transition-all cursor-pointer relative ${
              isToolsOpen
                ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <div className="p-1 rounded-lg">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <span className="text-[9px] font-semibold tracking-tighter truncate w-full text-center leading-tight mt-0.5">
              Más
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}
