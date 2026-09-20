import React from 'react';
import { Calendar, BarChart3, Users, Building2, Plus, Search, Shield, Lock, LogOut, Banknote, Sun, Moon, Smartphone, QrCode, FileSpreadsheet, Database, Download, Trash2 } from 'lucide-react';

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
  const tabs = [
    { id: 'calendar', label: 'Calendario', shortLabel: 'Agenda', mobileLabel: 'Agenda', icon: Calendar },
    { id: 'reports', label: 'Reporte Horas', shortLabel: 'Reportes', mobileLabel: 'Horas', icon: BarChart3 },
    { id: 'fees', label: 'Honorarios', shortLabel: 'Honorarios', mobileLabel: 'Cobros', icon: Banknote },
    { id: 'import', label: 'Importar Excel', shortLabel: 'Importar', mobileLabel: 'Excel', icon: FileSpreadsheet },
    { id: 'portal', label: 'Portal Móvil', shortLabel: 'Portal', mobileLabel: 'Móvil', icon: Smartphone },
    { id: 'trainers', label: 'Capacitadores', shortLabel: 'Equipo', mobileLabel: 'Equipo', icon: Users },
    { id: 'clients', label: 'Clientes', shortLabel: 'Clientes', mobileLabel: 'Clientes', icon: Building2 },
  ];

  return (
    <>
      {/* HEADER SUPERIOR RESPONSIVO */}
      <header className="sticky top-0 z-40 glass-nav transition-all duration-200 no-print">
        <div className="w-full max-w-[1920px] mx-auto px-2.5 sm:px-4 md:px-5 lg:px-6 xl:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
            
            {/* Logo & Marca */}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white dark:bg-slate-800 p-0.5 flex items-center justify-center shadow-md sm:shadow-lg border border-slate-200/80 dark:border-white/15 shrink-0 overflow-hidden">
                <img 
                  src="/logo-one.png" 
                  alt="ONE Consulting" 
                  className="w-full h-full object-contain" 
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="font-extrabold text-base sm:text-lg bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-900 dark:from-white dark:via-slate-100 dark:to-blue-200 bg-clip-text text-transparent tracking-tight">
                    Agenda One
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-extrabold tracking-wider bg-blue-500/10 dark:bg-blue-400/10 text-blue-700 dark:text-blue-300 px-1.5 sm:px-2 py-0.5 rounded-full border border-blue-300/40 dark:border-blue-500/20 uppercase shadow-2xs backdrop-blur-xs">
                    AD-RE-11
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden 2xl:block font-medium">Control Centralizado de Horas y Capacitaciones</p>
              </div>
            </div>

            {/* Navegación por pestañas (Optimizada para laptops, tablets y pantallas panorámicas) */}
            <nav className="hidden md:flex items-center gap-0.5 lg:gap-1 bg-slate-200/50 dark:bg-slate-900/60 p-1 rounded-2xl border border-slate-200/60 dark:border-white/5 backdrop-blur-md transition-all min-w-0 max-w-full overflow-x-auto no-scrollbar">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    title={tab.label}
                    className={`flex items-center gap-1.5 px-2 lg:px-2.5 xl:px-3 py-1.5 rounded-xl text-xs xl:text-sm font-medium transition-all duration-200 cursor-pointer shrink-0 whitespace-nowrap ${
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

            {/* Acciones principales del Header (Garantizado que NUNCA se cortan en pantallas de laptop) */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              {/* Buscador Rápido Global (Ctrl + K) - Desktop 2XL */}
              <button
                onClick={onOpenSearch}
                className="hidden 2xl:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200/70 dark:border-white/10 bg-white/60 dark:bg-slate-800/60 hover:bg-white/90 dark:hover:bg-slate-800/90 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-medium transition-all shadow-glass-sm group cursor-pointer backdrop-blur-md"
                title="Abrir buscador global (Ctrl + K)"
              >
                <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                <span className="text-slate-400 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200">Buscar...</span>
                <kbd className="inline-flex items-center gap-0.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100/90 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1 py-0.5 rounded shadow-2xs">
                  <span>Ctrl</span>
                  <span>K</span>
                </kbd>
              </button>

              {/* Botón de búsqueda compacto para laptops, tablets y móviles */}
              <button
                onClick={onOpenSearch}
                className="2xl:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800/80 border border-slate-200/70 dark:border-white/10 shadow-glass-sm transition-all cursor-pointer backdrop-blur-md shrink-0"
                title="Buscar (Ctrl + K)"
              >
                <Search className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </button>

              {/* Botón Abrir en Celular (Código QR) */}
              {onOpenQrModal && (
                <button
                  type="button"
                  onClick={onOpenQrModal}
                  className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-blue-200/70 dark:border-blue-800/60 bg-blue-50/70 dark:bg-blue-950/40 hover:bg-blue-100/80 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold transition-all shadow-glass-sm cursor-pointer backdrop-blur-md shrink-0"
                  title="Escanear código QR para abrir el portal en tu celular"
                >
                  <QrCode className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span className="hidden 2xl:inline">QR Móvil</span>
                </button>
              )}

              {/* Indicador de Estado de la Base de Datos (Cloud / Local) */}
              {dbStatus && (
                <button
                  type="button"
                  onClick={onOpenDbStatus}
                  className={`hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-glass-sm backdrop-blur-md cursor-pointer shrink-0 hover:scale-102 ${
                    dbStatus.database?.connected
                      ? 'border-emerald-300/70 dark:border-emerald-700/60 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
                      : 'border-amber-300 dark:border-amber-700 bg-amber-100/90 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 animate-pulse'
                  }`}
                  title={
                    dbStatus.database?.connected
                      ? 'Base de Datos Supabase Conectada. Los cambios se guardan permanentemente en la nube.'
                      : 'Aviso: Modo Memoria Temporal. Haz clic para diagnosticar.'
                  }
                >
                  <span className={`w-2 h-2 rounded-full ${dbStatus.database?.connected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <Database className="w-3.5 h-3.5" />
                  <span className="hidden 2xl:inline">
                    {dbStatus.database?.connected ? 'Nube Segura' : 'Modo Memoria'}
                  </span>
                </button>
              )}

              {/* Botón Papelera de Citas Eliminadas */}
              {onOpenDeletedModal && (
                <button
                  type="button"
                  onClick={onOpenDeletedModal}
                  className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-amber-200/70 dark:border-amber-800/60 bg-amber-50/70 dark:bg-amber-950/40 hover:bg-amber-100/80 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 text-xs font-bold transition-all shadow-glass-sm cursor-pointer backdrop-blur-md shrink-0 relative"
                  title="Papelera de citas eliminadas (Protección y restauración con 1-clic)"
                >
                  <Trash2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span className="hidden 2xl:inline">Papelera</span>
                  {deletedCount > 0 && (
                    <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px] font-black">
                      {deletedCount}
                    </span>
                  )}
                </button>
              )}

              {/* Botón Copias de Seguridad y Respaldo */}
              {onOpenBackupModal && (
                <button
                  type="button"
                  onClick={onOpenBackupModal}
                  className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-indigo-200/70 dark:border-indigo-800/60 bg-indigo-50/70 dark:bg-indigo-950/40 hover:bg-indigo-100/80 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-all shadow-glass-sm cursor-pointer backdrop-blur-md shrink-0"
                  title="Copias de seguridad en archivo JSON y guía de backups de Supabase"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span className="hidden 2xl:inline">Respaldos</span>
                </button>
              )}

              {/* Conmutador de Modo Oscuro / Claro */}
              <button
                type="button"
                onClick={onToggleTheme}
                className="p-2 rounded-xl border border-slate-200/70 dark:border-white/10 bg-white/60 dark:bg-slate-800/60 hover:bg-white/90 dark:hover:bg-slate-800/90 text-slate-600 dark:text-amber-400 transition-all cursor-pointer shadow-glass-sm backdrop-blur-md active:scale-95 shrink-0"
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
                  className="flex items-center gap-1 sm:gap-1.5 bg-emerald-50/80 dark:bg-emerald-950/60 border border-emerald-300/60 dark:border-emerald-700/60 px-2 sm:px-2.5 py-1.5 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-bold shadow-glass-sm backdrop-blur-md animate-in fade-in duration-150 shrink-0"
                  title="Modo Administrador activo"
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
                  <span className="hidden 2xl:inline">Acceso Admin</span>
                  <span className="hidden sm:inline 2xl:hidden">Admin</span>
                </button>
              )}

              {/* Botón Nueva Cita - SIEMPRE VISIBLE */}
              <button
                onClick={onNewAppointment}
                className="inline-flex items-center gap-1.5 sm:gap-2 liquid-btn-primary px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all transform active:scale-95 cursor-pointer shrink-0 whitespace-nowrap"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span className="hidden lg:inline">Nueva Cita</span>
                <span className="hidden sm:inline lg:hidden">Cita</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* DOCK FLOTANTE DE NAVEGACIÓN MÓVIL (VISIBLE SOLO EN CELULARES: < md) */}
      <nav 
        aria-label="Navegación Móvil"
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden glass-nav border-t border-slate-200/80 dark:border-white/10 backdrop-blur-2xl shadow-2xl pb-safe transition-all duration-200 no-print bg-white/95 dark:bg-[#080d1a]/95"
      >
        <div className="grid grid-cols-7 items-center px-0.5 py-1.5 max-w-md mx-auto">
          {tabs.map((tab) => {
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
                {/* Indicador activo sutil */}
                {isActive && (
                  <span className="absolute top-0 w-6 h-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full shadow-xs" />
                )}
                <div className={`p-1 rounded-lg transition-transform ${isActive ? 'scale-110 bg-blue-50 dark:bg-blue-950/60' : ''}`}>
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`} />
                </div>
                <span className="text-[8.5px] sm:text-[9.5px] font-semibold tracking-tighter truncate w-full text-center leading-tight mt-0.5">
                  {tab.mobileLabel || tab.shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
