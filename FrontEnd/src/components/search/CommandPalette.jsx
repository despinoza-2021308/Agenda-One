import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, 
  X, 
  Calendar, 
  Building2, 
  Users, 
  Zap, 
  ArrowRight, 
  Clock, 
  MapPin, 
  Video, 
  Phone, 
  Plus, 
  BarChart3, 
  MessageSquare,
  CornerDownLeft
} from 'lucide-react';
import { api } from '../../services/api';

const ESTADO_BADGES = {
  'Programada': { label: 'Programada', emoji: '🗓️', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'En Curso': { label: 'En Curso', emoji: '⏳', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'Impartida': { label: 'Impartida', emoji: '✅', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'Cancelada': { label: 'Cancelada', emoji: '❌', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  'Reprogramada': { label: 'Reprogramada', emoji: '🔄', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' }
};

const SYSTEM_ACTIONS = [
  {
    id: 'act-new-appointment',
    title: 'Nueva Cita de Capacitación',
    subtitle: 'Registrar una nueva capacitación en la agenda',
    icon: Plus,
    color: 'text-blue-600 bg-blue-50',
    type: 'accion',
    actionId: 'new-appointment'
  },
  {
    id: 'act-nav-calendar',
    title: 'Ir al Calendario Mensual / Turnos',
    subtitle: 'Vista de turnos y cuadrícula de capacitación',
    icon: Calendar,
    color: 'text-indigo-600 bg-indigo-50',
    type: 'accion',
    actionId: 'nav-calendar'
  },
  {
    id: 'act-nav-reports',
    title: 'Reporte de Horas (AD-RE-11)',
    subtitle: 'Auditoría mensual de horas efectivas y exportación',
    icon: BarChart3,
    color: 'text-emerald-600 bg-emerald-50',
    type: 'accion',
    actionId: 'nav-reports'
  },
  {
    id: 'act-nav-trainers',
    title: 'Catálogo de Capacitadores',
    subtitle: 'Administrar instructores, teléfonos y códigos',
    icon: Users,
    color: 'text-purple-600 bg-purple-50',
    type: 'accion',
    actionId: 'nav-trainers'
  },
  {
    id: 'act-nav-clients',
    title: 'Catálogo de Empresas Clientes',
    subtitle: 'Administrar empresas, contactos y teléfonos',
    icon: Building2,
    color: 'text-amber-600 bg-amber-50',
    type: 'accion',
    actionId: 'nav-clients'
  },
  {
    id: 'act-open-whatsapp',
    title: 'Notificaciones por WhatsApp',
    subtitle: 'Enviar itinerarios y recordatorios directos',
    icon: MessageSquare,
    color: 'text-emerald-600 bg-emerald-50',
    type: 'accion',
    actionId: 'open-whatsapp'
  }
];

export default function CommandPalette({
  isOpen,
  onClose,
  citas = [],
  clientes = [],
  capacitadores = [],
  onSelectCita,
  onSelectCliente,
  onSelectCapacitador,
  onExecuteAction
}) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all'); // 'all' | 'citas' | 'clientes' | 'capacitadores' | 'acciones'
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [serverCitas, setServerCitas] = useState([]);
  const [isSearchingServer, setIsSearchingServer] = useState(false);

  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Auto-focus input al abrir
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveCategory('all');
      setSelectedIndex(0);
      setServerCitas([]);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Búsqueda remota de citas pasadas/futuras (debounce)
  useEffect(() => {
    if (!isOpen || !query || query.trim().length < 2) {
      setServerCitas([]);
      setIsSearchingServer(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearchingServer(true);
        const results = await api.getCitas({ search: query.trim(), limit: 15 });
        setServerCitas(results || []);
      } catch (err) {
        console.error('Error buscando citas globales:', err);
      } finally {
        setIsSearchingServer(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [isOpen, query]);

  // Combinar citas locales y remotas sin duplicados
  const allCitasMap = useMemo(() => {
    const map = new Map();
    // Primero locales
    citas.forEach(c => map.set(c.id, c));
    // Luego remotas
    serverCitas.forEach(c => map.set(c.id, c));
    return Array.from(map.values());
  }, [citas, serverCitas]);

  // Filtrado reactivo de resultados
  const filteredItems = useMemo(() => {
    const q = query.toLowerCase().trim();

    // 1. Citas
    let matchedCitas = allCitasMap;
    if (q) {
      matchedCitas = matchedCitas.filter(c => 
        (c.tipo_servicio && c.tipo_servicio.toLowerCase().includes(q)) ||
        (c.cliente_nombre && c.cliente_nombre.toLowerCase().includes(q)) ||
        (c.capacitador_nombre && c.capacitador_nombre.toLowerCase().includes(q)) ||
        (c.estado && c.estado.toLowerCase().includes(q)) ||
        (c.fecha && c.fecha.includes(q)) ||
        (c.modalidad && c.modalidad.toLowerCase().includes(q))
      );
    }

    // 2. Clientes
    let matchedClientes = clientes;
    if (q) {
      matchedClientes = matchedClientes.filter(cl => 
        (cl.nombre_empresa && cl.nombre_empresa.toLowerCase().includes(q)) ||
        (cl.contacto_nombre && cl.contacto_nombre.toLowerCase().includes(q)) ||
        (cl.contacto_email && cl.contacto_email.toLowerCase().includes(q)) ||
        (cl.contacto_telefono && cl.contacto_telefono.includes(q))
      );
    }

    // 3. Capacitadores
    let matchedCapacitadores = capacitadores;
    if (q) {
      matchedCapacitadores = matchedCapacitadores.filter(cp => 
        (cp.nombre_completo && cp.nombre_completo.toLowerCase().includes(q)) ||
        (cp.iniciales && cp.iniciales.toLowerCase().includes(q)) ||
        (cp.telefono && cp.telefono.includes(q))
      );
    }

    // 4. Acciones
    let matchedAcciones = SYSTEM_ACTIONS;
    if (q) {
      matchedAcciones = matchedAcciones.filter(act => 
        act.title.toLowerCase().includes(q) ||
        act.subtitle.toLowerCase().includes(q)
      );
    }

    return {
      citas: matchedCitas.slice(0, 8),
      clientes: matchedClientes.slice(0, 6),
      capacitadores: matchedCapacitadores.slice(0, 6),
      acciones: matchedAcciones.slice(0, 6)
    };
  }, [allCitasMap, clientes, capacitadores, query]);

  // Lista plana de resultados navegables
  const flatResults = useMemo(() => {
    const list = [];

    if (activeCategory === 'all' || activeCategory === 'citas') {
      filteredItems.citas.forEach(c => {
        list.push({
          type: 'cita',
          id: `cita-${c.id}`,
          data: c
        });
      });
    }

    if (activeCategory === 'all' || activeCategory === 'clientes') {
      filteredItems.clientes.forEach(cl => {
        list.push({
          type: 'cliente',
          id: `cliente-${cl.id}`,
          data: cl
        });
      });
    }

    if (activeCategory === 'all' || activeCategory === 'capacitadores') {
      filteredItems.capacitadores.forEach(cp => {
        list.push({
          type: 'capacitador',
          id: `cap-${cp.id}`,
          data: cp
        });
      });
    }

    if (activeCategory === 'all' || activeCategory === 'acciones') {
      filteredItems.acciones.forEach(act => {
        list.push({
          type: 'accion',
          id: act.id,
          data: act
        });
      });
    }

    return list;
  }, [filteredItems, activeCategory]);

  // Reset selected index cuando cambia la lista
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, activeCategory]);

  // Manejo de teclado (flechas, Enter, Esc)
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < flatResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : flatResults.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flatResults[selectedIndex]) {
        handleSelectItem(flatResults[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  // Scroll automático hacia el elemento seleccionado
  useEffect(() => {
    const el = document.getElementById(`search-item-${selectedIndex}`);
    if (el) {
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  // Ejecución del elemento seleccionado
  const handleSelectItem = (item) => {
    onClose();
    if (item.type === 'cita') {
      onSelectCita?.(item.data);
    } else if (item.type === 'cliente') {
      onSelectCliente?.(item.data);
    } else if (item.type === 'capacitador') {
      onSelectCapacitador?.(item.data);
    } else if (item.type === 'accion') {
      onExecuteAction?.(item.data.actionId);
    }
  };

  if (!isOpen) return null;

  // Formato amigable de fecha
  const formatFriendlyDate = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${parseInt(day, 10)} ${months[parseInt(month, 10) - 1]} ${year}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-20 flex items-start justify-center animate-in fade-in duration-150">
      {/* Backdrop con efecto blur */}
      <div 
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Tarjeta Principal de la Paleta */}
      <div 
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden transform transition-all animate-in zoom-in-95 duration-150"
        onKeyDown={handleKeyDown}
      >
        {/* Cabecera con Input de Búsqueda */}
        <div className="relative flex items-center border-b border-slate-200 px-4 py-3.5 bg-slate-50/50">
          <Search className="w-5 h-5 text-slate-400 shrink-0 ml-1 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por curso, cliente, capacitador o fecha..."
            className="w-full bg-transparent text-slate-900 placeholder-slate-400 text-base font-medium outline-none focus:ring-0 border-none p-0"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 hover:bg-slate-200/60 rounded-lg text-slate-400 hover:text-slate-600 transition-colors mr-2"
              title="Limpiar búsqueda"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded-md shadow-xs">
            ESC
          </span>
        </div>

        {/* Barra de Filtros por Categoría */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-slate-100 bg-white overflow-x-auto text-xs">
          {[
            { id: 'all', label: 'Todos', count: flatResults.length },
            { id: 'citas', label: 'Citas', count: filteredItems.citas.length, icon: Calendar },
            { id: 'clientes', label: 'Clientes', count: filteredItems.clientes.length, icon: Building2 },
            { id: 'capacitadores', label: 'Capacitadores', count: filteredItems.capacitadores.length, icon: Users },
            { id: 'acciones', label: 'Acciones', count: filteredItems.acciones.length, icon: Zap }
          ].map((cat) => {
            const isActive = activeCategory === cat.id;
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-colors shrink-0 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                <span>{cat.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive ? 'bg-blue-500 text-white' : 'bg-slate-200/70 text-slate-600'
                }`}>
                  {cat.count}
                </span>
              </button>
            );
          })}
          {isSearchingServer && (
            <div className="ml-auto flex items-center gap-1 text-[11px] text-blue-600 font-medium animate-pulse shrink-0">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
              Buscando globalmente...
            </div>
          )}
        </div>

        {/* Contenedor de Resultados */}
        <div 
          ref={listRef}
          className="max-h-[60vh] overflow-y-auto p-2 divide-y divide-slate-100 focus:outline-none"
        >
          {flatResults.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                <Search className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-slate-800">
                No se encontraron resultados
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No encontramos coincidencias para "<span className="font-medium text-slate-700">{query}</span>". Intenta con otro término o crea una nueva cita.
              </p>
              <button
                onClick={() => {
                  onClose();
                  onExecuteAction?.('new-appointment');
                }}
                className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold transition-colors"
              >
                <Plus className="w-4 h-4" />
                Agendar Nueva Cita
              </button>
            </div>
          ) : (
            flatResults.map((item, index) => {
              const isSelected = index === selectedIndex;

              // Renderizado según tipo de elemento
              if (item.type === 'cita') {
                const cita = item.data;
                const statusInfo = ESTADO_BADGES[cita.estado] || ESTADO_BADGES['Programada'];

                return (
                  <div
                    id={`search-item-${index}`}
                    key={item.id}
                    onClick={() => handleSelectItem(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-blue-50/90 text-blue-950 ring-1 ring-blue-500/30' 
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar del Capacitador con su color */}
                      <div 
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-xs"
                        style={{ backgroundColor: cita.capacitador_color || '#3B82F6' }}
                        title={cita.capacitador_nombre}
                      >
                        {cita.capacitador_iniciales || 'CP'}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {cita.tipo_servicio}
                          </h4>
                          {/* Badge de Estado Oficial */}
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}>
                            <span>{statusInfo.emoji}</span>
                            <span>{statusInfo.label}</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5 flex-wrap">
                          <span className="font-semibold text-slate-700 flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            {cita.cliente_nombre}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {formatFriendlyDate(cita.fecha)} ({cita.hora_inicio} - {cita.hora_fin})
                          </span>
                          <span>•</span>
                          <span className="font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded">
                            {cita.horas}h
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            {cita.modalidad === 'Virtual' ? (
                              <Video className="w-3 h-3 text-sky-500" />
                            ) : (
                              <MapPin className="w-3 h-3 text-amber-500" />
                            )}
                            {cita.modalidad}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 ml-3 flex items-center gap-2">
                      <span className="text-[10px] font-medium text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded shadow-xs hidden sm:inline">
                        Abrir Cita
                      </span>
                      <ArrowRight className={`w-4 h-4 ${isSelected ? 'text-blue-600 translate-x-0.5' : 'text-slate-300'} transition-transform`} />
                    </div>
                  </div>
                );
              }

              if (item.type === 'cliente') {
                const cliente = item.data;
                return (
                  <div
                    id={`search-item-${index}`}
                    key={item.id}
                    onClick={() => handleSelectItem(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-blue-50/90 text-blue-950 ring-1 ring-blue-500/30' 
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200 shadow-xs">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {cliente.nombre_empresa}
                        </h4>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5 flex-wrap">
                          {cliente.contacto_nombre && (
                            <span>Contacto: <strong className="text-slate-700">{cliente.contacto_nombre}</strong></span>
                          )}
                          {cliente.contacto_telefono && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {cliente.contacto_telefono}
                            </span>
                          )}
                          {cliente.contacto_email && (
                            <span className="text-slate-400 truncate max-w-[150px]">{cliente.contacto_email}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 ml-3 flex items-center gap-2">
                      <span className="text-[10px] font-medium text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded shadow-xs hidden sm:inline">
                        Ver Empresa
                      </span>
                      <ArrowRight className={`w-4 h-4 ${isSelected ? 'text-blue-600 translate-x-0.5' : 'text-slate-300'} transition-transform`} />
                    </div>
                  </div>
                );
              }

              if (item.type === 'capacitador') {
                const cp = item.data;
                return (
                  <div
                    id={`search-item-${index}`}
                    key={item.id}
                    onClick={() => handleSelectItem(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-blue-50/90 text-blue-950 ring-1 ring-blue-500/30' 
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div 
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-xs"
                        style={{ backgroundColor: cp.color || '#3B82F6' }}
                      >
                        {cp.iniciales || 'CP'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {cp.nombre_completo}
                          </h4>
                          <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded border border-slate-200">
                            [{cp.iniciales}]
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                          {cp.telefono ? (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {cp.telefono}
                            </span>
                          ) : (
                            <span className="text-slate-400">Sin teléfono registrado</span>
                          )}
                          <span>•</span>
                          <span className={cp.activo ? 'text-emerald-600 font-semibold' : 'text-slate-400'}>
                            {cp.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 ml-3 flex items-center gap-2">
                      <span className="text-[10px] font-medium text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded shadow-xs hidden sm:inline">
                        Ver Perfil
                      </span>
                      <ArrowRight className={`w-4 h-4 ${isSelected ? 'text-blue-600 translate-x-0.5' : 'text-slate-300'} transition-transform`} />
                    </div>
                  </div>
                );
              }

              if (item.type === 'accion') {
                const act = item.data;
                const Icon = act.icon;
                return (
                  <div
                    id={`search-item-${index}`}
                    key={item.id}
                    onClick={() => handleSelectItem(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-blue-50/90 text-blue-950 ring-1 ring-blue-500/30' 
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${act.color} shadow-xs`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {act.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {act.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 ml-3 flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                      <span className="text-[10px] hidden sm:inline">Ejecutar</span>
                      <CornerDownLeft className="w-3.5 h-3.5" />
                    </div>
                  </div>
                );
              }

              return null;
            })
          )}
        </div>

        {/* Pie de Página con Atajos de Teclado */}
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-2.5 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px] text-slate-700 shadow-2xs">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px] text-slate-700 shadow-2xs">↓</kbd>
              <span>Navegar</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px] text-slate-700 shadow-2xs">↵</kbd>
              <span>Seleccionar</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px] text-slate-700 shadow-2xs">ESC</kbd>
              <span>Cerrar</span>
            </span>
          </div>

          <div className="text-[11px] text-slate-400 font-medium hidden sm:block">
            Agenda One • Búsqueda Global
          </div>
        </div>
      </div>
    </div>
  );
}
